// Pure 2048 board logic. No DOM, no rendering, no globals — so it can be
// driven by the renderer in app.js or imported straight into node for tests.
//
// A tile is { id, value, row, col, wild, mergedFrom }. Ids are stable across
// moves, which is what lets the renderer animate a slide instead of redrawing.

export const SIZE = 4;
export const WIN_VALUE = 2048;

const DIRS = {
  up:    { dr: -1, dc: 0 },
  down:  { dr:  1, dc: 0 },
  left:  { dr: 0, dc: -1 },
  right: { dr: 0, dc:  1 },
};

let nextId = 1;
const newId = () => nextId++;

function makeTile(row, col, value, wild = false) {
  return { id: newId(), row, col, value, wild, mergedFrom: null, spawned: true };
}

// Build a board straight from a grid of values — `0`/`null` for empty, the
// string '*' for a wildcard. Used by the tests and handy for debugging.
export function fromGrid(rows, rng = Math.random) {
  const game = { tiles: [], score: 0, won: false, over: false, rng, history: [] };
  rows.forEach((cells, row) => {
    cells.forEach((cell, col) => {
      if (cell === '*') game.tiles.push(makeTile(row, col, 0, true));
      else if (cell) game.tiles.push(makeTile(row, col, cell));
    });
  });
  game.over = !canMove(game);
  return game;
}

export function toGrid(game) {
  const rows = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  for (const t of game.tiles) rows[t.row][t.col] = t.wild ? '*' : t.value;
  return rows;
}

export function createGame(rng = Math.random) {
  const game = {
    tiles: [],
    score: 0,
    won: false,
    over: false,
    rng,
    history: [],   // snapshots for Undo
  };
  addRandomTile(game);
  addRandomTile(game);
  return game;
}

// ---------------- Board helpers ----------------

export function tileAt(game, row, col) {
  return game.tiles.find(t => t.row === row && t.col === col) || null;
}

export function emptyCells(game) {
  const cells = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!tileAt(game, row, col)) cells.push({ row, col });
    }
  }
  return cells;
}

// Two tiles merge if they match — or if either is a wildcard, which matches
// anything. This single predicate is why wildcards need no special-casing in
// the slide loop below.
export function canMerge(a, b) {
  if (!a || !b) return false;
  return a.wild || b.wild || a.value === b.value;
}

// A wildcard takes the identity of whatever it absorbs. Two wildcards
// together have no value to double, so they settle for a 4.
function mergedValue(a, b) {
  if (a.wild && b.wild) return 4;
  if (a.wild) return b.value * 2;
  if (b.wild) return a.value * 2;
  return a.value * 2;
}

export function addRandomTile(game, value = null) {
  const cells = emptyCells(game);
  if (!cells.length) return null;
  const cell = cells[Math.floor(game.rng() * cells.length)];
  const v = value ?? (game.rng() < 0.9 ? 2 : 4);
  const tile = makeTile(cell.row, cell.col, v);
  game.tiles.push(tile);
  return tile;
}

// ---------------- Movement ----------------

// Cells in the order they must be processed: always start from the edge the
// tiles are travelling towards, so the leading tile settles first.
function traversal(dir) {
  const rows = [...Array(SIZE).keys()];
  const cols = [...Array(SIZE).keys()];
  if (dir.dr > 0) rows.reverse();
  if (dir.dc > 0) cols.reverse();
  const order = [];
  for (const row of rows) for (const col of cols) order.push({ row, col });
  return order;
}

function furthestPosition(game, tile, dir) {
  let { row, col } = tile;
  let next = { row: row + dir.dr, col: col + dir.dc };
  while (
    next.row >= 0 && next.row < SIZE && next.col >= 0 && next.col < SIZE &&
    !tileAt(game, next.row, next.col)
  ) {
    row = next.row;
    col = next.col;
    next = { row: row + dir.dr, col: col + dir.dc };
  }
  return { farthest: { row, col }, next };
}

/**
 * Slide every tile one direction, merging as it goes.
 * Returns { moved, gained, merges } where `merges` lists the values created
 * by merging — the caller uses it to award milestone unlocks.
 */
export function move(game, dirName) {
  const dir = DIRS[dirName];
  if (!dir || game.over) return { moved: false, gained: 0, merges: [] };

  const snapshot = snapshotOf(game);

  for (const tile of game.tiles) {
    tile.mergedFrom = null;
    tile.spawned = false;
  }

  let moved = false;
  let gained = 0;
  const merges = [];

  for (const cell of traversal(dir)) {
    const tile = tileAt(game, cell.row, cell.col);
    if (!tile) continue;

    const { farthest, next } = furthestPosition(game, tile, dir);
    const target = (next.row >= 0 && next.row < SIZE && next.col >= 0 && next.col < SIZE)
      ? tileAt(game, next.row, next.col)
      : null;

    // `mergedFrom` also acts as the once-per-move merge lock: a tile that has
    // already absorbed something this move cannot absorb again.
    if (target && !target.mergedFrom && canMerge(tile, target)) {
      const value = mergedValue(tile, target);
      target.value = value;
      target.wild = false;
      target.mergedFrom = [tile.id, target.id];
      game.tiles = game.tiles.filter(t => t.id !== tile.id);
      game.score += value;
      gained += value;
      merges.push(value);
      if (value >= WIN_VALUE) game.won = true;
      moved = true;
    } else if (farthest.row !== tile.row || farthest.col !== tile.col) {
      tile.row = farthest.row;
      tile.col = farthest.col;
      moved = true;
    }
  }

  if (moved) {
    game.history.push(snapshot);
    if (game.history.length > 64) game.history.shift();
    addRandomTile(game);
    game.over = !canMove(game);
  }

  return { moved, gained, merges };
}

export function canMove(game) {
  if (emptyCells(game).length) return true;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const tile = tileAt(game, row, col);
      if (!tile) continue;
      for (const { dr, dc } of Object.values(DIRS)) {
        const other = tileAt(game, row + dr, col + dc);
        if (other && canMerge(tile, other)) return true;
      }
    }
  }
  return false;
}

// ---------------- Undo ----------------

function snapshotOf(game) {
  return {
    tiles: game.tiles.map(t => ({ ...t })),
    score: game.score,
    won: game.won,
    over: game.over,
  };
}

export function canUndo(game) {
  return game.history.length > 0;
}

export function undo(game) {
  const snap = game.history.pop();
  if (!snap) return false;
  game.tiles = snap.tiles.map(t => ({ ...t, mergedFrom: null, spawned: false }));
  game.score = snap.score;
  game.won = snap.won;
  game.over = snap.over;
  return true;
}

// ---------------- Powerup mutators ----------------
// None of these push history or spawn a tile: a powerup is not a move.

export function hammer(game, tileId) {
  const before = game.tiles.length;
  game.tiles = game.tiles.filter(t => t.id !== tileId);
  if (game.tiles.length === before) return false;
  game.over = !canMove(game);
  return true;
}

export function swap(game, idA, idB) {
  const a = game.tiles.find(t => t.id === idA);
  const b = game.tiles.find(t => t.id === idB);
  if (!a || !b || a === b) return false;
  [a.row, b.row] = [b.row, a.row];
  [a.col, b.col] = [b.col, a.col];
  game.over = !canMove(game);
  return true;
}

export function upgrade(game, tileId) {
  const tile = game.tiles.find(t => t.id === tileId);
  if (!tile || tile.wild) return false;
  tile.value *= 2;
  // Deliberately does NOT mark game.won or report a merge: powerup-made tiles
  // must not pay out milestones, or Upgrade would fund its own next use.
  game.over = !canMove(game);
  return true;
}

export function spawnWildcard(game) {
  const cells = emptyCells(game);
  if (!cells.length) return false;
  const cell = cells[Math.floor(game.rng() * cells.length)];
  game.tiles.push(makeTile(cell.row, cell.col, 0, true));
  game.over = !canMove(game);
  return true;
}
