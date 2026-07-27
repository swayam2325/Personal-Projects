// Built-in database of common generic foods (no barcode needed).
// Nutrition values are per 100 g, based on USDA FoodData Central.
// `serving` is a typical portion in grams, `servingLabel` describes it.

export const COMMON_FOODS = [
  // ---- Fruits ----
  { name: 'Apple',              emoji: '🍎', kcal: 52,  protein: 0.3,  carbs: 14,   fat: 0.2,  serving: 182, servingLabel: '1 medium' },
  { name: 'Banana',             emoji: '🍌', kcal: 89,  protein: 1.1,  carbs: 23,   fat: 0.3,  serving: 118, servingLabel: '1 medium' },
  { name: 'Orange',             emoji: '🍊', kcal: 47,  protein: 0.9,  carbs: 12,   fat: 0.1,  serving: 131, servingLabel: '1 medium' },
  { name: 'Strawberries',       emoji: '🍓', kcal: 32,  protein: 0.7,  carbs: 7.7,  fat: 0.3,  serving: 152, servingLabel: '1 cup' },
  { name: 'Blueberries',        emoji: '🫐', kcal: 57,  protein: 0.7,  carbs: 14.5, fat: 0.3,  serving: 148, servingLabel: '1 cup' },
  { name: 'Grapes',             emoji: '🍇', kcal: 69,  protein: 0.7,  carbs: 18,   fat: 0.2,  serving: 92,  servingLabel: '1 cup' },
  { name: 'Watermelon',         emoji: '🍉', kcal: 30,  protein: 0.6,  carbs: 7.6,  fat: 0.2,  serving: 280, servingLabel: '2 cups diced' },
  { name: 'Mango',              emoji: '🥭', kcal: 60,  protein: 0.8,  carbs: 15,   fat: 0.4,  serving: 165, servingLabel: '1 cup' },
  { name: 'Pineapple',          emoji: '🍍', kcal: 50,  protein: 0.5,  carbs: 13,   fat: 0.1,  serving: 165, servingLabel: '1 cup' },
  { name: 'Avocado',            emoji: '🥑', kcal: 160, protein: 2,    carbs: 8.5,  fat: 14.7, serving: 100, servingLabel: '½ medium' },
  { name: 'Peach',              emoji: '🍑', kcal: 39,  protein: 0.9,  carbs: 9.5,  fat: 0.3,  serving: 150, servingLabel: '1 medium' },

  // ---- Grains & starches ----
  { name: 'White rice (cooked)',   emoji: '🍚', kcal: 130, protein: 2.7, carbs: 28,   fat: 0.3, serving: 158, servingLabel: '1 cup' },
  { name: 'Brown rice (cooked)',   emoji: '🍚', kcal: 112, protein: 2.3, carbs: 23.5, fat: 0.8, serving: 195, servingLabel: '1 cup' },
  { name: 'Pasta (cooked)',        emoji: '🍝', kcal: 158, protein: 5.8, carbs: 31,   fat: 0.9, serving: 140, servingLabel: '1 cup' },
  { name: 'White bread',           emoji: '🍞', kcal: 265, protein: 9,   carbs: 49,   fat: 3.2, serving: 25,  servingLabel: '1 slice' },
  { name: 'Whole wheat bread',     emoji: '🍞', kcal: 247, protein: 13,  carbs: 41,   fat: 3.4, serving: 28,  servingLabel: '1 slice' },
  { name: 'Oatmeal (cooked)',      emoji: '🥣', kcal: 71,  protein: 2.5, carbs: 12,   fat: 1.5, serving: 234, servingLabel: '1 cup' },
  { name: 'Baked potato',          emoji: '🥔', kcal: 93,  protein: 2.5, carbs: 21,   fat: 0.1, serving: 173, servingLabel: '1 medium' },
  { name: 'Sweet potato (cooked)', emoji: '🍠', kcal: 86,  protein: 1.6, carbs: 20,   fat: 0.1, serving: 130, servingLabel: '1 medium' },
  { name: 'Tortilla (flour)',      emoji: '🫓', kcal: 297, protein: 8,   carbs: 50,   fat: 7,   serving: 49,  servingLabel: '1 tortilla' },
  { name: 'Bagel',                 emoji: '🥯', kcal: 257, protein: 10,  carbs: 50,   fat: 1.7, serving: 105, servingLabel: '1 bagel' },

  // ---- Protein ----
  { name: 'Chicken breast (cooked)', emoji: '🍗', kcal: 165, protein: 31,  carbs: 0,    fat: 3.6,  serving: 100, servingLabel: '1 small breast' },
  { name: 'Chicken thigh (cooked)',  emoji: '🍗', kcal: 209, protein: 26,  carbs: 0,    fat: 10.9, serving: 100, servingLabel: '1 thigh' },
  { name: 'Ground beef 85% (cooked)',emoji: '🥩', kcal: 250, protein: 26,  carbs: 0,    fat: 15,   serving: 85,  servingLabel: '3 oz' },
  { name: 'Steak (sirloin, cooked)', emoji: '🥩', kcal: 271, protein: 25,  carbs: 0,    fat: 19,   serving: 85,  servingLabel: '3 oz' },
  { name: 'Salmon (cooked)',         emoji: '🐟', kcal: 208, protein: 20,  carbs: 0,    fat: 13,   serving: 100, servingLabel: '1 fillet' },
  { name: 'Tuna (canned in water)',  emoji: '🐟', kcal: 116, protein: 26,  carbs: 0,    fat: 1,    serving: 85,  servingLabel: '3 oz' },
  { name: 'Shrimp (cooked)',         emoji: '🦐', kcal: 99,  protein: 24,  carbs: 0.2,  fat: 0.3,  serving: 85,  servingLabel: '3 oz' },
  { name: 'Egg',                     emoji: '🥚', kcal: 155, protein: 13,  carbs: 1.1,  fat: 11,   serving: 50,  servingLabel: '1 large' },
  { name: 'Egg white',               emoji: '🥚', kcal: 52,  protein: 11,  carbs: 0.7,  fat: 0.2,  serving: 33,  servingLabel: '1 large' },
  { name: 'Tofu (firm)',             emoji: '🧊', kcal: 76,  protein: 8,   carbs: 1.9,  fat: 4.8,  serving: 85,  servingLabel: '3 oz' },
  { name: 'Lentils (cooked)',        emoji: '🫘', kcal: 116, protein: 9,   carbs: 20,   fat: 0.4,  serving: 198, servingLabel: '1 cup' },
  { name: 'Chickpeas (cooked)',      emoji: '🫘', kcal: 164, protein: 8.9, carbs: 27,   fat: 2.6,  serving: 164, servingLabel: '1 cup' },
  { name: 'Black beans (cooked)',    emoji: '🫘', kcal: 132, protein: 8.9, carbs: 23.7, fat: 0.5,  serving: 172, servingLabel: '1 cup' },

  // ---- Dairy ----
  { name: 'Whole milk',          emoji: '🥛', kcal: 61,  protein: 3.2, carbs: 4.8, fat: 3.3,  serving: 244, servingLabel: '1 cup' },
  { name: 'Skim milk',           emoji: '🥛', kcal: 34,  protein: 3.4, carbs: 5,   fat: 0.1,  serving: 245, servingLabel: '1 cup' },
  { name: 'Greek yogurt (plain)',emoji: '🥛', kcal: 59,  protein: 10,  carbs: 3.6, fat: 0.4,  serving: 170, servingLabel: '1 container' },
  { name: 'Cheddar cheese',      emoji: '🧀', kcal: 403, protein: 25,  carbs: 1.3, fat: 33,   serving: 28,  servingLabel: '1 oz' },
  { name: 'Mozzarella',          emoji: '🧀', kcal: 280, protein: 28,  carbs: 3.1, fat: 17,   serving: 28,  servingLabel: '1 oz' },
  { name: 'Cottage cheese',      emoji: '🧀', kcal: 98,  protein: 11,  carbs: 3.4, fat: 4.3,  serving: 113, servingLabel: '½ cup' },
  { name: 'Butter',              emoji: '🧈', kcal: 717, protein: 0.9, carbs: 0.1, fat: 81,   serving: 14,  servingLabel: '1 tbsp' },

  // ---- Fats, nuts & spreads ----
  { name: 'Olive oil',      emoji: '🫒', kcal: 884, protein: 0,   carbs: 0,  fat: 100, serving: 14, servingLabel: '1 tbsp' },
  { name: 'Peanut butter',  emoji: '🥜', kcal: 588, protein: 25,  carbs: 20, fat: 50,  serving: 32, servingLabel: '2 tbsp' },
  { name: 'Almonds',        emoji: '🌰', kcal: 579, protein: 21,  carbs: 22, fat: 50,  serving: 28, servingLabel: '1 oz (23 nuts)' },
  { name: 'Walnuts',        emoji: '🌰', kcal: 654, protein: 15,  carbs: 14, fat: 65,  serving: 28, servingLabel: '1 oz' },

  // ---- Vegetables ----
  { name: 'Broccoli',    emoji: '🥦', kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, serving: 91,  servingLabel: '1 cup' },
  { name: 'Spinach',     emoji: '🥬', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: 30,  servingLabel: '1 cup raw' },
  { name: 'Carrot',      emoji: '🥕', kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, serving: 61,  servingLabel: '1 medium' },
  { name: 'Tomato',      emoji: '🍅', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: 123, servingLabel: '1 medium' },
  { name: 'Cucumber',    emoji: '🥒', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, serving: 100, servingLabel: '⅓ cucumber' },
  { name: 'Bell pepper', emoji: '🫑', kcal: 26, protein: 1,   carbs: 6,   fat: 0.3, serving: 119, servingLabel: '1 medium' },
  { name: 'Onion',       emoji: '🧅', kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, serving: 110, servingLabel: '1 medium' },
  { name: 'Lettuce',     emoji: '🥬', kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, serving: 36,  servingLabel: '1 cup shredded' },
  { name: 'Corn',        emoji: '🌽', kcal: 86, protein: 3.3, carbs: 19,  fat: 1.4, serving: 90,  servingLabel: '1 ear' },

  // ---- Meals & fast food ----
  { name: 'Cheese pizza',  emoji: '🍕', kcal: 266, protein: 11,  carbs: 33, fat: 10, serving: 107, servingLabel: '1 slice' },
  { name: 'Hamburger',     emoji: '🍔', kcal: 295, protein: 17,  carbs: 24, fat: 14, serving: 110, servingLabel: '1 burger' },
  { name: 'French fries',  emoji: '🍟', kcal: 312, protein: 3.4, carbs: 41, fat: 15, serving: 117, servingLabel: '1 medium' },
  { name: 'Hot dog',       emoji: '🌭', kcal: 290, protein: 10,  carbs: 24, fat: 17, serving: 100, servingLabel: '1 hot dog' },
  { name: 'Taco (beef)',   emoji: '🌮', kcal: 226, protein: 12,  carbs: 20, fat: 11, serving: 102, servingLabel: '1 taco' },
  { name: 'Sushi roll (california)', emoji: '🍣', kcal: 129, protein: 3.8, carbs: 24, fat: 1.7, serving: 170, servingLabel: '8 pieces' },

  // ---- Snacks & sweets ----
  { name: 'Potato chips',            emoji: '🍿', kcal: 536, protein: 7,   carbs: 53, fat: 35, serving: 28, servingLabel: '1 oz bag' },
  { name: 'Dark chocolate (70%)',    emoji: '🍫', kcal: 546, protein: 4.9, carbs: 61, fat: 31, serving: 28, servingLabel: '1 oz' },
  { name: 'Milk chocolate bar',      emoji: '🍫', kcal: 535, protein: 7.7, carbs: 59, fat: 30, serving: 44, servingLabel: '1 bar' },
  { name: 'Chocolate chip cookie',   emoji: '🍪', kcal: 488, protein: 5.1, carbs: 64, fat: 24, serving: 16, servingLabel: '1 cookie' },
  { name: 'Vanilla ice cream',       emoji: '🍨', kcal: 207, protein: 3.5, carbs: 24, fat: 11, serving: 66, servingLabel: '½ cup' },
  { name: 'Glazed donut',            emoji: '🍩', kcal: 452, protein: 4.9, carbs: 51, fat: 25, serving: 60, servingLabel: '1 donut' },
  { name: 'Honey',                   emoji: '🍯', kcal: 304, protein: 0.3, carbs: 82, fat: 0,  serving: 21, servingLabel: '1 tbsp' },

  // ---- Drinks ----
  { name: 'Black coffee',  emoji: '☕', kcal: 1,  protein: 0.1, carbs: 0,    fat: 0,   serving: 240, servingLabel: '1 cup' },
  { name: 'Orange juice',  emoji: '🧃', kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2, serving: 248, servingLabel: '1 cup' },
  { name: 'Cola',          emoji: '🥤', kcal: 42, protein: 0,   carbs: 10.6, fat: 0,   serving: 355, servingLabel: '1 can' },
  { name: 'Beer (lager)',  emoji: '🍺', kcal: 43, protein: 0.5, carbs: 3.6,  fat: 0,   serving: 355, servingLabel: '1 can' },
  { name: 'Red wine',      emoji: '🍷', kcal: 85, protein: 0.1, carbs: 2.6,  fat: 0,   serving: 148, servingLabel: '1 glass' },
];

// Search built-in foods by name. Returns normalized food objects
// in the same shape the Open Food Facts layer produces.
export function searchCommonFoods(query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return COMMON_FOODS
    .map(f => {
      const name = f.name.toLowerCase();
      let score = 0;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 60;
      else if (words.every(w => name.includes(w))) score = 30;
      else if (words.some(w => name.includes(w))) score = 10;
      return { food: f, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food: f }) => ({
      id: 'common:' + f.name,
      source: 'common',
      name: f.name,
      brand: 'Generic · USDA values',
      emoji: f.emoji,
      image: null,
      kcalPer100g: f.kcal,
      proteinPer100g: f.protein,
      carbsPer100g: f.carbs,
      fatPer100g: f.fat,
      servingGrams: f.serving,
      servingLabel: f.servingLabel,
    }));
}
