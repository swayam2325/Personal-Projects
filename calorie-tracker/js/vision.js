// AI meal recognition via the Claude API (vision + structured outputs).
// The photo is sent directly from the browser to api.anthropic.com using the
// user's own API key (stored locally). CORS is enabled via the
// anthropic-dangerous-direct-browser-access header — acceptable here because
// the key is the user's own and never leaves their device otherwise.

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-8';

// Structured-output schema: guarantees valid, parseable JSON.
const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    is_food: {
      type: 'boolean',
      description: 'Whether the image actually shows food or drink',
    },
    meal_name: {
      type: 'string',
      description: 'Short name for the whole meal, e.g. "Chicken rice bowl"',
    },
    items: {
      type: 'array',
      description: 'Each distinct food item visible in the image',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Food name, e.g. "Grilled chicken breast"' },
          emoji: { type: 'string', description: 'Single emoji best representing this food' },
          estimated_grams: { type: 'number', description: 'Estimated portion weight in grams' },
          kcal_per_100g: { type: 'number' },
          protein_per_100g: { type: 'number' },
          carbs_per_100g: { type: 'number' },
          fat_per_100g: { type: 'number' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: [
          'name', 'emoji', 'estimated_grams', 'kcal_per_100g',
          'protein_per_100g', 'carbs_per_100g', 'fat_per_100g', 'confidence',
        ],
        additionalProperties: false,
      },
    },
    notes: {
      type: 'string',
      description: 'One short sentence of caveats about the estimate, or empty string',
    },
  },
  required: ['is_food', 'meal_name', 'items', 'notes'],
  additionalProperties: false,
};

const PROMPT = `Analyze this photo of a meal for calorie tracking.

Identify each distinct food or drink item visible. For each item:
- Estimate the portion weight in grams using visual cues (a dinner plate is ~27 cm across, a fork is ~18 cm long, a standard glass holds ~250 ml). Be realistic — people tend to underestimate portions.
- Provide typical nutrition values per 100 g (kcal, protein, carbs, fat) based on standard nutrition databases (USDA-style values). Account for visible preparation: fried food includes oil, sauces count.
- Rate your confidence: "high" for clearly identifiable foods, "medium" when the preparation is ambiguous, "low" for mixed dishes or hidden ingredients.

Group sensibly: a mixed dish that can't be separated visually (curry, casserole, smoothie) should be a single item with combined per-100g values, not guessed sub-ingredients.

If the image does not show food or drink, set is_food to false and return an empty items array.`;

export function hasApiKeyShape(key) {
  return typeof key === 'string' && key.trim().startsWith('sk-ant-') && key.trim().length > 20;
}

// Analyze a meal photo. Returns {mealName, notes, items:[normalized food + grams]}.
export async function analyzeMealPhoto(base64Jpeg, apiKey) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        output_config: { format: { type: 'json_schema', schema: RESULT_SCHEMA } },
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg },
            },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
  } catch {
    throw new Error('Could not reach the Claude API — check your internet connection.');
  }

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key — check it in Settings.');
    if (res.status === 429) throw new Error('Rate limited by the API — wait a moment and try again.');
    if (res.status === 400) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error?.message || 'The API rejected the request.');
    }
    throw new Error(`Claude API error (${res.status}) — try again.`);
  }

  const data = await res.json();
  if (data.stop_reason === 'refusal') {
    throw new Error('The model declined to analyze this image.');
  }
  const text = data.content?.find(b => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response from the model — try again.');

  const parsed = JSON.parse(text); // structured output guarantees valid JSON
  if (!parsed.is_food || !parsed.items?.length) {
    throw new Error("Couldn't find any food in this photo — try a clearer shot of the plate.");
  }

  return {
    mealName: parsed.meal_name,
    notes: parsed.notes,
    items: parsed.items.map((it, i) => ({
      id: 'ai:' + i,
      source: 'ai',
      name: it.name,
      brand: null,
      emoji: it.emoji || '🍽️',
      image: null,
      kcalPer100g: Math.max(0, it.kcal_per_100g),
      proteinPer100g: Math.max(0, it.protein_per_100g),
      carbsPer100g: Math.max(0, it.carbs_per_100g),
      fatPer100g: Math.max(0, it.fat_per_100g),
      grams: Math.max(1, Math.round(it.estimated_grams)),
      confidence: it.confidence,
    })),
  };
}
