import { lookupBarcode, searchProducts } from './api.js';
import { searchCommonFoods } from './foods.js';
import { BarcodeScanner } from './scanner.js';
import {
  getSettings, updateSettings,
  dateKey, getEntries, addEntry, removeEntry, clearDay, clearAll, getTotals,
} from './store.js';

const $ = (sel) => document.querySelector(sel);

const RING_CIRCUMFERENCE = 2 * Math.PI * 86; // matches r=86 in the SVG

// ---------------- State ----------------
let currentDate = new Date();
let scanner = null;
let searchAbort = null;

// ---------------- Helpers ----------------
const fmt = (n) => Math.round(n).toLocaleString();

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2400);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ---------------- Theme ----------------
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#0d0d0d' : '#f9f9f7';
}

$('#theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  updateSettings({ theme: next });
});

// ---------------- Navigation ----------------
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`#view-${name}`).classList.add('active');
  document.querySelector(`.nav-btn[data-view="${name}"]`).classList.add('active');

  if (name !== 'scan' && scanner?.active) {
    scanner.stop();
    setScannerUI(false, 'Camera is off');
  }
  if (name === 'search') $('#search-input').focus();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ---------------- Today / Diary ----------------
function dateLabel(date) {
  const today = dateKey();
  const key = dateKey(date);
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function shiftDate(days) {
  currentDate = new Date(currentDate.getTime() + days * 86400000);
  renderToday();
}

$('#date-prev').addEventListener('click', () => shiftDate(-1));
$('#date-next').addEventListener('click', () => shiftDate(1));
$('#date-label').addEventListener('click', () => { currentDate = new Date(); renderToday(); });

function renderToday() {
  const settings = getSettings();
  const key = dateKey(currentDate);
  const entries = getEntries(key);
  const totals = getTotals(key);
  const goal = settings.calorieGoal;
  const remaining = goal - totals.kcal;
  const over = remaining < 0;

  $('#date-label').textContent = dateLabel(currentDate);

  // Ring
  const pct = Math.min(totals.kcal / goal, 1);
  const ring = $('#ring-fill');
  ring.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - pct));
  ring.classList.toggle('over', over);
  const ringValue = $('#ring-value');
  ringValue.textContent = fmt(Math.abs(remaining));
  ringValue.classList.toggle('over', over);
  $('#ring-sub').textContent = over ? 'kcal over goal' : 'kcal remaining';

  // Stats
  $('#stat-goal').textContent = fmt(goal);
  $('#stat-eaten').textContent = fmt(totals.kcal);
  $('#stat-items').textContent = String(entries.length);

  // Macros — meters scale against a goal split derived from the calorie goal
  // (protein from its own target; carbs 50% / fat 30% of calories).
  const proteinGoal = settings.proteinGoal;
  const carbsGoal = (goal * 0.5) / 4;
  const fatGoal = (goal * 0.3) / 9;
  const macros = [
    ['protein', totals.protein, proteinGoal],
    ['carbs', totals.carbs, carbsGoal],
    ['fat', totals.fat, fatGoal],
  ];
  for (const [name, value, target] of macros) {
    $(`#macro-${name}`).textContent = `${Math.round(value)} g / ${Math.round(target)} g`;
    $(`#meter-${name}`).style.width = `${Math.min(value / target, 1) * 100}%`;
  }

  // Log list
  const list = $('#log-list');
  $('#log-empty').style.display = entries.length ? 'none' : '';
  list.innerHTML = entries.map(e => `
    <li class="log-item">
      <div class="log-thumb">${e.image
        ? `<img src="${escapeHtml(e.image)}" alt="" loading="lazy" />`
        : escapeHtml(e.emoji || '🍽️')}</div>
      <div class="log-info">
        <div class="log-name">${escapeHtml(e.name)}</div>
        <div class="log-meta">${fmt(e.grams)} g${e.brand ? ' · ' + escapeHtml(e.brand) : ''}</div>
      </div>
      <div class="log-kcal">${fmt(e.kcal)} <small>kcal</small></div>
      <button class="log-remove" data-id="${e.entryId}" aria-label="Remove ${escapeHtml(e.name)}">✕</button>
    </li>
  `).join('');

  list.querySelectorAll('.log-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeEntry(key, btn.dataset.id);
      renderToday();
    });
  });
}

// ---------------- Product sheet ----------------
function openSheet(html) {
  $('#sheet-body').innerHTML = html;
  $('#sheet-backdrop').hidden = false;
  $('#product-sheet').hidden = false;
}

function closeSheet() {
  $('#sheet-backdrop').hidden = true;
  $('#product-sheet').hidden = true;
}

$('#sheet-backdrop').addEventListener('click', closeSheet);

// Show a food in the bottom sheet with a portion picker.
function showFoodSheet(food) {
  const defaultGrams = food.servingGrams || 100;
  const thumb = food.image
    ? `<img src="${escapeHtml(food.image)}" alt="${escapeHtml(food.name)}" />`
    : escapeHtml(food.emoji || '🍽️');

  const chips = [];
  if (food.servingGrams) {
    chips.push({ label: `1 serving${food.servingLabel ? ` (${food.servingLabel})` : ''}`, grams: food.servingGrams });
    chips.push({ label: '½ serving', grams: Math.round(food.servingGrams / 2) });
    chips.push({ label: '2 servings', grams: food.servingGrams * 2 });
  }
  chips.push({ label: '100 g', grams: 100 });

  openSheet(`
    <div class="product-header">
      <div class="product-img">${thumb}</div>
      <div>
        <div class="product-name">${escapeHtml(food.name)}</div>
        ${food.brand ? `<div class="product-brand">${escapeHtml(food.brand)}</div>` : ''}
        <div class="product-per"><strong>${fmt(food.kcalPer100g)}</strong> kcal per 100 g</div>
      </div>
    </div>

    <div class="portion-card">
      <div class="portion-row">
        <label for="portion-grams">Portion size</label>
        <input class="portion-input" id="portion-grams" type="number" min="1" max="5000" value="${defaultGrams}" />
        <span class="portion-unit">g</span>
      </div>
      <div class="chips">
        ${chips.map(c => `<button class="chip" data-grams="${c.grams}">${escapeHtml(c.label)}</button>`).join('')}
      </div>
    </div>

    <div class="sheet-macros">
      <div class="sm-tile"><div class="sm-value" id="sm-kcal">0</div><div class="sm-label">kcal</div></div>
      <div class="sm-tile"><div class="sm-value" id="sm-protein">0 g</div><div class="sm-label">protein</div></div>
      <div class="sm-tile"><div class="sm-value" id="sm-carbs">0 g</div><div class="sm-label">carbs</div></div>
      <div class="sm-tile"><div class="sm-value" id="sm-fat">0 g</div><div class="sm-label">fat</div></div>
    </div>

    <div class="sheet-actions">
      <button class="sheet-cancel" id="sheet-cancel">Cancel</button>
      <button class="primary-btn" id="sheet-add">Add to diary</button>
    </div>
  `);

  const gramsInput = $('#portion-grams');

  function currentGrams() {
    const g = parseFloat(gramsInput.value);
    return Number.isFinite(g) && g > 0 ? g : 0;
  }

  function updatePreview() {
    const g = currentGrams();
    const f = g / 100;
    $('#sm-kcal').textContent = fmt(food.kcalPer100g * f);
    $('#sm-protein').textContent = `${Math.round(food.proteinPer100g * f)} g`;
    $('#sm-carbs').textContent = `${Math.round(food.carbsPer100g * f)} g`;
    $('#sm-fat').textContent = `${Math.round(food.fatPer100g * f)} g`;
    $('#sheet-add').disabled = g <= 0;
  }

  gramsInput.addEventListener('input', updatePreview);
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      gramsInput.value = chip.dataset.grams;
      updatePreview();
    });
  });
  updatePreview();

  $('#sheet-cancel').addEventListener('click', closeSheet);
  $('#sheet-add').addEventListener('click', () => {
    const g = currentGrams();
    if (g <= 0) return;
    const f = g / 100;
    addEntry(dateKey(currentDate), {
      name: food.name,
      brand: food.brand,
      emoji: food.emoji,
      image: food.image,
      grams: g,
      kcal: food.kcalPer100g * f,
      protein: food.proteinPer100g * f,
      carbs: food.carbsPer100g * f,
      fat: food.fatPer100g * f,
      source: food.source,
    });
    closeSheet();
    toast(`Added ${food.name} · ${fmt(food.kcalPer100g * f)} kcal`);
    renderToday();
    showView('today');
  });
}

// ---------------- Quick add ----------------
$('#quick-add-btn').addEventListener('click', () => {
  openSheet(`
    <div class="product-header">
      <div class="product-img">✏️</div>
      <div>
        <div class="product-name">Quick add</div>
        <div class="product-brand">Log anything with just a name and calories</div>
      </div>
    </div>
    <div class="quick-form">
      <input id="qa-name" type="text" placeholder="Name (e.g. Homemade curry)" maxlength="80" />
      <input id="qa-kcal" type="number" placeholder="Calories (kcal)" min="0" max="10000" inputmode="numeric" />
      <input id="qa-protein" type="number" placeholder="Protein g (optional)" min="0" max="500" inputmode="numeric" />
    </div>
    <div class="sheet-actions">
      <button class="sheet-cancel" id="sheet-cancel">Cancel</button>
      <button class="primary-btn" id="qa-add">Add to diary</button>
    </div>
  `);
  $('#sheet-cancel').addEventListener('click', closeSheet);
  $('#qa-add').addEventListener('click', () => {
    const name = $('#qa-name').value.trim() || 'Quick add';
    const kcal = parseFloat($('#qa-kcal').value);
    if (!Number.isFinite(kcal) || kcal < 0) {
      toast('Enter the calories first');
      return;
    }
    const protein = parseFloat($('#qa-protein').value) || 0;
    addEntry(dateKey(currentDate), {
      name, brand: null, emoji: '✏️', image: null,
      grams: 0, kcal, protein, carbs: 0, fat: 0, source: 'manual',
    });
    closeSheet();
    toast(`Added ${name} · ${fmt(kcal)} kcal`);
    renderToday();
  });
});

// ---------------- Scanner ----------------
function setScannerUI(live, statusText) {
  $('#scanner-viewport').classList.toggle('live', live);
  $('#scanner-status').textContent = statusText;
}

async function handleBarcode(code) {
  setScannerUI(false, `Found barcode ${code} — looking it up…`);
  try {
    const food = await lookupBarcode(code);
    if (food) {
      setScannerUI(false, 'Camera is off');
      showFoodSheet(food);
    } else {
      setScannerUI(false, `No product found for ${code}. Try searching by name instead.`);
      toast('Product not in the database yet');
    }
  } catch (err) {
    setScannerUI(false, 'Lookup failed — check your connection and try again.');
    toast(err.message || 'Lookup failed');
  }
}

async function startScanner() {
  if (!scanner) {
    scanner = new BarcodeScanner(
      $('#scanner-video'),
      handleBarcode,
      (msg) => setScannerUI(true, msg),
    );
  }
  try {
    setScannerUI(false, 'Starting camera…');
    await scanner.start();
    setScannerUI(true, 'Scanning… center the barcode in the frame');
  } catch (err) {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera permission denied — allow camera access and try again.'
      : (err.message || 'Could not start the camera.');
    setScannerUI(false, msg);
  }
}

$('#scanner-start').addEventListener('click', startScanner);

$('#manual-lookup').addEventListener('click', () => {
  const code = $('#manual-barcode').value.trim();
  if (!/^\d{6,14}$/.test(code)) {
    toast('Enter a 6–14 digit barcode');
    return;
  }
  if (scanner?.active) scanner.stop();
  handleBarcode(code);
});

$('#manual-barcode').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#manual-lookup').click();
});

// ---------------- Search ----------------
function renderResults(foods, headline) {
  const container = $('#search-results');
  if (foods.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-emoji">🔍</div><p>No foods found.</p><p class="empty-hint">Try a simpler term, or scan the barcode instead.</p></div>`;
    return;
  }
  container.innerHTML =
    (headline ? `<div class="section-label">${escapeHtml(headline)}</div>` : '') +
    foods.map((f, i) => `
      <button class="result-item" data-idx="${i}">
        <div class="result-thumb">${f.image
          ? `<img src="${escapeHtml(f.image)}" alt="" loading="lazy" />`
          : escapeHtml(f.emoji || '🍽️')}</div>
        <div class="result-info">
          <div class="result-name">${escapeHtml(f.name)}</div>
          <div class="result-brand">${escapeHtml(f.brand || '')}</div>
        </div>
        <div class="result-kcal">${fmt(f.kcalPer100g)}<small>kcal / 100 g</small></div>
      </button>
    `).join('');

  container.querySelectorAll('.result-item').forEach(btn => {
    btn.addEventListener('click', () => showFoodSheet(foods[Number(btn.dataset.idx)]));
  });
}

async function runSearch(query) {
  const local = searchCommonFoods(query);
  // Show instant local results while the network search runs.
  renderResults(local, local.length ? 'Common foods' : null);

  if (searchAbort) searchAbort.abort();
  searchAbort = new AbortController();
  const { signal } = searchAbort;

  $('#search-loader').hidden = false;
  try {
    const remote = await searchProducts(query, { signal });
    if (signal.aborted) return;
    // De-dup: don't re-list products whose name matches a local generic food.
    const merged = [...local, ...remote].slice(0, 20);
    renderResults(merged, null);
  } catch (err) {
    if (err.name === 'AbortError') return;
    if (local.length === 0) {
      $('#search-results').innerHTML = `<div class="empty-state"><div class="empty-emoji">📡</div><p>Couldn't reach Open Food Facts.</p><p class="empty-hint">Common foods still work offline — try "apple" or "rice".</p></div>`;
    }
  } finally {
    if (!signal.aborted) $('#search-loader').hidden = true;
  }
}

let searchTimer = null;
$('#search-input').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  clearTimeout(searchTimer);
  if (q.length < 2) {
    $('#search-results').innerHTML = '';
    $('#search-hint').hidden = false;
    $('#search-loader').hidden = true;
    if (searchAbort) searchAbort.abort();
    return;
  }
  $('#search-hint').hidden = true;
  searchTimer = setTimeout(() => runSearch(q), 350);
});

// ---------------- Settings ----------------
function renderSettings() {
  const s = getSettings();
  $('#goal-input').value = s.calorieGoal;
  $('#protein-goal-input').value = s.proteinGoal;
}

$('#goal-input').addEventListener('change', (e) => {
  const v = Math.min(Math.max(parseInt(e.target.value, 10) || 2000, 800), 10000);
  e.target.value = v;
  updateSettings({ calorieGoal: v });
  renderToday();
});

$('#protein-goal-input').addEventListener('change', (e) => {
  const v = Math.min(Math.max(parseInt(e.target.value, 10) || 120, 20), 400);
  e.target.value = v;
  updateSettings({ proteinGoal: v });
  renderToday();
});

$('#clear-day-btn').addEventListener('click', () => {
  if (!confirm("Clear everything logged for the selected day?")) return;
  clearDay(dateKey(currentDate));
  renderToday();
  toast('Day cleared');
});

$('#clear-all-btn').addEventListener('click', () => {
  if (!confirm('Erase ALL logged food and settings? This cannot be undone.')) return;
  clearAll();
  applyTheme(getSettings().theme);
  renderSettings();
  renderToday();
  toast('All data erased');
});

// ---------------- Init ----------------
applyTheme(getSettings().theme);
renderSettings();
renderToday();
