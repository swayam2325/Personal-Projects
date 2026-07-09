// LocalStorage-backed state: settings + per-day food log.
// Everything stays on-device; no accounts, no server.

const SETTINGS_KEY = 'nutriscan.settings';
const LOG_KEY = 'nutriscan.log';

const DEFAULT_SETTINGS = {
  calorieGoal: 2000,
  proteinGoal: 120,
  theme: 'dark',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Settings ----

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(SETTINGS_KEY, {}) };
}

export function updateSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write(SETTINGS_KEY, next);
  return next;
}

// ---- Dates ----

// Local-timezone YYYY-MM-DD key for a Date.
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---- Food log ----

function readLog() {
  return read(LOG_KEY, {});
}

export function getEntries(key) {
  return readLog()[key] || [];
}

export function addEntry(key, entry) {
  const log = readLog();
  const entries = log[key] || [];
  entries.push({
    ...entry,
    entryId: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: new Date().toISOString(),
  });
  log[key] = entries;
  write(LOG_KEY, log);
}

export function removeEntry(key, entryId) {
  const log = readLog();
  log[key] = (log[key] || []).filter(e => e.entryId !== entryId);
  if (log[key].length === 0) delete log[key];
  write(LOG_KEY, log);
}

export function clearDay(key) {
  const log = readLog();
  delete log[key];
  write(LOG_KEY, log);
}

export function clearAll() {
  localStorage.removeItem(LOG_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

// Totals for a day: kcal, protein, carbs, fat.
export function getTotals(key) {
  return getEntries(key).reduce(
    (t, e) => ({
      kcal: t.kcal + (e.kcal || 0),
      protein: t.protein + (e.protein || 0),
      carbs: t.carbs + (e.carbs || 0),
      fat: t.fat + (e.fat || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
