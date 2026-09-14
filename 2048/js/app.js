// Rendering, input, and the powerup interaction layer.
// All board rules live in game.js; all powerup rules in powerups.js.

import {
  SIZE, createGame, move, undo, canUndo,
  hammer, swap, upgrade, spawnWildcard,
} from './game.js';
import {
  POWERUPS, POWERUP_BY_ID,
  createCharges, createMilestoneTracker, awardMilestones, nextMilestone,
} from './powerups.js';

const $ = (sel) => document.querySelector(sel);

const boardEl   = $('#board');
const tilesEl   = $('#tiles');
const gridEl    = $('#grid');
const scoreEl   = $('#score');
const bestEl    = $('#best');
const barEl     = $('#powerup-bar');
const promptEl  = $('#target-prompt');
const nextEl    = $('#next-unlock');
const overlayEl = $('#overlay');

// ---------------- State ----------------

let game;
let charges;
let claimed;           // milestone values already paid out this run
let best = 0;          // session only — a refresh starts the ladder over
let armed = null;      // powerup id currently awaiting a target
let picks = [];        // tile ids chosen so far in targeting mode
let dismissedWin = false;

// ---------------- Small helpers ----------------

function toast(message, ms = 2200) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, ms);
}

// Tile geometry is measured rather than expressed in CSS percentages, so a
// tile lands on an exact pixel at any board size.
function measure() {
  const gap = parseFloat(getComputedStyle(boardEl).getPropertyValue('--gap'));
  const inner = tilesEl.clientWidth;
  const cell = (inner - (SIZE - 1) * gap) / SIZE;
  boardEl.style.setProperty('--cell-size', `${cell}px`);
  return { gap, cell };
}

// ---------------- Rendering ----------------

function buildGrid() {
  gridEl.innerHTML = '';
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    gridEl.append(cell);
  }
}

function renderTiles() {
  const { gap, cell } = measure();
  const step = cell + gap;
  const seen = new Set();

  for (const tile of game.tiles) {
    seen.add(tile.id);
    let el = tilesEl.querySelector(`[data-id="${tile.id}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'tile';
      el.dataset.id = tile.id;
      tilesEl.append(el);
      // Position before the browser paints, so a new tile pops in place
      // instead of flying in from the top-left corner.
      el.style.setProperty('--x', `${tile.col * step}px`);
      el.style.setProperty('--y', `${tile.row * step}px`);
    }

    el.style.setProperty('--x', `${tile.col * step}px`);
    el.style.setProperty('--y', `${tile.row * step}px`);

    if (tile.wild) {
      el.textContent = '★';
      el.dataset.value = 'wild';
    } else {
      el.textContent = tile.value;
      el.dataset.value = tile.value;
    }

    el.classList.toggle('wild', !!tile.wild);
    el.classList.toggle('huge', !tile.wild && tile.value > 2048);
    el.classList.toggle('spawned', !!tile.spawned);
    el.classList.toggle('merged', !!tile.mergedFrom);
  }

  for (const el of [...tilesEl.children]) {
    if (!seen.has(Number(el.dataset.id))) el.remove();
  }

  applyTargeting();
}

function renderScore(gained = 0) {
  scoreEl.textContent = game.score.toLocaleString();
  if (game.score > best) best = game.score;
  bestEl.textContent = best.toLocaleString();
  if (gained > 0) {
    const box = scoreEl.parentElement;
    box.classList.remove('bump');
    void box.offsetWidth;   // restart the animation
    box.classList.add('bump');
  }
}

function buildPowerupBar() {
  barEl.innerHTML = '';
  for (const p of POWERUPS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'powerup';
    btn.dataset.powerup = p.id;
    btn.title = `${p.name} — ${p.blurb}`;
    btn.innerHTML =
      `<span class="icon" aria-hidden="true">${p.icon}</span>` +
      `<span class="name">${p.name}</span>` +
      `<span class="count">0</span>`;
    btn.addEventListener('click', () => onPowerupClick(p.id));
    barEl.append(btn);
  }
}

function renderPowerups() {
  for (const p of POWERUPS) {
    const btn = barEl.querySelector(`[data-powerup="${p.id}"]`);
    const count = charges[p.id];
    // Deliberately not gated on game.over: a Hammer, Swap, Upgrade or Undo on
    // a dead board is a rescue, and `ready` already rules out the ones that
    // cannot help (Wildcard needs an empty cell, Undo needs a history).
    const usable = count > 0 && p.ready(game);
    btn.querySelector('.count').textContent = count;
    btn.disabled = !usable;
    btn.classList.toggle('armed', armed === p.id);
    btn.setAttribute('aria-pressed', String(armed === p.id));
  }

  const next = nextMilestone(claimed);
  nextEl.innerHTML = next
    ? `Next unlock at <strong>${next}</strong>`
    : 'Every unlock claimed';
}

function applyTargeting() {
  const p = armed ? POWERUP_BY_ID[armed] : null;
  boardEl.classList.toggle('targeting', !!p && p.needsTarget > 0);

  for (const el of tilesEl.children) {
    const id = Number(el.dataset.id);
    const tile = game.tiles.find(t => t.id === id);
    const ok = !!p && p.needsTarget > 0 && tile && p.canTarget(tile) && !picks.includes(id);
    el.classList.toggle('targetable', ok);
    el.classList.toggle('picked', picks.includes(id));
  }
}

function renderAll(gained = 0) {
  renderTiles();
  renderScore(gained);
  renderPowerups();
  renderOverlay();
}

function renderOverlay() {
  const primary = $('#overlay-primary');
  const secondary = $('#overlay-secondary');

  // While a powerup is hunting for a target the overlay has to get out of the
  // way — it covers the very tiles being picked.
  if (armed && POWERUP_BY_ID[armed].needsTarget > 0) {
    overlayEl.hidden = true;
    return;
  }

  if (game.over) {
    const rescues = POWERUPS.filter(p => charges[p.id] > 0 && p.ready(game));
    $('#overlay-title').textContent = rescues.length ? 'Stuck' : 'Game over';
    $('#overlay-sub').textContent = rescues.length
      ? `No moves left — but you still have ${rescues.map(p => p.name).join(', ')}. Spend one to play on.`
      : `No moves left — final score ${game.score.toLocaleString()}.`;
    primary.textContent = 'New game';
    secondary.hidden = true;
    overlayEl.hidden = false;
  } else if (game.won && !dismissedWin) {
    $('#overlay-title').textContent = 'You win!';
    $('#overlay-sub').textContent = 'You built a 2048 tile. One of every powerup is yours.';
    primary.textContent = 'New game';
    secondary.hidden = false;
    overlayEl.hidden = false;
  } else {
    overlayEl.hidden = true;
  }
}

// ---------------- Milestones ----------------

// Only ever called with values produced by a merge — powerup-made tiles are
// never passed in, which is what stops Upgrade from funding itself.
function payMilestones(merges) {
  const unlocks = awardMilestones(merges, charges, claimed);
  if (!unlocks.length) return;

  const lines = unlocks.map(u => {
    const names = u.granted.map(id => POWERUP_BY_ID[id].name);
    const what = names.length === POWERUPS.length ? 'every powerup' : names.join(' + ');
    return `${u.value} unlocked ${what}!`;
  });
  toast(lines.join('  '), 3000);

  for (const u of unlocks) {
    for (const id of u.granted) {
      const btn = barEl.querySelector(`[data-powerup="${id}"]`);
      btn.classList.remove('granted');
      void btn.offsetWidth;
      btn.classList.add('granted');
    }
  }
}

// ---------------- Moves ----------------

function doMove(dir) {
  if (game.over || (game.won && !dismissedWin)) return;
  if (armed) disarm();

  const result = move(game, dir);
  if (!result.moved) return;

  payMilestones(result.merges);
  renderAll(result.gained);
}

// ---------------- Powerups ----------------

function onPowerupClick(id) {
  if (armed === id) { disarm(); renderPowerups(); return; }

  const p = POWERUP_BY_ID[id];
  if (charges[id] <= 0 || !p.ready(game)) return;

  if (p.needsTarget === 0) { fire(p); return; }

  armed = id;
  picks = [];
  promptEl.hidden = false;
  promptEl.innerHTML = p.needsTarget === 2
    ? `<strong>${p.icon} ${p.name}</strong> — pick the first tile. <kbd>Esc</kbd> to cancel.`
    : `<strong>${p.icon} ${p.name}</strong> — pick a tile. <kbd>Esc</kbd> to cancel.`;
  renderPowerups();
  renderOverlay();
  applyTargeting();
}

function disarm() {
  armed = null;
  picks = [];
  promptEl.hidden = true;
  boardEl.classList.remove('targeting');
  renderOverlay();
  applyTargeting();
}

// Run a no-target powerup. A charge is spent only if the effect took.
function fire(p) {
  let ok = false;
  if (p.id === 'undo') {
    ok = canUndo(game) && undo(game);
    if (ok) toast('↶ Move rewound');
  } else if (p.id === 'wildcard') {
    ok = spawnWildcard(game);
    if (ok) toast('★ Wildcard dropped — it merges with anything');
  }
  if (!ok) return;
  charges[p.id] -= 1;
  renderAll();
}

function onTileClick(event) {
  if (!armed) return;
  const el = event.target.closest('.tile');
  if (!el) return;

  const id = Number(el.dataset.id);
  const tile = game.tiles.find(t => t.id === id);
  const p = POWERUP_BY_ID[armed];
  if (!tile || !p.canTarget(tile)) return;
  if (picks.includes(id)) return;

  picks.push(id);

  if (picks.length < p.needsTarget) {
    promptEl.innerHTML =
      `<strong>${p.icon} ${p.name}</strong> — now pick the second tile. <kbd>Esc</kbd> to cancel.`;
    applyTargeting();
    return;
  }

  let ok = false;
  if (p.id === 'hammer') {
    ok = hammer(game, picks[0]);
    if (ok) toast('🔨 Smashed');
  } else if (p.id === 'swap') {
    ok = swap(game, picks[0], picks[1]);
    if (ok) toast('⇄ Swapped');
  } else if (p.id === 'upgrade') {
    ok = upgrade(game, picks[0]);
    if (ok) toast('⬆ Doubled');
  }

  if (ok) charges[p.id] -= 1;
  disarm();
  renderAll();
}

// ---------------- Input ----------------

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
  k: 'up', j: 'down', h: 'left', l: 'right',
};

function onKeyDown(event) {
  if (event.key === 'Escape') { disarm(); renderPowerups(); return; }
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const dir = KEYS[event.key];
  if (dir) { event.preventDefault(); doMove(dir); return; }

  // Number keys 1–5 fire the matching powerup.
  const slot = Number(event.key);
  if (slot >= 1 && slot <= POWERUPS.length) onPowerupClick(POWERUPS[slot - 1].id);
}

// Swipe. A tap in targeting mode must still reach the tile, so anything under
// the threshold is left alone for the click handler.
const SWIPE_MIN = 24;
let touchStart = null;

function onTouchStart(event) {
  const t = event.changedTouches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}

function onTouchEnd(event) {
  if (!touchStart) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
  event.preventDefault();
  doMove(Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'down' : 'up'));
}

// ---------------- Lifecycle ----------------

// `focus` is only passed when the player pressed a button: focusing on first
// load would paint a focus ring nobody asked for, and keys are bound to
// window anyway, so play never depends on it.
function newGame(focus = false) {
  game = createGame();
  charges = createCharges();
  claimed = createMilestoneTracker();
  armed = null;
  picks = [];
  dismissedWin = false;
  promptEl.hidden = true;
  tilesEl.innerHTML = '';
  overlayEl.hidden = true;
  renderAll();
  if (focus) boardEl.focus({ preventScroll: true });
}

function init() {
  if (!document.documentElement.dataset.theme) {
    document.documentElement.dataset.theme =
      window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  buildGrid();
  buildPowerupBar();

  window.addEventListener('keydown', onKeyDown);
  boardEl.addEventListener('click', onTileClick);
  boardEl.addEventListener('touchstart', onTouchStart, { passive: true });
  boardEl.addEventListener('touchend', onTouchEnd, { passive: false });
  $('#new-game').addEventListener('click', () => newGame(true));
  $('#overlay-primary').addEventListener('click', () => newGame(true));
  $('#overlay-secondary').addEventListener('click', () => {
    dismissedWin = true;
    renderOverlay();
    boardEl.focus({ preventScroll: true });
  });

  // Re-measure so tiles stay aligned through rotation and window resizing.
  new ResizeObserver(() => { if (game) renderTiles(); }).observe(boardEl);

  newGame();
}

init();
