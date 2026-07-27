import { lookupBarcode, searchProducts } from './api.js';
import { analyzeMealPhoto, hasApiKeyShape } from './vision.js';
import { searchCommonFoods } from './foods.js';
import { BarcodeScanner } from './scanner.js';
import {
  getSettings, updateSettings,
  dateKey, getEntries, addEntry, removeEntry, clearDay, getTotals,
  listUsers, getActiveUser, setActiveUser, createUser, deleteActiveUser, migrateLegacyData,
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

  if (name !== 'scan') stopAllCameras();
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

// ---------------- Scanner (meal photo + barcode) ----------------
let scanMode = 'meal';
let mealStream = null;

function setScannerUI(live, statusText) {
  $('#scanner-viewport').classList.toggle('live', live);
  $('#scanner-status').textContent = statusText;
  $('#capture-btn').hidden = !(live && scanMode === 'meal');
}

function stopAllCameras() {
  if (scanner?.active) scanner.stop();
  if (mealStream) {
    mealStream.getTracks().forEach(t => t.stop());
    mealStream = null;
    $('#scanner-video').srcObject = null;
  }
  setScannerUI(false, 'Camera is off');
}

function setScanMode(mode) {
  if (mode === scanMode) return;
  stopAllCameras();
  scanMode = mode;
  const meal = mode === 'meal';
  $('#barcode-frame').style.display = meal ? 'none' : '';
  $('#meal-controls').hidden = !meal;
  $('#barcode-controls').hidden = meal;
  $('#scanner-off-emoji').textContent = meal ? '🍽️' : '📷';
  $('#scanner-off-text').textContent = meal
    ? 'Photograph your plate and AI estimates the calories'
    : 'Point your camera at a food barcode';
}
$('#barcode-frame').style.display = 'none'; // meal mode is the default

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

async function startBarcodeScanner() {
  if (!scanner) {
    scanner = new BarcodeScanner(
      $('#scanner-video'),
      handleBarcode,
      (msg) => setScannerUI(true, msg),
    );
  }
  setScannerUI(false, 'Starting camera…');
  await scanner.start();
  setScannerUI(true, 'Scanning… center the barcode in the frame');
}

async function startMealCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera not supported in this browser — use "Upload a photo" below.');
  }
  if (!window.isSecureContext) {
    throw new Error('Camera needs https or localhost — use "Upload a photo" below.');
  }
  setScannerUI(false, 'Starting camera…');
  mealStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
  const video = $('#scanner-video');
  video.srcObject = mealStream;
  await video.play();
  setScannerUI(true, 'Frame the whole plate, then tap the shutter');
}

$('#scanner-start').addEventListener('click', async () => {
  try {
    if (scanMode === 'meal') await startMealCamera();
    else await startBarcodeScanner();
  } catch (err) {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera permission denied — allow camera access and try again.'
      : (err.message || 'Could not start the camera.');
    setScannerUI(false, msg);
  }
});

// Downscale an image source to a JPEG base64 string (controls API token cost).
function toJpegBase64(source, width, height) {
  const MAX_EDGE = 1280;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const canvas = $('#capture-canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

$('#capture-btn').addEventListener('click', () => {
  const video = $('#scanner-video');
  if (!mealStream || video.readyState < 2) return;
  const base64 = toJpegBase64(video, video.videoWidth, video.videoHeight);
  stopAllCameras();
  analyzePhoto(base64);
});

$('#photo-upload').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  try {
    const bitmap = await createImageBitmap(file);
    const base64 = toJpegBase64(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    stopAllCameras();
    analyzePhoto(base64);
  } catch {
    toast("Couldn't read that image file");
  }
});

// ---------------- AI meal analysis ----------------
async function analyzePhoto(base64) {
  const { apiKey } = getSettings();
  if (!hasApiKeyShape(apiKey)) {
    showApiKeySheet(() => analyzePhoto(base64));
    return;
  }

  openSheet(`
    <div class="sheet-loader">
      <span class="spinner"></span>
      <p>Analyzing your meal…</p>
      <small>Identifying foods and estimating portions</small>
    </div>
  `);

  try {
    const result = await analyzeMealPhoto(base64, apiKey);
    showMealSheet(result);
  } catch (err) {
    openSheet(`
      <div class="sheet-loader">
        <div class="empty-emoji">😕</div>
        <p>${escapeHtml(err.message || 'Analysis failed')}</p>
        <button class="sheet-cancel" id="sheet-cancel">Close</button>
      </div>
    `);
    $('#sheet-cancel').addEventListener('click', closeSheet);
  }
}

function showApiKeySheet(onSaved) {
  openSheet(`
    <div class="product-header">
      <div class="product-img">🔑</div>
      <div>
        <div class="product-name">Add your Claude API key</div>
        <div class="product-brand">Needed once for AI meal recognition</div>
      </div>
    </div>
    <p class="ai-notes">Create a key at <strong>platform.claude.com</strong> → API keys. Each meal scan costs a few cents. The key is stored only on this device.</p>
    <div class="quick-form">
      <input id="key-input" type="password" placeholder="sk-ant-…" autocomplete="off" />
    </div>
    <div class="sheet-actions">
      <button class="sheet-cancel" id="sheet-cancel">Cancel</button>
      <button class="primary-btn" id="key-save">Save key</button>
    </div>
  `);
  $('#sheet-cancel').addEventListener('click', closeSheet);
  $('#key-save').addEventListener('click', () => {
    const key = $('#key-input').value.trim();
    if (!hasApiKeyShape(key)) {
      toast('That doesn’t look like a Claude API key (sk-ant-…)');
      return;
    }
    updateSettings({ apiKey: key });
    renderSettings();
    onSaved();
  });
}

function showMealSheet(result) {
  let items = [...result.items];

  openSheet(`
    <div class="product-header">
      <div class="product-img">🤖</div>
      <div>
        <div class="product-name">${escapeHtml(result.mealName)}</div>
        <div class="product-brand">AI estimate — adjust portions if needed</div>
      </div>
    </div>
    ${result.notes ? `<p class="ai-notes">${escapeHtml(result.notes)}</p>` : ''}
    <div id="ai-items"></div>
    <div class="ai-total"><span>Total</span><span id="ai-total-kcal">0 kcal</span></div>
    <div class="sheet-actions">
      <button class="sheet-cancel" id="sheet-cancel">Cancel</button>
      <button class="primary-btn" id="ai-add-all">Add to diary</button>
    </div>
  `);

  function itemKcal(it) {
    return it.kcalPer100g * (it.grams / 100);
  }

  function renderItems() {
    $('#ai-items').innerHTML = items.map((it, i) => `
      <div class="ai-item">
        <div class="ai-item-emoji">${escapeHtml(it.emoji)}</div>
        <div class="ai-item-info">
          <div class="ai-item-name">${escapeHtml(it.name)}</div>
          <div class="ai-item-meta">${fmt(it.kcalPer100g)} kcal/100g · <span class="ai-confidence ${it.confidence}">${it.confidence} confidence</span></div>
        </div>
        <input class="ai-item-grams" data-idx="${i}" type="number" min="1" max="5000" value="${it.grams}" />
        <span class="ai-item-unit">g</span>
        <div class="ai-item-kcal" id="ai-kcal-${i}">${fmt(itemKcal(it))} kcal</div>
        <button class="ai-item-remove" data-idx="${i}" aria-label="Remove ${escapeHtml(it.name)}">✕</button>
      </div>
    `).join('');

    document.querySelectorAll('.ai-item-grams').forEach(input => {
      input.addEventListener('input', () => {
        const i = Number(input.dataset.idx);
        const g = parseFloat(input.value);
        items[i].grams = Number.isFinite(g) && g > 0 ? g : 0;
        $(`#ai-kcal-${i}`).textContent = `${fmt(itemKcal(items[i]))} kcal`;
        updateTotal();
      });
    });
    document.querySelectorAll('.ai-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(Number(btn.dataset.idx), 1);
        renderItems();
        updateTotal();
      });
    });
    updateTotal();
  }

  function updateTotal() {
    const total = items.reduce((s, it) => s + itemKcal(it), 0);
    $('#ai-total-kcal').textContent = `${fmt(total)} kcal`;
    $('#ai-add-all').disabled = items.length === 0;
  }

  renderItems();

  $('#sheet-cancel').addEventListener('click', closeSheet);
  $('#ai-add-all').addEventListener('click', () => {
    const key = dateKey(currentDate);
    let total = 0;
    for (const it of items) {
      if (it.grams <= 0) continue;
      const f = it.grams / 100;
      total += it.kcalPer100g * f;
      addEntry(key, {
        name: it.name,
        brand: 'AI estimate',
        emoji: it.emoji,
        image: null,
        grams: it.grams,
        kcal: it.kcalPer100g * f,
        protein: it.proteinPer100g * f,
        carbs: it.carbsPer100g * f,
        fat: it.fatPer100g * f,
        source: 'ai',
      });
    }
    closeSheet();
    toast(`Added ${items.length} item${items.length === 1 ? '' : 's'} · ${fmt(total)} kcal`);
    renderToday();
    showView('today');
  });
}

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

// ---------------- Profiles / login ----------------
const AVATAR_EMOJIS = ['😀', '😎', '🦊', '🐼', '🦁', '🐨', '🐸', '🦄', '🌟', '🍀', '🔥', '🌊'];
let chosenEmoji = AVATAR_EMOJIS[0];

function openLogin(switching) {
  const users = listUsers();
  $('#login-close').hidden = !switching;
  $('#login-title').textContent = users.length ? "Who's tracking?" : 'Welcome to NutriScan';
  $('#login-sub').textContent = users.length
    ? 'Pick your profile — each one keeps its own goals and food log on this device.'
    : 'Create your profile to get started. You can add more later and switch anytime.';

  const grid = $('#login-profiles');
  grid.innerHTML = users.map(u => `
    <button class="profile-card" data-id="${u.id}">
      <span class="profile-card-emoji">${escapeHtml(u.emoji)}</span>
      <span class="profile-card-name">${escapeHtml(u.name)}</span>
    </button>
  `).join('') + (users.length ? `
    <button class="profile-card add" id="add-profile-card">
      <span class="profile-card-emoji">＋</span>
      <span class="profile-card-name">New profile</span>
    </button>` : '');

  grid.querySelectorAll('.profile-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      setActiveUser(card.dataset.id);
      $('#login').hidden = true;
      enterApp();
    });
  });
  $('#add-profile-card')?.addEventListener('click', () => showCreateForm(true));

  showCreateForm(users.length === 0);
  if (users.length === 0) $('#login-back').hidden = true;
  $('#login').hidden = false;
}

function showCreateForm(show) {
  $('#login-create').hidden = !show;
  $('#login-profiles').style.display = show ? 'none' : '';
  if (show) {
    $('#login-back').hidden = listUsers().length === 0;
    $('#new-user-name').value = '';
    chosenEmoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
    renderEmojiRow();
    setTimeout(() => $('#new-user-name').focus(), 100);
  }
}

function renderEmojiRow() {
  $('#emoji-row').innerHTML = AVATAR_EMOJIS.map(e =>
    `<button class="emoji-opt ${e === chosenEmoji ? 'active' : ''}" data-emoji="${e}">${e}</button>`
  ).join('');
  document.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      chosenEmoji = btn.dataset.emoji;
      renderEmojiRow();
    });
  });
}

$('#create-user-btn').addEventListener('click', () => {
  const name = $('#new-user-name').value.trim();
  if (!name) {
    toast('Enter your name first');
    return;
  }
  createUser(name, chosenEmoji);
  $('#login').hidden = true;
  enterApp(); // opens body-stats onboarding automatically for a fresh profile
});

$('#new-user-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('#create-user-btn').click();
});

$('#login-back').addEventListener('click', () => showCreateForm(false));
$('#login-close').addEventListener('click', () => { $('#login').hidden = true; });
$('#avatar-btn').addEventListener('click', () => openLogin(true));

function updateAvatar() {
  const user = getActiveUser();
  $('#avatar-btn').hidden = !user;
  if (user) {
    $('#avatar-emoji').textContent = user.emoji;
    $('#avatar-btn').title = `${user.name} — switch profile`;
  }
}

// Everything that must re-render when a profile logs in or switches.
function enterApp() {
  applyTheme(getSettings().theme);
  updateAvatar();
  renderSettings();
  currentDate = new Date();
  renderToday();
  showView('today');
  if (!getSettings().profile) openOnboarding(false);
}

// ---------------- Onboarding / profile ----------------
const LB_PER_KG = 2.20462;
const ACTIVITY_LABELS = {
  '1.2': 'mostly sitting', '1.375': 'lightly active',
  '1.55': 'active', '1.725': 'very active',
};

let obUnits = 'metric';

function segValue(id) {
  return $(`#${id} .seg-btn.active`).dataset.value;
}

function setSegValue(id, value) {
  document.querySelectorAll(`#${id} .seg-btn`).forEach(b => {
    b.classList.toggle('active', b.dataset.value === value);
  });
}

// Mifflin-St Jeor BMR × activity factor, adjusted for the goal.
function calcTargets(p) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const tdee = bmr * p.activity;
  const delta = { lose: -500, maintain: 0, gain: 300 }[p.goal];
  const kcal = Math.max(1200, Math.round((tdee + delta) / 10) * 10);
  const protein = Math.round((p.weightKg * 1.6) / 5) * 5; // ~1.6 g/kg
  return { kcal, protein };
}

function readProfileForm() {
  let heightCm, weightKg;
  if (obUnits === 'metric') {
    heightCm = parseFloat($('#ob-height-cm').value);
    weightKg = parseFloat($('#ob-weight').value);
  } else {
    const ft = parseFloat($('#ob-height-ft').value);
    const inch = parseFloat($('#ob-height-in').value) || 0;
    heightCm = (ft * 12 + inch) * 2.54;
    weightKg = parseFloat($('#ob-weight').value) / LB_PER_KG;
  }
  const age = parseFloat($('#ob-age').value);
  if (!(heightCm >= 100 && heightCm <= 250)) return null;
  if (!(weightKg >= 25 && weightKg <= 400)) return null;
  if (!(age >= 10 && age <= 100)) return null;
  return {
    units: obUnits,
    heightCm: Math.round(heightCm * 10) / 10,
    weightKg: Math.round(weightKg * 10) / 10,
    age: Math.round(age),
    sex: segValue('ob-sex'),
    activity: parseFloat($('#ob-activity').value),
    goal: segValue('ob-goal'),
  };
}

function updateObPreview() {
  const p = readProfileForm();
  if (!p) {
    $('#ob-kcal').textContent = '—';
    $('#ob-protein').textContent = '—';
    $('#ob-save').disabled = true;
    return;
  }
  const { kcal, protein } = calcTargets(p);
  $('#ob-kcal').textContent = fmt(kcal);
  $('#ob-protein').textContent = String(protein);
  $('#ob-save').disabled = false;
}

function switchUnits(next) {
  if (next === obUnits) return;
  const weightInput = $('#ob-weight');
  const w = parseFloat(weightInput.value);
  if (next === 'imperial') {
    if (Number.isFinite(w)) weightInput.value = Math.round(w * LB_PER_KG);
    const cm = parseFloat($('#ob-height-cm').value);
    if (Number.isFinite(cm)) {
      const totalIn = cm / 2.54;
      $('#ob-height-ft').value = Math.floor(totalIn / 12);
      $('#ob-height-in').value = Math.round(totalIn % 12);
    }
    $('#ob-weight-label').textContent = 'Weight (lb)';
    weightInput.min = 55; weightInput.max = 880;
  } else {
    if (Number.isFinite(w)) weightInput.value = Math.round(w / LB_PER_KG);
    const ft = parseFloat($('#ob-height-ft').value);
    const inch = parseFloat($('#ob-height-in').value) || 0;
    if (Number.isFinite(ft)) $('#ob-height-cm').value = Math.round((ft * 12 + inch) * 2.54);
    $('#ob-weight-label').textContent = 'Weight (kg)';
    weightInput.min = 25; weightInput.max = 400;
  }
  obUnits = next;
  $('#ob-height-metric').hidden = next !== 'metric';
  $('#ob-height-imperial').hidden = next !== 'imperial';
}

function openOnboarding(editing) {
  const profile = getSettings().profile;
  if (profile) {
    setSegValue('ob-sex', profile.sex);
    setSegValue('ob-goal', profile.goal);
    $('#ob-activity').value = String(profile.activity);
    $('#ob-height-cm').value = Math.round(profile.heightCm);
    $('#ob-weight').value = Math.round(profile.weightKg);
    obUnits = 'metric';
    setSegValue('ob-units', profile.units);
    switchUnits(profile.units);
    $('#ob-age').value = profile.age;
  }
  $('#ob-close').hidden = !editing;
  $('#ob-save').textContent = editing ? 'Save & update goal' : 'Start tracking';
  updateObPreview();
  $('#onboarding').hidden = false;
}

document.querySelectorAll('.segmented').forEach(seg => {
  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    seg.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (seg.id === 'scan-mode') {
      setScanMode(btn.dataset.value);
      return;
    }
    if (seg.id === 'ob-units') switchUnits(btn.dataset.value);
    updateObPreview();
  });
});

['ob-height-cm', 'ob-height-ft', 'ob-height-in', 'ob-weight', 'ob-age'].forEach(id => {
  $(`#${id}`).addEventListener('input', updateObPreview);
});
$('#ob-activity').addEventListener('change', updateObPreview);

$('#ob-save').addEventListener('click', () => {
  const p = readProfileForm();
  if (!p) {
    toast('Check your height, weight and age');
    return;
  }
  const { kcal, protein } = calcTargets(p);
  updateSettings({ profile: p, calorieGoal: kcal, proteinGoal: protein });
  $('#onboarding').hidden = true;
  renderSettings();
  renderToday();
  toast(`Daily goal set to ${fmt(kcal)} kcal`);
});

$('#ob-close').addEventListener('click', () => {
  $('#onboarding').hidden = true;
});

$('#edit-profile-btn').addEventListener('click', () => openOnboarding(true));

// ---------------- Settings ----------------
function profileSummary(p) {
  if (!p) return 'Not set up yet.';
  const height = p.units === 'imperial'
    ? (() => { const t = p.heightCm / 2.54; return `${Math.floor(t / 12)}'${Math.round(t % 12)}"`; })()
    : `${Math.round(p.heightCm)} cm`;
  const weight = p.units === 'imperial'
    ? `${Math.round(p.weightKg * LB_PER_KG)} lb`
    : `${Math.round(p.weightKg)} kg`;
  const goal = { lose: 'lose weight', maintain: 'maintain', gain: 'gain muscle' }[p.goal];
  return `${height} · ${weight} · ${p.age} yrs · ${ACTIVITY_LABELS[String(p.activity)] || 'active'} · goal: ${goal}`;
}

function renderSettings() {
  const s = getSettings();
  $('#goal-input').value = s.calorieGoal;
  $('#protein-goal-input').value = s.proteinGoal;
  $('#profile-summary').textContent = profileSummary(s.profile);
  renderApiKeyStatus();
}

// The key itself is never rendered back into the page — status only.
function renderApiKeyStatus() {
  const container = $('#api-key-status');
  const hasKey = hasApiKeyShape(getSettings().apiKey);
  if (hasKey) {
    container.innerHTML = `
      <div class="key-row">
        <span class="key-chip">✓ API key saved</span>
        <div class="key-actions">
          <button class="key-btn" id="key-replace">Replace</button>
          <button class="key-btn remove" id="key-remove">Remove</button>
        </div>
      </div>`;
    $('#key-replace').addEventListener('click', () => {
      showApiKeySheet(() => {
        closeSheet();
        renderApiKeyStatus();
        toast('API key updated');
      });
    });
    $('#key-remove').addEventListener('click', () => {
      if (!confirm('Remove the API key from this profile?')) return;
      updateSettings({ apiKey: null });
      renderApiKeyStatus();
      toast('API key removed');
    });
  } else {
    container.innerHTML = `
      <div class="key-add-row">
        <input type="password" id="key-add-input" placeholder="Paste key: sk-ant-…" autocomplete="off" />
        <button class="primary-btn" id="key-add-save">Save</button>
      </div>`;
    $('#key-add-save').addEventListener('click', () => {
      const key = $('#key-add-input').value.trim();
      if (!hasApiKeyShape(key)) {
        toast('That doesn’t look like a Claude API key (sk-ant-…)');
        return;
      }
      updateSettings({ apiKey: key });
      renderApiKeyStatus();
      toast('API key saved on this device');
    });
  }
}

$('#switch-profile-btn').addEventListener('click', () => openLogin(true));

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

$('#delete-profile-btn').addEventListener('click', () => {
  const user = getActiveUser();
  if (!user) return;
  if (!confirm(`Delete the profile "${user.name}" and all its logged food? This cannot be undone.`)) return;
  deleteActiveUser();
  toast('Profile deleted');
  openLogin(false);
});

// ---------------- Init ----------------
migrateLegacyData();
if (getActiveUser()) {
  enterApp();
} else {
  applyTheme(getSettings().theme);
  openLogin(false);
}
