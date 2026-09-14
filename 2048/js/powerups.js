// Powerup definitions, charge tracking, and the milestone ladder that hands
// charges out. Adding a sixth powerup should mean adding one object here.

import { canUndo, emptyCells } from './game.js';

export const POWERUPS = [
  {
    id: 'undo',
    icon: '↶',
    name: 'Undo',
    blurb: 'Rewind the last move — board and score both.',
    needsTarget: 0,
    // Available only if there is a move to take back.
    ready: (game) => canUndo(game),
  },
  {
    id: 'hammer',
    icon: '🔨',
    name: 'Hammer',
    blurb: 'Smash one tile off the board.',
    needsTarget: 1,
    ready: (game) => game.tiles.length > 0,
    canTarget: () => true,
  },
  {
    id: 'swap',
    icon: '⇄',
    name: 'Swap',
    blurb: 'Exchange the positions of two tiles.',
    needsTarget: 2,
    ready: (game) => game.tiles.length > 1,
    canTarget: () => true,
  },
  {
    id: 'upgrade',
    icon: '⬆',
    name: 'Upgrade',
    blurb: 'Double one tile: 256 becomes 512.',
    needsTarget: 1,
    ready: (game) => game.tiles.some(t => !t.wild),
    // A wildcard has no value to double.
    canTarget: (tile) => !tile.wild,
  },
  {
    id: 'wildcard',
    icon: '★',
    name: 'Wildcard',
    blurb: 'Drop a ★ tile that merges with anything it meets.',
    needsTarget: 0,
    ready: (game) => emptyCells(game).length > 0,
  },
];

export const POWERUP_BY_ID = Object.fromEntries(POWERUPS.map(p => [p.id, p]));

// Each rung pays out once per run, the first time a merge creates that value.
// Beyond 2048 every doubling pays one charge of everything.
export const MILESTONES = {
  32:   ['undo'],
  64:   ['hammer'],
  128:  ['undo'],
  256:  ['swap'],
  512:  ['upgrade'],
  1024: ['wildcard'],
  2048: POWERUPS.map(p => p.id),
};

const JACKPOT_FROM = 2048;

export function createCharges() {
  return Object.fromEntries(POWERUPS.map(p => [p.id, 0]));
}

export function createMilestoneTracker() {
  return new Set();
}

/**
 * Award charges for the values a move just created. Only merge-made values
 * should ever reach this — powerup-made tiles are excluded at the call site
 * so Upgrade cannot bootstrap itself.
 *
 * Returns [{ value, granted: [id, ...] }] for the unlocks that actually fired.
 */
export function awardMilestones(values, charges, claimed) {
  const unlocks = [];
  for (const value of values) {
    if (claimed.has(value)) continue;
    let granted = MILESTONES[value];
    // Anything at or above 2048 that isn't in the table (4096, 8192, …) is a
    // jackpot rung: one charge of everything.
    if (!granted && value >= JACKPOT_FROM) granted = POWERUPS.map(p => p.id);
    if (!granted) continue;
    claimed.add(value);
    for (const id of granted) charges[id] += 1;
    unlocks.push({ value, granted });
  }
  return unlocks;
}

export function nextMilestone(claimed) {
  const rungs = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);
  return rungs.find(v => !claimed.has(v)) ?? null;
}
