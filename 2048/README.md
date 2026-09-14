# ★ 2048 Powerups

Classic 2048 with an earned powerup layer. No build step, no dependencies,
no server — open `index.html` and play.

## Play

Slide with **arrow keys**, **WASD**, **HJKL**, or a **swipe**. Equal tiles
merge; every move that changes the board spawns a new 2 (or, one time in ten,
a 4). Build a 2048 tile to win, then keep going for as long as the board lets
you.

Keys **1–5** fire the matching powerup, **Esc** cancels a powerup that is
waiting for a target.

## Powerups

| | Powerup | Effect |
|---|---|---|
| ↶ | **Undo** | Rewinds the last move — board and score both. Charges stack, so three of them walk you back three moves. |
| 🔨 | **Hammer** | Pick a tile; it's destroyed. For the stranded 2 that's jamming a whole column. |
| ⇄ | **Swap** | Pick two tiles; they exchange places. For the two 512s that ended up in opposite corners. |
| ⬆ | **Upgrade** | Pick a tile; it doubles. 256 becomes 512. |
| ★ | **Wildcard** | Drops a ★ tile that merges with **anything** it slides into, becoming double that tile's value. Two wildcards meeting settle for a 4. |

A powerup is armed by clicking it, not spent — the board dims, valid tiles
get an outline, and the charge is only deducted once the effect actually
lands.

**A dead board is not necessarily the end.** If you run out of moves while
holding a charge, the game says *Stuck* rather than *Game over*: smash a tile,
swap a pair, or rewind, and play continues.

## Earning them

Powerups are earned, never bought. Each rung pays out **once per game**, the
first time a **merge** creates that tile:

| Tile | Grant |
|------|-------|
| 32 | ↶ Undo |
| 64 | 🔨 Hammer |
| 128 | ↶ Undo |
| 256 | ⇄ Swap |
| 512 | ⬆ Upgrade |
| 1024 | ★ Wildcard |
| 2048 — and every doubling above | one of **everything** |

Tiles created *by a powerup* don't count. Without that rule Upgrade would pay
for its own next use, and the economy would collapse into an infinite loop.

## Code

| File | What's in it |
|------|--------------|
| `js/game.js` | Board rules — sliding, merging, spawning, undo history, and the powerup mutators. Pure: no DOM, no globals, so it runs under node as easily as in a browser. |
| `js/powerups.js` | Powerup definitions, the milestone ladder, charge tracking. Adding a sixth powerup is one object. |
| `js/app.js` | Rendering, input, targeting mode, overlays. |
| `css/styles.css` | Design tokens with a light and dark palette; tiles are absolutely positioned and animated with transforms. |

The theme follows the operating system's light/dark preference.

Score and best score live in memory only — a refresh starts you fresh.

### Tests

`game.js` and `powerups.js` are pure ES modules, so they can be driven
straight from node. `fromGrid` / `toGrid` build and read a board by value:

```js
import { fromGrid, toGrid, move } from './js/game.js';

const g = fromGrid([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
move(g, 'left');
toGrid(g)[0];   // [4, 8, 0, 0]
```

`'*'` in a grid is a wildcard tile.
