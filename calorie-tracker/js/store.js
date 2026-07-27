// LocalStorage-backed state with multi-profile support.
// Each profile ("user") gets its own namespaced settings + food log.
// Everything stays on-device; no accounts, no server.

const USERS_KEY = 'nutriscan.users';
const ACTIVE_KEY = 'nutriscan.active';
const LEGACY_SETTINGS_KEY = 'nutriscan.settings';
const LEGACY_LOG_KEY = 'nutriscan.log';

const DEFAULT_SETTINGS = {
  calorieGoal: 2000,
  proteinGoal: 120,
  theme: 'dark',
  profile: null, // { units, heightCm, weightKg, age, sex, activity, goal }
  apiKey: null,  // Claude API key for AI meal recognition (stays on-device)
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

// ---- Profiles ----

function dataKey(userId, suffix) {
  return `nutriscan.u.${userId}.${suffix}`;
}

export function listUsers() {
  return read(USERS_KEY, []);
}

export function getActiveUser() {
  const id = read(ACTIVE_KEY, null);
  return listUsers().find(u => u.id === id) || null;
}

export function setActiveUser(id) {
  write(ACTIVE_KEY, id);
}

export function createUser(name, emoji) {
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name.trim(),
    emoji,
    createdAt: new Date().toISOString(),
  };
  const users = listUsers();
  users.push(user);
  write(USERS_KEY, users);
  setActiveUser(user.id);
  return user;
}

export function deleteActiveUser() {
  const user = getActiveUser();
  if (!user) return;
  localStorage.removeItem(dataKey(user.id, 'settings'));
  localStorage.removeItem(dataKey(user.id, 'log'));
  write(USERS_KEY, listUsers().filter(u => u.id !== user.id));
  localStorage.removeItem(ACTIVE_KEY);
}

// One-time migration: data saved before profiles existed becomes
// the first profile, so nothing already logged is lost.
export function migrateLegacyData() {
  if (listUsers().length > 0) return;
  const legacySettings = read(LEGACY_SETTINGS_KEY, null);
  const legacyLog = read(LEGACY_LOG_KEY, null);
  if (!legacySettings && !legacyLog) return;
  const user = createUser('Me', '🙂');
  if (legacySettings) write(dataKey(user.id, 'settings'), legacySettings);
  if (legacyLog) write(dataKey(user.id, 'log'), legacyLog);
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
  localStorage.removeItem(LEGACY_LOG_KEY);
}

function activeId() {
  return getActiveUser()?.id ?? null;
}

// ---- Settings (per profile) ----

export function getSettings() {
  const id = activeId();
  if (!id) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...read(dataKey(id, 'settings'), {}) };
}

export function updateSettings(patch) {
  const id = activeId();
  if (!id) return getSettings();
  const next = { ...getSettings(), ...patch };
  write(dataKey(id, 'settings'), next);
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

// ---- Food log (per profile) ----

function readLog() {
  const id = activeId();
  return id ? read(dataKey(id, 'log'), {}) : {};
}

function writeLog(log) {
  const id = activeId();
  if (id) write(dataKey(id, 'log'), log);
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
  writeLog(log);
}

export function removeEntry(key, entryId) {
  const log = readLog();
  log[key] = (log[key] || []).filter(e => e.entryId !== entryId);
  if (log[key].length === 0) delete log[key];
  writeLog(log);
}

export function clearDay(key) {
  const log = readLog();
  delete log[key];
  writeLog(log);
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
