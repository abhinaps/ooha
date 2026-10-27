// Pixel-art generator for the Flower Dodger sprite set (player, ghosts, flowers, lives, flower progress).
//
// Run:    npx tsx scripts/gen-character.mts            (writes playerFrames.ts + public/character/*.svg + review page)
// Check:  npx tsx scripts/gen-character.mts --check    (fails if generated files are stale)
// Other:  --out <dir>  override the website root, --json <file> dump every grid as JSON (preview tooling)
//
// Rules every grid obeys (see docs/Pixel-art-rebuild.md):
//   * rows are equal-length strings, "." is transparent, any other character is a PALETTE key
//   * fills never touch the grid edge, so the 4-neighbour outline pass can always add its border
//   * every sprite has the exact source size the game logic expects (EXPECTED_SIZE below)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OLD_FRAMES, OLD_GAME_SPRITES, OLD_PALETTE } from "./legacy-character-art.mjs";

const argValue = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const websiteRoot = argValue("--out") ? path.resolve(argValue("--out") as string) : path.join(repoRoot, "ooha-website");
const outputTypeScript = path.join(websiteRoot, "src", "game", "playerFrames.ts");
const outputDirectory = path.join(websiteRoot, "public", "character");
const reviewPage = path.join(websiteRoot, "public", "character-review.html");

type Cell = string;
type Grid = Cell[][];
type Pt = [number, number];
interface Frame { width: number; height: number; rows: string[] }

// ---------------------------------------------------------------------------------------------
// Palette. One character per colour; every sprite family owns a light / mid / dark ramp so
// shapes read with depth (light from the top-left, shade on the bottom-right).
// ---------------------------------------------------------------------------------------------
const PALETTE: Record<string, string> = {
  o: "#1a1520", // outline, shared by every sprite

  // player: skin, hair, eye
  s: "#edb468", S: "#c98f50", k: "#f9cf8e",
  h: "#2a2633", g: "#1d1a26", H: "#4d4760",
  y: "#1a1520",
  // player: red shirt (torso), near sleeve, far sleeve
  r: "#b81919", q: "#dc3a35", R: "#7f1111",
  a: "#cb2626", b: "#ea4c44",
  A: "#901515", B: "#5f0d0d",
  // player: black trousers (near leg, far leg), grey shoes (near, far)
  p: "#36323f", n: "#5d576e", P: "#1d1a26",
  N: "#1f1c28",
  w: "#d6d3cf", x: "#f7f6f3", W: "#8a8890",
  z: "#a6a4ab", Z: "#656370",

  // ghost "cyclops": purple body, lavender eye ring, magenta pupil
  u: "#876899", v: "#a687b9", U: "#5c4071", d: "#39294a",
  l: "#beb0c7", L: "#8f7da0",
  m: "#c13fd2", M: "#7d3194", e: "#4a2b63",
  // ghost "angry": light red body with four tones for depth
  C: "#ffd6cc", O: "#ffb8ae", c: "#ff9f98", D: "#ee7a7c", E: "#c9525e",

  // hearts
  i: "#e82124", I: "#ff5a4a", j: "#821616", X: "#ffffff",
  t: "#5d5c70", T: "#7c7b92", V: "#3f3e50",

  // flowers: blue hibiscus
  "1": "#8cc1f0", "2": "#4a8fe0", "3": "#0f5aa8", "4": "#f2ea1b", "5": "#f08c2a",
  // flowers: leaf greens (shared)
  G: "#28511e", F: "#44701f", J: "#6a9a34", K: "#8fbd4e",
  // flowers: red mushroom (stands in for the pink flower)
  "6": "#fe4e4e", "7": "#c92f3b", "8": "#ff8a80", "9": "#ddd2e6",
  // flowers: cream bells (stands in for the gold flower)
  Q: "#fdf8e5", f: "#ecdfb4", "0": "#c8aa72",
  // flower progress: unfilled grey
  Y: "#a9adb9",
};

// ---------------------------------------------------------------------------------------------
// Expected source sizes: the "pixel requirement" of every design.
// ---------------------------------------------------------------------------------------------
const PLAYER_W = 18;
const PLAYER_H = 29;
const PRONE_W = 24;
const EXPECTED_SIZE: Record<string, [number, number]> = {
  stand: [PLAYER_W, PLAYER_H], front: [PLAYER_W, PLAYER_H],
  run0: [PLAYER_W, PLAYER_H], run1: [PLAYER_W, PLAYER_H], run2: [PLAYER_W, PLAYER_H],
  run3: [PLAYER_W, PLAYER_H], run4: [PLAYER_W, PLAYER_H], run5: [PLAYER_W, PLAYER_H],
  jumpUp: [PLAYER_W, PLAYER_H], jumpTuck: [PLAYER_W, PLAYER_H], jumpFall: [PLAYER_W, PLAYER_H],
  land: [PLAYER_W, PLAYER_H],
  duckFall0: [PRONE_W, 20], duckFall1: [PRONE_W, 13], duckRise0: [PRONE_W, 14],
  duck0: [PRONE_W, 10], duck1: [PRONE_W, 10], duck2: [PRONE_W, 10], duck3: [PRONE_W, 10],
  ghostAngry: [16, 16], ghostCyclops: [16, 16],
  flowerBlue: [13, 13], flowerPink: [13, 13], flowerGold: [13, 13],
  heartFull: [13, 12], heartEmpty: [13, 12],
};
for (const flower of ["flowerBlue", "flowerPink", "flowerGold"]) {
  for (let amount = 0; amount <= 3; amount += 1) EXPECTED_SIZE[`${flower}Progress${amount}`] = [13, 13];
}

// ---------------------------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------------------------
const newGrid = (width: number, height: number): Grid => Array.from(
  { length: height },
  () => Array<Cell>(width).fill("."),
);

const put = (grid: Grid, x: number, y: number, color: Cell): void => {
  const row = grid[y];
  if (row && x >= 0 && x < row.length) row[x] = color;
};

const rect = (grid: Grid, x: number, y: number, width: number, height: number, color: Cell): void => {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) put(grid, column, row, color);
  }
};

const line = (grid: Grid, x0: number, y0: number, x1: number, y1: number, color: Cell, thickness = 1): void => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(x0 + ((x1 - x0) * step) / steps);
    const y = Math.round(y0 + ((y1 - y0) * step) / steps);
    rect(grid, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
  }
};

/** Stamp an ASCII template (spaces and "." are transparent) onto the grid at (x, y). */
const stamp = (grid: Grid, x: number, y: number, template: string[]): void => {
  template.forEach((row, dy) => [...row].forEach((cell, dx) => {
    if (cell !== "." && cell !== " ") put(grid, x + dx, y + dy, cell);
  }));
};

/** 4-neighbour outline: every transparent cell touching a filled cell becomes outline `o`. */
const outline = (grid: Grid, key: Cell = "o"): string[] => {
  const filled = grid.map((row) => row.map((cell) => cell !== "."));
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (filled[y][x]) continue;
      if (filled[y - 1]?.[x] || filled[y + 1]?.[x] || filled[y][x - 1] || filled[y][x + 1]) grid[y][x] = key;
    }
  }
  return grid.map((row) => row.join(""));
};

// ---------------------------------------------------------------------------------------------
// Depth pass ("rim shading"): light comes from the top-left. A mid-tone cell with open air above or
// to the left takes its light tone; one with open air (or a different material) below or to the
// right takes its dark tone. Round limbs therefore get a lit top/left edge and a shaded
// bottom/right edge without hand-placing every pixel.
// ---------------------------------------------------------------------------------------------
const FAMILY: Record<string, string> = {
  r: "shirt", q: "shirt", R: "shirt",
  a: "sleeve", b: "sleeve",
  A: "farSleeve", B: "farSleeve",
  p: "pants", n: "pants", P: "pants",
  N: "farPants",
  w: "shoe", x: "shoe", W: "shoe",
  z: "farShoe", Z: "farShoe",
  i: "heart", I: "heart", j: "heart",
  t: "emptyHeart", T: "emptyHeart", V: "emptyHeart",
};
const RIM: Record<string, { light?: string; dark?: string; topOnly?: boolean }> = {
  r: { light: "q", dark: "R" },
  p: { light: "n", dark: "P", topOnly: true },
  N: { light: "p", dark: "P", topOnly: true },
  w: { light: "x", dark: "W" },
  z: { light: "w", dark: "Z" },
  i: { light: "I", dark: "j" },
  t: { light: "T", dark: "V" },
};

// Near-side parts sit in front of whatever is to their left, so that edge catches light too.
const FRONT_FAMILIES = new Set(["shoe"]);

const rim = (grid: Grid): void => {
  const source = grid.map((row) => [...row]);
  const empty = (x: number, y: number): boolean => (source[y]?.[x] ?? ".") === ".";
  const different = (x: number, y: number, family: string): boolean => {
    const cell = source[y]?.[x] ?? ".";
    return cell === "." || FAMILY[cell] !== family;
  };
  for (let y = 0; y < source.length; y += 1) {
    for (let x = 0; x < source[y].length; x += 1) {
      const ramp = RIM[source[y][x]];
      if (!ramp) continue;
      const family = FAMILY[source[y][x]];
      const lit = empty(x, y - 1)
        || (!ramp.topOnly && (empty(x - 1, y) || (FRONT_FAMILIES.has(family) && different(x - 1, y, family))));
      if (lit && ramp.light) grid[y][x] = ramp.light;
      else if ((different(x, y + 1, family) || different(x + 1, y, family)) && ramp.dark) grid[y][x] = ramp.dark;
    }
  }
  // Seam: shirt pixels touching a near sleeve or hand take the shadow tone, so the arm reads as a
  // separate shape in front of the torso instead of one red blob.
  const seamSource = grid.map((row) => [...row]);
  for (let y = 0; y < seamSource.length; y += 1) {
    for (let x = 0; x < seamSource[y].length; x += 1) {
      if (seamSource[y][x] !== "a" && seamSource[y][x] !== "s") continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const neighbour = seamSource[y + dy]?.[x + dx];
        if (neighbour === "r" || neighbour === "q") grid[y + dy][x + dx] = "R";
      }
    }
  }
};

// ---------------------------------------------------------------------------------------------
// PLAYER (18x29). Built from joints, not hand-placed pixels: head template + torso block + four
// two-segment limbs. References: player-1/2/3 (run), jump-frame (air poses).
// Body plan (rows):  head 1-8 | shirt 9-16 | hips 17-18 | legs 18-26 | shoes 27-28 (sole on row 28)
// ---------------------------------------------------------------------------------------------
const HEAD_RUN = [
  "..h.h.h..",
  ".hhhhhhh.",
  ".hHHhhhhh",
  "hhhhhhhss",
  ".hhhhssys",
  "..hhsssss",
  "...hsssS.",
  "....SSS..",
];

const HEAD_FRONT = [
  ".h.hh.h.",
  ".hhhhhh.",
  "hhHhhHhh",
  "hhhhhhhh",
  "hssssssh",
  "hsyssysh",
  "hssssssh",
  ".SSSSSS.",
];

interface Leg { knee: Pt; ankle: Pt; foot: "flat" | "down" }
interface Arm { elbow: Pt; fist: Pt }
interface UprightSpec {
  hip?: number;        // row where the trousers start (17 standing); the upper body follows it
  dx?: number;         // horizontal shift of head, torso and shoulders
  head?: string[];
  headDx?: number;
  headDy?: number;
  torsoRows?: number;
  nearLeg: Leg;
  farLeg: Leg;
  nearArm: Arm;
  farArm: Arm;
  nearHip?: Pt;
  farHip?: Pt;
}

const drawShoe = (grid: Grid, leg: Leg, key: string): void => {
  const [ax, ay] = leg.ankle;
  if (leg.foot === "flat") rect(grid, ax - 1, ay + 1, 5, 2, key);
  else rect(grid, ax - 1, ay + 1, 2, 3, key);
};

const drawLeg = (grid: Grid, hip: Pt, leg: Leg, key: string, shoe: string): void => {
  line(grid, hip[0], hip[1], leg.knee[0], leg.knee[1], key, 3);
  line(grid, leg.knee[0], leg.knee[1], leg.ankle[0], leg.ankle[1], key, 3);
  drawShoe(grid, leg, shoe);
};

const drawArm = (grid: Grid, shoulder: Pt, arm: Arm, sleeve: string, hand: string): void => {
  line(grid, shoulder[0], shoulder[1], arm.elbow[0], arm.elbow[1], sleeve, 2);
  line(grid, arm.elbow[0], arm.elbow[1], arm.fist[0], arm.fist[1], sleeve, 2);
  rect(grid, arm.fist[0], arm.fist[1], 2, 2, hand);
};

const upright = (spec: UprightSpec): string[] => {
  const grid = newGrid(PLAYER_W, PLAYER_H);
  const hip = spec.hip ?? 17;
  const dy = hip - 17;
  const dx = spec.dx ?? 0;
  const nearShoulder: Pt = [9 + dx, 10 + dy];
  const farShoulder: Pt = [8 + dx, 10 + dy];

  drawArm(grid, farShoulder, spec.farArm, "A", "S");
  drawLeg(grid, spec.farHip ?? [9, hip + 1], spec.farLeg, "N", "z");
  rect(grid, 7, hip, 6, 2, "p");                                   // hips
  drawLeg(grid, spec.nearHip ?? [10, hip + 1], spec.nearLeg, "p", "w");
  rect(grid, 6 + dx, 9 + dy, 7, spec.torsoRows ?? 8, "r");        // shirt
  rect(grid, 9 + dx, 9 + dy, 2, 1, "S");                           // collar / neck
  stamp(grid, 5 + dx + (spec.headDx ?? 0), 1 + dy + (spec.headDy ?? 0), spec.head ?? HEAD_RUN);
  drawArm(grid, nearShoulder, spec.nearArm, "a", "s");
  rim(grid);
  return outline(grid);
};

// ---- run cycle: one leg trajectory, replayed half a cycle later by the other leg --------------
// Offsets are relative to the hip column (x) and absolute rows. P0 contact, P1 down, P2 passing,
// P3 push-off, P4 knee up, P5 swing forward.
const LEG_PHASE: Leg[] = [
  { knee: [12, 22], ankle: [13, 26], foot: "flat" },  // P0 reach
  { knee: [12, 22], ankle: [11, 26], foot: "flat" },  // P1 down
  { knee: [10, 22], ankle: [9, 26], foot: "flat" },   // P2 passing, planted
  { knee: [8, 22], ankle: [5, 25], foot: "down" },    // P3 push-off, toe down
  { knee: [12, 20], ankle: [8, 23], foot: "down" },   // P4 knee up, shin back
  { knee: [13, 21], ankle: [13, 24], foot: "flat" },  // P5 swing forward
];
// Arm swing, relative to the shoulder (9, 10): Q0 back .. Q3 forward-high .. Q5 coming back.
const ARM_PHASE: Array<{ e: Pt; f: Pt }> = [
  { e: [-3, 3], f: [-4, 5] },
  { e: [-2, 3], f: [-2, 6] },
  { e: [0, 3], f: [1, 5] },
  { e: [3, 3], f: [5, 0] },
  { e: [2, 3], f: [4, 1] },
  { e: [-1, 3], f: [-3, 5] },
];
const armAt = (phase: number, dy: number): Arm => {
  const q = ARM_PHASE[((phase % 6) + 6) % 6];
  return { elbow: [9 + q.e[0], 10 + dy + q.e[1]], fist: [9 + q.f[0], 10 + dy + q.f[1]] };
};

const RUN_BOB = [0, 1, 0, 0, 1, 0];
const runFrame = (index: number): string[] => upright({
  hip: 17 + RUN_BOB[index],
  nearLeg: LEG_PHASE[index],
  farLeg: LEG_PHASE[(index + 3) % 6],
  nearArm: armAt(index, RUN_BOB[index]),
  farArm: armAt(index + 3, RUN_BOB[index]),
});

const FRAMES: Record<string, Frame> = {};
const addFrame = (key: string, rows: string[]): void => {
  FRAMES[key] = { width: rows[0].length, height: rows.length, rows };
};
for (let index = 0; index < 6; index += 1) addFrame(`run${index}`, runFrame(index));

addFrame("stand", upright({
  nearLeg: { knee: [11, 22], ankle: [11, 26], foot: "flat" },
  farLeg: { knee: [8, 22], ankle: [8, 26], foot: "flat" },
  nearArm: { elbow: [9, 13], fist: [9, 15] },
  farArm: { elbow: [7, 13], fist: [7, 15] },
}));

// ---- air poses (jump-frame reference): rise with arms up, apex with arms spread, fall with arms low
addFrame("jumpUp", upright({
  hip: 18,
  nearLeg: { knee: [10, 23], ankle: [9, 26], foot: "flat" },
  farLeg: { knee: [12, 23], ankle: [7, 25], foot: "down" },
  nearArm: { elbow: [15, 9], fist: [15, 4] },
  farArm: { elbow: [4, 9], fist: [3, 4] },
}));

addFrame("jumpTuck", upright({
  hip: 21,
  nearLeg: { knee: [14, 22], ankle: [11, 26], foot: "flat" },
  farLeg: { knee: [12, 23], ankle: [8, 26], foot: "flat" },
  nearArm: { elbow: [13, 15], fist: [15, 12] },
  farArm: { elbow: [5, 14], fist: [2, 12] },
}));

addFrame("jumpFall", upright({
  hip: 18,
  nearLeg: { knee: [12, 23], ankle: [13, 26], foot: "flat" },
  farLeg: { knee: [9, 23], ankle: [5, 24], foot: "down" },
  nearArm: { elbow: [12, 14], fist: [14, 16] },
  farArm: { elbow: [5, 14], fist: [3, 16] },
}));

addFrame("land", upright({
  hip: 23,
  dx: 1,
  nearLeg: { knee: [14, 24], ankle: [13, 26], foot: "flat" },
  farLeg: { knee: [5, 25], ankle: [4, 26], foot: "flat" },
  nearArm: { elbow: [12, 19], fist: [14, 17] },
  farArm: { elbow: [6, 19], fist: [4, 21] },
}));

// ---- front view: the only symmetric frame (character-select / landing page)
{
  const grid = newGrid(PLAYER_W, PLAYER_H);
  rect(grid, 3, 10, 2, 5, "A");   // left sleeve
  rect(grid, 13, 10, 2, 5, "a");  // right sleeve
  rect(grid, 3, 15, 2, 2, "S");   // left hand
  rect(grid, 13, 15, 2, 2, "s");  // right hand
  rect(grid, 6, 17, 3, 10, "N");  // left leg
  rect(grid, 9, 17, 3, 10, "p");  // right leg
  rect(grid, 5, 27, 4, 2, "z");
  rect(grid, 9, 27, 4, 2, "w");
  rect(grid, 5, 9, 8, 8, "r");    // shirt
  stamp(grid, 5, 1, HEAD_FRONT);
  rim(grid);
  addFrame("front", outline(grid));
}

// ---------------------------------------------------------------------------------------------
// PRONE / TRANSITION FRAMES (24 wide). References: ground-0 (crawl), mid-rise (stand-up), jump-frame (crouch).
// Ground is the last filled row; the outline pass adds the ground line underneath it (bottom row).
// ---------------------------------------------------------------------------------------------
const HEAD_SMALL = [
  ".hhhh.",
  "hhHhhs",
  "hhhsys",
  ".hhsss",
  "..SSS.",
];
const HEAD_SMALL_DOWN = [
  ".hhhh.",
  "hhHhhh",
  "hhhhss",
  ".hhsys",
  "..SSss",
];

const limb = (grid: Grid, points: Pt[], thickness: number, color: Cell): void => {
  for (let index = 1; index < points.length; index += 1) {
    line(grid, points[index - 1][0], points[index - 1][1], points[index][0], points[index][1], color, thickness);
  }
};

type LegState = "bent" | "mid" | "ext";
const crawlLeg = (grid: Grid, state: LegState, near: boolean): void => {
  const pants = near ? "p" : "N";
  const shoe = near ? "w" : "z";
  if (state === "bent") {
    limb(grid, [[7, 5], [10, 7]], 3, pants);
    limb(grid, [[10, 8], [5, 8]], 2, pants);
    rect(grid, 2, 7, 3, 2, shoe);
  } else if (state === "mid") {
    limb(grid, [[7, 5], [4, 7]], 3, pants);
    rect(grid, 1, 7, 3, 2, shoe);
  } else {
    limb(grid, [[7, 5], [4, 6]], 3, pants);
    rect(grid, 1, 5, 2, 3, shoe);
  }
};

const crawl = (near: LegState, far: LegState, nearReach: number, farReach: number): string[] => {
  const grid = newGrid(PRONE_W, 10);
  limb(grid, [[14, 5], [farReach, 7]], 2, "A");
  rect(grid, farReach, 7, 2, 2, "S");
  crawlLeg(grid, far, false);
  rect(grid, 5, 3, 5, 4, "p");               // hips
  crawlLeg(grid, near, true);
  rect(grid, 9, 3, 8, 4, "r");               // shirt
  stamp(grid, 17, 1, HEAD_SMALL);
  limb(grid, [[15, 5], [nearReach, 7]], 2, "a");
  rect(grid, nearReach, 7, 2, 2, "s");
  rim(grid);
  return outline(grid);
};
addFrame("duck0", crawl("bent", "ext", 17, 21));
addFrame("duck1", crawl("mid", "mid", 18, 21));
addFrame("duck2", crawl("ext", "bent", 21, 17));
addFrame("duck3", crawl("mid", "mid", 21, 18));

// duckFall0 (24x20): crouch tipping forward, hands about to hit the floor.
{
  const grid = newGrid(PRONE_W, 20);
  limb(grid, [[13, 10], [19, 15], [20, 18]], 2, "A");
  rect(grid, 19, 17, 2, 2, "S");
  limb(grid, [[8, 13], [12, 16], [7, 17]], 3, "N");
  rect(grid, 4, 17, 4, 2, "z");
  rect(grid, 7, 11, 5, 4, "p");
  limb(grid, [[8, 13], [13, 16], [6, 17]], 3, "p");
  rect(grid, 3, 17, 5, 2, "w");
  limb(grid, [[9, 11], [14, 8]], 5, "r");          // torso, shoulders forward and low
  stamp(grid, 14, 4, HEAD_SMALL_DOWN);
  limb(grid, [[14, 10], [17, 14], [18, 17]], 2, "a");
  rect(grid, 17, 17, 2, 2, "s");
  rim(grid);
  addFrame("duckFall0", outline(grid));
}

// duckFall1 (24x13): almost flat, feet kicked up behind.
{
  const grid = newGrid(PRONE_W, 13);
  limb(grid, [[14, 7], [19, 10]], 2, "A");
  rect(grid, 19, 10, 2, 2, "S");
  limb(grid, [[6, 5], [2, 2]], 3, "N");
  rect(grid, 1, 1, 3, 2, "z");
  rect(grid, 5, 4, 4, 4, "p");
  limb(grid, [[6, 6], [3, 4]], 3, "p");
  rect(grid, 1, 3, 3, 2, "w");
  limb(grid, [[9, 6], [15, 7]], 4, "r");
  stamp(grid, 16, 4, HEAD_SMALL_DOWN);
  limb(grid, [[14, 8], [17, 10]], 2, "a");
  rect(grid, 17, 10, 2, 2, "s");
  rim(grid);
  addFrame("duckFall1", outline(grid));
}

// duckRise0 (24x14): hips high, hands planted, about to stand (mid-rise reference).
{
  const grid = newGrid(PRONE_W, 14);
  limb(grid, [[14, 6], [15, 10], [15, 12]], 2, "A");
  rect(grid, 15, 11, 2, 2, "S");
  limb(grid, [[8, 9], [11, 11]], 3, "N");
  rect(grid, 4, 11, 5, 2, "z");
  rect(grid, 7, 7, 5, 4, "p");
  limb(grid, [[8, 10], [11, 11], [6, 11]], 3, "p");
  rect(grid, 3, 11, 5, 2, "w");
  limb(grid, [[10, 8], [14, 5]], 5, "r");
  stamp(grid, 15, 1, HEAD_SMALL);
  limb(grid, [[14, 6], [18, 9], [19, 11]], 2, "a");
  rect(grid, 19, 11, 2, 2, "s");
  rim(grid);
  addFrame("duckRise0", outline(grid));
}

// ---------------------------------------------------------------------------------------------
// GAME SPRITES. Silhouettes are authored as ASCII (x = body); `tone` then lays a light-to-shade
// gradient across the body (light top-left, shade bottom-right) so every sprite has real depth.
// ---------------------------------------------------------------------------------------------
const GAME_SPRITES: Record<string, Frame> = {};
const addSprite = (key: string, rows: string[]): void => {
  GAME_SPRITES[key] = { width: rows[0].length, height: rows.length, rows };
};

const fromAscii = (rows: string[]): Grid => rows.map((row) => [...row]);

/** Replace every `marker` cell with a tone from `keys` (light -> dark) following a diagonal gradient. */
const tone = (grid: Grid, marker: Cell, keys: string[], weightX = 0.6, weightY = 1): void => {
  const cells: Array<[number, number, number]> = [];
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (cell === marker) cells.push([x, y, x * weightX + y * weightY]);
  }));
  const lo = Math.min(...cells.map((cell) => cell[2]));
  const hi = Math.max(...cells.map((cell) => cell[2]));
  for (const [x, y, value] of cells) {
    const t = hi === lo ? 0 : (value - lo) / (hi - lo);
    grid[y][x] = keys[Math.min(keys.length - 1, Math.floor(t * keys.length))];
  }
};

const ellipse = (grid: Grid, cx: number, cy: number, rx: number, ry: number, color: Cell): void => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.02) put(grid, x, y, color);
    }
  }
};

// ---- ghost "cyclops" (ghost-1 reference): horned purple blob, one big square eye, frown.
// The legs are gone: two tapering tails float under the body, with a loose wisp, like ghost-2.
{
  const grid = fromAscii([
    "................",
    "..x..........x..",
    "..xx........xx..",
    "..xxxxxxxxxxxx..",
    "..xxxxxxxxxxxx..",
    "..xxxxxxxxxxxx..",
    ".xxxxxxxxxxxxxx.",
    ".xxxxxxxxxxxxxx.",
    ".xxxxxxxxxxxxxx.",
    ".xxxxxxxxxxxxxx.",
    "..xxxxxxxxxxxx..",
    "..xxxxxxxxxxxx..",
    "..xxxxxxxxxxxx..",
    "...xxxx..xxxx...",
    "....xx.....x....",
    "................",
  ]);
  tone(grid, "x", ["v", "u", "u", "u", "U"], 0.5, 0.9);
  stamp(grid, 4, 4, ["dddddddd"]);                                  // heavy brow
  stamp(grid, 5, 5, [".llll.", "lmmmml", "lmeeml", "lmeeml", "lmmmml", ".llll."]);
  stamp(grid, 7, 11, ["dd"]);                                       // frown top
  put(grid, 6, 12, "d");
  put(grid, 9, 12, "d");
  addSprite("ghostCyclops", outline(grid, "d"));
}

// ---- ghost "angry" (ghost-2 reference), recoloured light red. Five tones give it depth.
{
  const grid = fromAscii([
    "................",
    ".....xxxxxx.....",
    "....xxxxxxxx....",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxxxx.",
    "...xxxxxxxxxxxx.",
    ".xxxxxxxxxxxxx..",
    ".xxxxxxxxxxxx...",
    "..xxxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "...xxxxxxxxxx...",
    "....xxxxxxxxx...",
    "....xxxxxxxxxx..",
    "...xxxx.xxxx.xx.",
    "....xx...xx...x.",
    "................",
  ]);
  tone(grid, "x", ["C", "O", "c", "c", "D", "E"], 0.7, 1);
  stamp(grid, 4, 5, ["oo....oo", ".oo..oo."]);                       // slanted angry eyes
  stamp(grid, 7, 8, [".oo.", "oooo", ".oo."]);                       // open mouth
  addSprite("ghostAngry", outline(grid));
}

// ---- hearts (Hearts.png reference, redrawn on 13x12)
const HEART = [
  ".............",
  "..xxxx.xxxx..",
  ".xxxx...xxxx.",
  ".xxxxxxxxxxx.",
  ".xxxxxxxxxxx.",
  ".xxxxxxxxxxx.",
  "..xxxxxxxxx..",
  "...xxxxxxx...",
  "....xxxxx....",
  ".....xxx.....",
  "......x......",
  ".............",
];
{
  const full = fromAscii(HEART).map((row) => row.map((cell) => (cell === "x" ? "i" : cell)));
  rim(full);
  put(full, 2, 2, "X");
  put(full, 2, 3, "X");
  addSprite("heartFull", outline(full));
  const empty = fromAscii(HEART).map((row) => row.map((cell) => (cell === "x" ? "t" : cell)));
  rim(empty);
  addSprite("heartEmpty", outline(empty));
}

// ---- flower blue: hibiscus (flower-1 reference)
{
  const grid = newGrid(13, 13);
  const petals: Array<[number, number]> = [[4.1, 3.8], [7.9, 3.8], [9.2, 7.4], [6, 9.7], [2.8, 7.4]];
  for (const [cx, cy] of petals) ellipse(grid, cx, cy, 2.3, 2.2, "2");
  for (const [cx, cy] of petals) ellipse(grid, cx - 0.7, cy - 0.7, 1.1, 1.0, "1");
  for (const angle of [-90, -18, 54, 126, 198]) {
    const rad = (angle * Math.PI) / 180;
    line(grid, 6 + Math.cos(rad) * 1.2, 6.4 + Math.sin(rad) * 1.2, 6 + Math.cos(rad) * 4.2, 6.4 + Math.sin(rad) * 4.2, "3");
  }
  ellipse(grid, 6, 6.4, 1.6, 1.6, "3");
  line(grid, 6, 6, 8, 3, "4");
  put(grid, 9, 2, "4");
  put(grid, 6, 6, "5");
  put(grid, 7, 5, "5");
  put(grid, 10, 10, "J");
  put(grid, 11, 10, "F");
  put(grid, 10, 11, "F");
  addSprite("flowerBlue", outline(grid));
}

// ---- flower pink slot: red spotted mushroom (flower-2 reference)
addSprite("flowerPink", outline(fromAscii([
  ".............",
  "....88666....",
  "..8XX666667..",
  ".88X966XX677.",
  ".866666X9677.",
  ".666XX666677.",
  "..777777777..",
  "....Qfff0....",
  "....Qfff0....",
  "....Qfff0....",
  "...Qfffff0...",
  "...ffffff0...",
  ".............",
])));

// ---- flower gold slot: cream bells on a green stem (flower-3 reference)
addSprite("flowerGold", outline(fromAscii([
  ".............",
  "........fQf..",
  ".......QQQff.",
  ".......Qfff0.",
  "..fQf..0f0f0.",
  ".QQQff.F.....",
  ".Qfff0.F..KK.",
  ".0f0f0.F.KJF.",
  "..K....FKJFF.",
  ".KJK...FJF...",
  ".KJFFFFFF....",
  "..FFFGGF.....",
  ".............",
])));

// ---- flower progress: the flower fills from the bottom, one third per flower collected.
for (const flower of ["flowerBlue", "flowerPink", "flowerGold"]) {
  const base = GAME_SPRITES[flower].rows;
  for (let amount = 0; amount <= 3; amount += 1) {
    const firstFilledRow = Math.ceil(13 * (1 - amount / 3));
    addSprite(`${flower}Progress${amount}`, base.map((row, y) => (
      [...row].map((cell) => (y < firstFilledRow && cell !== "." && cell !== "o" ? "Y" : cell)).join("")
    )));
  }
}

// ---------------------------------------------------------------------------------------------
// Validation: the pixel requirements, enforced.
// ---------------------------------------------------------------------------------------------
const OUTLINE_KEY: Record<string, string> = { ghostCyclops: "d" };
const GROUNDED = (key: string): boolean => EXPECTED_SIZE[key]?.[0] === PLAYER_W && EXPECTED_SIZE[key]?.[1] === PLAYER_H;

const validateGridCollection = (collection: Record<string, Frame>, label: string, palette: Record<string, string> = PALETTE, legacy = false): void => {
  const problems: string[] = [];
  for (const [key, frame] of Object.entries(collection)) {
    const expected = EXPECTED_SIZE[key];
    if (!expected) { problems.push(`${label} "${key}" has no EXPECTED_SIZE entry`); continue; }
    if (frame.width !== expected[0] || frame.height !== expected[1] || frame.rows.length !== frame.height) {
      problems.push(`${label} "${key}" is ${frame.width}x${frame.rows.length}, expected ${expected[0]}x${expected[1]}`);
      continue;
    }
    if (legacy) continue;               // previous art keeps its own (older) conventions; size is all we enforce
    const outlineKey = OUTLINE_KEY[key] ?? "o";
    const seen = new Set<string>();
    const report = (message: string): void => {
      const tag = `${label} "${key}" ${message.split(" at ")[0]}`;
      if (!seen.has(tag)) { seen.add(tag); problems.push(`${label} "${key}" ${message}`); }
    };
    frame.rows.forEach((row, y) => {
      if (row.length !== frame.width) { report(`row ${y} is ${row.length} wide, expected ${frame.width}`); return; }
      [...row].forEach((cell, x) => {
        if (cell !== "." && !(cell in palette)) report(`uses unknown palette key "${cell}" at ${x},${y}`);
        const onEdge = x === 0 || y === 0 || x === frame.width - 1 || (y === frame.height - 1 && !GROUNDED(key));
        if (onEdge && cell !== "." && cell !== outlineKey) report(`has fill touching the grid edge at ${x},${y}`);
        if (cell !== "." && cell !== outlineKey) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (frame.rows[y + dy]?.[x + dx] === ".") report(`silhouette is not closed at ${x},${y}`);
          }
        }
      });
    });
    if (!frame.rows[frame.height - 1].split("").some((cell) => cell !== ".")) {
      problems.push(`${label} "${key}" has an empty bottom row: the sprite would float above its anchor`);
    }
  }
  if (problems.length) throw new Error(`Sprite validation failed:\n  - ${problems.join("\n  - ")}`);
};

const validateFrames = (): void => {
  validateGridCollection(FRAMES, "Player frame");
  validateGridCollection(GAME_SPRITES, "Game sprite");
  const missing = Object.keys(EXPECTED_SIZE).filter((key) => !(key in FRAMES) && !(key in GAME_SPRITES));
  if (missing.length) throw new Error(`Missing sprites: ${missing.join(", ")}`);
};

// ---------------------------------------------------------------------------------------------
// Output: TypeScript module, one SVG per grid, review page
// ---------------------------------------------------------------------------------------------
const entriesToTs = (collection: Record<string, Frame>): string => Object.entries(collection)
  .map(([key, frame]) => `  ${key}: {\n    width: ${frame.width},\n    height: ${frame.height},\n    rows: [\n${frame.rows.map((row) => `      ${JSON.stringify(row)},`).join("\n")}\n    ],\n  },`)
  .join("\n");

const toTypeScript = (): string => {
  const paletteEntries = Object.entries(PALETTE)
    .map(([key, color]) => `  ${JSON.stringify(key)}: ${JSON.stringify(color)},`)
    .join("\n");
  return `// Generated by scripts/gen-character.mts. Edit the generator, not this file.
export const PLAYER_PALETTE = {
${paletteEntries}
} as const;

export const PLAYER_FRAMES = {
${entriesToTs(FRAMES)}
} as const;

export const GAME_SPRITES = {
${entriesToTs(GAME_SPRITES)}
} as const;

/** Particle colours that match the flower sprites (blue hibiscus, red mushroom, cream bells). */
export const FLOWER_PARTICLE_HEX = {
  blue: ${JSON.stringify(PALETTE["2"])},
  pink: ${JSON.stringify(PALETTE["6"])},
  gold: ${JSON.stringify(PALETTE.f)},
} as const;

/** Earlier artwork, kept for compatibility. */
export const OLD_PLAYER_PALETTE = ${JSON.stringify(OLD_PALETTE, null, 2)} as const;

export const OLD_PLAYER_FRAMES = {
${entriesToTs(OLD_FRAMES)}
} as const;

export const OLD_GAME_SPRITES = {
${entriesToTs(OLD_GAME_SPRITES)}
} as const;

export type PlayerFrameKey = keyof typeof PLAYER_FRAMES;
export type GameSpriteKey = keyof typeof GAME_SPRITES;
`;
};

const toSvg = (frame: Frame, palette: Record<string, string> = PALETTE): string => {
  const cells: string[] = [];
  frame.rows.forEach((row, y) => {
    [...row].forEach((character, x) => {
      if (character !== ".") cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[character]}"/>`);
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frame.width} ${frame.height}" shape-rendering="crispEdges">${cells.join("")}</svg>\n`;
};

const toSlug = (key: string): string => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

// ---------------------------------------------------------------------------------------------
// Review page (animation previews read the same timing constants the game uses)
// ---------------------------------------------------------------------------------------------
interface PreviewTiming {
  jumpVelocity: number; gravity: number; runFrameMs: number; duckFrameMs: number;
  duckInMs: number; riseMs: number; landSquashMs: number; apexBand: number;
}
const toReviewPage = (previewTiming: PreviewTiming): string => {
  const playerCard = (key: string, className = "", old = false): string => (
    `<figure class="${className}"><img src="character/${old ? "old-" : ""}${Object.hasOwn(FRAMES, key) ? key : toSlug(key)}.svg" alt="${old ? "Old " : ""}${key} pixel-art frame"><figcaption>${old ? "old-" : ""}${key}</figcaption></figure>`
  );
  const section = (title: string, cards: string, className = ""): string => (
    `<section class="${className}"><h2>${title}</h2><div class="cards">${cards}</div></section>`
  );
  const animationPreview = (title: string, frameKey: string, className: string, label: string, decoration = ""): string => {
    const frame = FRAMES[frameKey];
    const decorationMarkup = decoration === "low-ghost"
      ? '<img class="animation-ghost" data-animation-ghost="jump-preview" src="character/ghost-angry.svg" alt="" aria-hidden="true">'
      : decoration === "high-ghost"
        ? '<img class="animation-ghost animation-ghost-high" data-animation-ghost="duck-preview" src="character/ghost-cyclops.svg" alt="" aria-hidden="true">'
        : decoration === "flowers"
          ? `<div class="flower-counter" aria-hidden="true"><span data-flower-count>0/3</span>${["flower-blue", "flower-pink", "flower-gold"].map((key, index) => `<img data-collected-flower="${index}" src="character/${key}.svg" alt="">`).join("")}</div>${["flower-blue", "flower-pink", "flower-gold"].map((key, index) => `<img class="animation-flower" data-animation-flower="${index}" src="character/${key}.svg" alt="" aria-hidden="true">`).join("")}`
          : "";
    return `<figure class="animation-card ${className}"><div class="animation-stage"><img class="animation-sprite" data-animation-preview="${className}" src="character/${frameKey}.svg" alt="" aria-hidden="true" style="--sprite-width:${frame.width * 2}px;--sprite-height:${frame.height * 2}px">${decorationMarkup}</div><figcaption>${title} · ${label}</figcaption></figure>`;
  };
  const runCards = Array.from({ length: 6 }, (_, index) => playerCard(`run${index}`)).join("\n");
  const previewCards = [
    animationPreview("Running", "run0", "run-preview", "collects all 3 flowers", "flowers"),
    animationPreview("Jumping", "jumpUp", "jump-preview", "jumps over a low ghost", "low-ghost"),
    animationPreview("Ducking", "run0", "duck-preview", "ducks under a high ghost", "high-ghost"),
  ].join("\n");
  const poseCards = ["stand", "jumpUp", "jumpTuck", "jumpFall", "land", "front"]
    .map((key) => playerCard(key)).join("\n");
  const duckCards = Array.from({ length: 4 }, (_, index) => playerCard(`duck${index}`, "wide"))
    .join("\n");
  const transitionCards = ["duckFall0", "duckFall1", "duckRise0"]
    .map((key) => playerCard(key, "wide")).join("\n");
  const ghostCards = ["ghostAngry", "ghostCyclops"]
    .map((key) => playerCard(key, "large-icon")).join("\n");
  const flowerCards = ["flowerBlue", "flowerPink", "flowerGold"]
    .map((key) => playerCard(key, "large-icon")).join("\n");
  const heartCards = ["heartFull", "heartEmpty"]
    .map((key) => playerCard(key, "heart")).join("\n");
  const progressRows = [0, 1, 2, 3].map((amount) => (
    `<div class="progress-row" aria-label="${amount} of 3 collected">${["flowerBlue", "flowerPink", "flowerGold"]
      .map((key) => `<img src="character/${toSlug(`${key}Progress${amount}`)}.svg" alt="" aria-hidden="true" width="39" height="39">`).join("")}</div>`
  )).join("\n");
  const oldPlayerCards = Object.keys(OLD_FRAMES)
    .map((key) => playerCard(key, key.startsWith("duck") ? "wide" : "", true))
    .join("\n");
  const oldSpriteCards = Object.keys(OLD_GAME_SPRITES)
    .filter((key) => !key.endsWith("Progress0") && !key.endsWith("Progress1") && !key.endsWith("Progress2") && !key.endsWith("Progress3"))
    .map((key) => `<figure class="large-icon"><img src="character/old-${toSlug(key)}.svg" alt="Old ${key} pixel-art"><figcaption>old-${key}</figcaption></figure>`).join("\n");
  const paletteCards = Object.entries(PALETTE)
    .map(([key, color]) => `<span class="swatch" title="${key} ${color}"><i style="background:${color}"></i>${key}</span>`).join("");
  const previewDimensions = Object.fromEntries(
    Object.entries(FRAMES).map(([key, frame]) => [
      key,
      { width: frame.width * 2, height: frame.height * 2 },
    ]),
  );
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OOHA pixel-art review</title>
<style>
  *{box-sizing:border-box}body{margin:0;padding:24px;background:#171c2c;color:#e9eaf0;font:14px system-ui,sans-serif}
  h1{margin:0 0 24px;font-size:24px}h2{margin:24px 0 10px;color:#c6cad7;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
  section{margin:0 0 20px}.cards{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
  figure{min-width:100px;min-height:150px;margin:0;padding:12px 16px;display:grid;place-items:center;align-content:center;gap:8px;background:#f7f6f2;color:#3a3b43;border-radius:5px}
  img{width:auto;height:112px;max-width:160px;image-rendering:pixelated}
  .animation-card{min-width:180px;min-height:220px}.animation-stage{position:relative;width:160px;height:190px;overflow:hidden;border-bottom:2px solid #b9aeb4;background:#f7f6f2}
  .animation-sprite{position:absolute;left:38%;bottom:8px;width:var(--sprite-width);height:var(--sprite-height);max-width:none;transform:translateX(-50%) translateY(var(--lift,0px))}
  .run-preview .animation-sprite{left:50%}
  .animation-ghost{position:absolute;bottom:8px;left:120px;width:32px;height:32px;max-width:none;image-rendering:pixelated}
  .animation-ghost-high{bottom:48px}
  .animation-flower{position:absolute;left:160px;bottom:8px;width:32px;height:34px;max-width:none;image-rendering:pixelated}
  .flower-counter{position:absolute;top:8px;left:8px;display:flex;align-items:center;gap:4px;color:#3a3b43;font-size:11px;font-weight:700}
  .flower-counter img{width:16px;height:16px;max-width:none;opacity:.28;image-rendering:pixelated}
  .flower-counter img.is-collected{opacity:1}
  .animation-card figcaption{font-size:12px}
  figcaption{font-size:11px;color:#62646c}.wide{min-height:106px}.wide img{height:72px;max-width:220px}
  .large-icon{min-width:128px;min-height:152px}.large-icon img{height:112px;max-width:128px}
  .heart{min-width:120px;min-height:128px}.heart img{height:84px}
  .progress{display:grid;gap:8px}
  .palette .cards{gap:6px}.swatch{display:inline-flex;align-items:center;gap:5px;padding:3px 7px 3px 3px;background:#f7f6f2;color:#3a3b43;border-radius:4px;font:11px ui-monospace,monospace}.swatch i{width:16px;height:16px;border-radius:2px;border:1px solid #0003}
  .progress-row{display:flex;align-items:center;gap:8px}
  .progress-row img{width:39px;height:39px;image-rendering:pixelated}
  @media(prefers-reduced-motion:reduce){.animation-sprite{transform:translateX(-50%)!important}}
  @media(max-width:600px){body{padding:14px}.cards{gap:8px}figure{min-width:82px;padding:8px}.player img{height:88px}}
</style>
<h1>OOHA pixel-art review</h1>
<p>Every grid below is generated by <code>scripts/gen-character.mts</code> from joints and silhouettes (no image extraction step). Earlier artwork is preserved with the <code>old-</code> prefix.</p>
${section("Animation previews", previewCards, "animation-previews")}
${section("Run cycle — 18x29 source, 2x in game (36x58)", runCards, "player")}
${section("Other poses — 18x29 source, 2x in game", poseCards, "player")}
${section("Duck — prone crawl, 4 frames (24x10 source, 48x20 in game)", duckCards, "player")}
${section("Duck transitions — down: stand → fall-0 → fall-1 → crawl; up: rise-0 → squat → run", transitionCards, "player")}
${section("Ghosts — 16x16 source, 2x in game (32x32)", ghostCards, "icons")}
${section("Flowers — 13x13 source, about 2.5x in game", flowerCards, "icons")}
${section("Lives — 13x12 source, 2x in HUD (26x24)", heartCards, "icons")}
${section("Flower progress — fills from the bottom, one third per flower collected", `<div class="progress">${progressRows}</div>`, "icons")}
${section("Palette — one key per colour, light / mid / dark ramps per material", paletteCards, "palette")}
${section("Previous player art (preserved as old-*.svg)", oldPlayerCards, "player")}
${section("Previous game sprites (preserved as old-*.svg)", oldSpriteCards, "icons")}
<script>
(() => {
  const dimensions = ${JSON.stringify(previewDimensions)};
  const timing = ${JSON.stringify(previewTiming)};
  const run = document.querySelector('[data-animation-preview="run-preview"]');
  const jump = document.querySelector('[data-animation-preview="jump-preview"]');
  const duck = document.querySelector('[data-animation-preview="duck-preview"]');
  const jumpGhost = document.querySelector('[data-animation-ghost="jump-preview"]');
  const duckGhost = document.querySelector('[data-animation-ghost="duck-preview"]');
  const flowers = [...document.querySelectorAll("[data-animation-flower]")];
  const flowerCount = document.querySelector("[data-flower-count]");
  const collectedFlowers = [...document.querySelectorAll("[data-collected-flower]")];
  if (!run || !jump || !duck || !jumpGhost || !duckGhost || flowers.length !== 3 || !flowerCount || collectedFlowers.length !== 3 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const runFrames = ["run0", "run1", "run2", "run3", "run4", "run5"];
  const runFrameMs = timing.runFrameMs;
  const duckFrameMs = timing.duckFrameMs;
  const jumpVelocity = Math.abs(timing.jumpVelocity);
  const gravity = timing.gravity;
  const apexBand = timing.apexBand;
  const jumpDuration = (jumpVelocity * 2) / gravity;
  const flowerTravelMs = 420;
  const flowerIntervalMs = 850;
  const flowerCycleMs = flowerIntervalMs * flowers.length;
  const phases = [
    { name: "run", duration: 780 },
    { name: "jump", duration: jumpDuration * 1000 },
    { name: "land", duration: timing.landSquashMs },
    { name: "run", duration: 325 },
    { name: "run", duration: 325 },
    { name: "duckFall0", duration: timing.duckInMs / 2 },
    { name: "duckFall1", duration: timing.duckInMs / 2 },
    { name: "duckCrawl", duration: duckFrameMs * 4 },
    { name: "duckRise0", duration: timing.riseMs / 2 },
    { name: "land", duration: timing.riseMs / 2 },
    { name: "run", duration: 520 },
  ];
  const cycleDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
  const duckPhaseStart = 780 + jumpDuration * 1000 + timing.landSquashMs + 650;
  const frameSource = (key) => \`character/\${key}.svg\`;
  const setFrame = (image, key) => {
    const source = frameSource(key);
    if (!image.src.endsWith(source)) image.src = source;
    const size = dimensions[key];
    if (!size) throw new Error(\`Missing preview dimensions for frame \${key}\`);
    image.style.setProperty("--sprite-width", \`\${size.width}px\`);
    image.style.setProperty("--sprite-height", \`\${size.height}px\`);
  };
  const startedAt = performance.now();
  const render = (now) => {
    const elapsed = now - startedAt;
    let phaseTime = elapsed % cycleDuration;
    let phase = phases[0];
    for (const candidate of phases) {
      if (phaseTime < candidate.duration) {
        phase = candidate;
        break;
      }
      phaseTime -= candidate.duration;
    }

    const runningFrame = runFrames[Math.floor(elapsed / runFrameMs) % runFrames.length];
    setFrame(run, runningFrame);
    setFrame(jump, runningFrame);
    setFrame(duck, runningFrame);
    jump.style.setProperty("--lift", "0px");
    jumpGhost.style.display = phase.name === "jump" ? "block" : "none";
    duckGhost.style.display = phase.name.startsWith("duck") ? "block" : "none";
    const flowerCycleTime = elapsed % flowerCycleMs;
    const activeFlowerIndex = Math.floor(flowerCycleTime / flowerIntervalMs);
    const flowerTime = flowerCycleTime % flowerIntervalMs;
    const flowersCollected = Math.min(
      flowers.length,
      activeFlowerIndex + (flowerTime >= flowerTravelMs ? 1 : 0),
    );
    flowerCount.textContent = \`\${flowersCollected}/\${flowers.length}\`;
    collectedFlowers.forEach((flower, index) => {
      flower.classList.toggle("is-collected", index < flowersCollected);
    });
    flowers.forEach((flower, index) => {
      const isActive = index === activeFlowerIndex && flowerTime < flowerTravelMs;
      flower.style.display = isActive ? "block" : "none";
      if (isActive) {
        flower.style.left = \`\${160 - (90 * flowerTime / flowerTravelMs)}px\`;
      }
    });
    if (phase.name === "jump") {
      const seconds = phaseTime / 1000;
      const velocity = -jumpVelocity + gravity * seconds;
      const lift = jumpVelocity * seconds - 0.5 * gravity * seconds * seconds;
      jump.style.setProperty("--lift", \`-\${Math.max(0, lift)}px\`);
      jumpGhost.style.left = \`\${120 - (250 * seconds)}px\`;
      setFrame(jump, velocity > apexBand ? "jumpFall" : velocity < -apexBand ? "jumpUp" : "jumpTuck");
    } else if (phase.name === "land") {
      setFrame(jump, "land");
    } else if (phase.name === "duckCrawl") {
      setFrame(duck, \`duck\${Math.floor(phaseTime / duckFrameMs) % 4}\`);
    } else if (phase.name.startsWith("duck")) {
      setFrame(duck, phase.name);
    }
    const duckElapsed = (elapsed % cycleDuration) - duckPhaseStart;
    if (duckGhost.style.display === "block") {
      duckGhost.style.left = \`\${160 - (250 * duckElapsed / 1000)}px\`;
    }

    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
})();
</script>
</html>
`;
};

// Reads the animation constants the game runs on, so the preview can never drift from the game.
// Outside the real repo (--out sandbox) it falls back to the documented defaults instead of failing.
const DEFAULT_TIMING: PreviewTiming = {
  jumpVelocity: -760, gravity: 2600, runFrameMs: 65, duckFrameMs: 110,
  duckInMs: 110, riseMs: 140, landSquashMs: 90, apexBand: 230,
};

const getPreviewTiming = async (): Promise<PreviewTiming> => {
  const gameConstantsPath = path.join(websiteRoot, "src", "game", "constants.ts");
  const animationConstantsPath = path.join(websiteRoot, "src", "game", "playerAnimation.ts");
  let gameConstants: string;
  let animationConstants: string;
  try {
    [gameConstants, animationConstants] = await Promise.all([
      readFile(gameConstantsPath, "utf8"),
      readFile(animationConstantsPath, "utf8"),
    ]);
  } catch (error) {
    if (argValue("--out")) {
      console.warn("Game constants not found under --out; using documented default timing for the preview.");
      return DEFAULT_TIMING;
    }
    throw error;
  }
  const readNumber = (source: string, name: string, filePath: string): number => {
    const match = source.match(new RegExp(`export const ${name} = (-?\\d+(?:\\.\\d+)?);`));
    if (!match) throw new Error(`Unable to read ${name} from ${filePath}`);
    return Number(match[1]);
  };
  return {
    jumpVelocity: readNumber(gameConstants, "JUMP_VELOCITY", gameConstantsPath),
    gravity: readNumber(gameConstants, "GRAVITY", gameConstantsPath),
    runFrameMs: readNumber(animationConstants, "RUN_FRAME_MS", animationConstantsPath),
    duckFrameMs: readNumber(animationConstants, "DUCK_FRAME_MS", animationConstantsPath),
    duckInMs: readNumber(animationConstants, "DUCK_IN_MS", animationConstantsPath),
    riseMs: readNumber(animationConstants, "RISE_MS", animationConstantsPath),
    landSquashMs: readNumber(animationConstants, "LAND_SQUASH_MS", animationConstantsPath),
    apexBand: readNumber(animationConstants, "APEX_BAND", animationConstantsPath),
  };
};

// ---------------------------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------------------------
const generatedFiles = (previewTiming: PreviewTiming): Array<[string, string]> => [
  [outputTypeScript, toTypeScript()],
  ...Object.entries(FRAMES).map(([key, frame]): [string, string] => [path.join(outputDirectory, `${key}.svg`), toSvg(frame)]),
  ...Object.entries(GAME_SPRITES).map(([key, frame]): [string, string] => [path.join(outputDirectory, `${toSlug(key)}.svg`), toSvg(frame)]),
  ...Object.entries(OLD_FRAMES).map(([key, frame]): [string, string] => [path.join(outputDirectory, `old-${key}.svg`), toSvg(frame, OLD_PALETTE)]),
  ...Object.entries(OLD_GAME_SPRITES).map(([key, frame]): [string, string] => [path.join(outputDirectory, `old-${toSlug(key)}.svg`), toSvg(frame, OLD_PALETTE)]),
  [reviewPage, toReviewPage(previewTiming)],
];

const main = async (): Promise<void> => {
  const previewTiming = await getPreviewTiming();
  validateFrames();
  validateGridCollection(OLD_FRAMES, "Old player frame", OLD_PALETTE, true);
  validateGridCollection(OLD_GAME_SPRITES, "Old game sprite", OLD_PALETTE, true);

  if (argValue("--json")) {
    await writeFile(argValue("--json") as string, JSON.stringify({ palette: PALETTE, frames: FRAMES, sprites: GAME_SPRITES }));
  }

  if (process.argv.includes("--check")) {
    for (const [filePath, expected] of generatedFiles(previewTiming)) {
      let existing: string;
      try {
        existing = await readFile(filePath, "utf8");
      } catch (error) {
        throw new Error(`Missing generated file ${filePath}. Run npm run generate:character.`, { cause: error });
      }
      if (existing !== expected) throw new Error(`Generated file is out of date: ${filePath}. Run npm run generate:character.`);
    }
    console.log(`Validated ${Object.keys(FRAMES).length} player frames and all generated assets.`);
    return;
  }

  await mkdir(outputDirectory, { recursive: true });
  await mkdir(path.dirname(outputTypeScript), { recursive: true });
  await Promise.all(generatedFiles(previewTiming).map(([filePath, contents]) => writeFile(filePath, contents, "utf8")));
  console.log(`Generated ${Object.keys(FRAMES).length} player frames and ${Object.keys(GAME_SPRITES).length} game sprites in ${outputDirectory}`);
  console.log(`Review sprites at ${reviewPage}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
