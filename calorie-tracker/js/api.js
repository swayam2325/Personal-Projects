// Open Food Facts API layer.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Free, no API key, CORS-enabled. Data is ODbL-licensed.

const OFF_BASE = 'https://world.openfoodfacts.org';

const PRODUCT_FIELDS = [
  'code', 'product_name', 'brands', 'quantity', 'serving_size',
  'image_front_url', 'image_front_small_url', 'nutriments',
].join(',');

// Parse "30 g", "2 x 15g", "250ml" etc. into grams (treat ml ≈ g).
function parseServingGrams(servingSize) {
  if (!servingSize) return null;
  const m = String(servingSize).match(/([\d.,]+)\s*(g|ml)/i);
  if (!m) return null;
  const grams = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(grams) && grams > 0 ? Math.round(grams) : null;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Normalize an OFF product object into the app's food shape.
function normalizeProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};

  let kcal100 = num(n['energy-kcal_100g']);
  // Some entries only carry kJ — convert.
  if (kcal100 == null) {
    const kj = num(n['energy_100g'] ?? n['energy-kj_100g']);
    if (kj != null) kcal100 = kj / 4.184;
  }
  if (kcal100 == null) return null; // useless without calories

  const servingGrams = parseServingGrams(p.serving_size);
  const name = (p.product_name || '').trim();
  if (!name) return null;

  return {
    id: 'off:' + p.code,
    source: 'off',
    barcode: p.code,
    name,
    brand: (p.brands || '').split(',')[0].trim() || null,
    emoji: '🍽️',
    image: p.image_front_small_url || p.image_front_url || null,
    kcalPer100g: Math.round(kcal100 * 10) / 10,
    proteinPer100g: num(n.proteins_100g) ?? 0,
    carbsPer100g: num(n.carbohydrates_100g) ?? 0,
    fatPer100g: num(n.fat_100g) ?? 0,
    servingGrams,
    servingLabel: p.serving_size || null,
  };
}

// Look up a single product by barcode. Returns a normalized food or null.
export async function lookupBarcode(barcode) {
  const code = String(barcode).replace(/\D/g, '');
  if (!code) throw new Error('Invalid barcode');
  const url = `${OFF_BASE}/api/v2/product/${code}.json?fields=${PRODUCT_FIELDS}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts error (${res.status})`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalizeProduct(data.product);
}

// Full-text product search. Returns an array of normalized foods.
export async function searchProducts(query, { pageSize = 12, signal } = {}) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    fields: PRODUCT_FIELDS,
  });
  const res = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`, { signal });
  if (!res.ok) throw new Error(`Open Food Facts error (${res.status})`);
  const data = await res.json();
  return (data.products || [])
    .map(normalizeProduct)
    .filter(Boolean);
}
