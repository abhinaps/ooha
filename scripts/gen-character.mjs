import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const websiteRoot = path.join(repoRoot, "ooha-website");
const outputTypeScript = path.join(websiteRoot, "src", "game", "playerFrames.ts");
const outputDirectory = path.join(websiteRoot, "public", "character");
const reviewPage = path.join(websiteRoot, "public", "character-review.html");

const OLD_PALETTE = {
  o: "#1a1520",
  h: "#2e2a38",
  H: "#4a4458",
  s: "#f0c9a0",
  S: "#d2a076",
  y: "#1a1520",
  t: "#5fc0dd",
  T: "#3f9ab8",
  j: "#3f63a8",
  J: "#2b4578",
  e: "#6b4126",
  E: "#47291a",
  w: "#f7f0f4",
  W: "#d5cadf",
  l: "#c9c9ed",
  L: "#8989b9",
  r: "#d9535e",
  i: "#f2c94c",
  p: "#c94d4d",
  q: "#fff7df",
  b: "#8ec5ff",
  B: "#3c82d5",
  n: "#f4b8c5",
  N: "#df778e",
  g: "#5b9b63",
  u: "#f4c94e",
  U: "#df9b35",
  c: "#8a5635",
  C: "#573821",
  z: "#7c8190",
};

const PALETTE = {
  o: "#19151f",
  h: "#292533",
  H: "#514b61",
  s: "#f6ba62",
  S: "#d58a3c",
  y: "#19151f",
  t: "#c91f27",
  T: "#8e151d",
  j: "#2a2833",
  J: "#494653",
  e: "#292732",
  E: "#c8c9d0",
  w: "#f5b7b5",
  W: "#d98791",
  l: "#8880aa",
  L: "#51496e",
  r: "#e32e38",
  i: "#ffd84f",
  p: "#ba36c9",
  q: "#fff1c7",
  b: "#74b8f4",
  B: "#3479d0",
  n: "#f4b3bc",
  N: "#dc596a",
  g: "#4e985a",
  u: "#f0c54c",
  U: "#d79a30",
  c: "#9b714c",
  C: "#704d38",
  z: "#777988",
};

const newGrid = (width, height) => Array.from(
  { length: height },
  () => Array(width).fill("."),
);

const put = (grid, x, y, color) => {
  const row = grid[y];
  if (row && x >= 0 && x < row.length) {
    row[x] = color;
  }
};

const rect = (grid, x, y, width, height, color) => {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      put(grid, column, row, color);
    }
  }
};

const line = (grid, x0, y0, x1, y1, color, thickness = 1) => {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(x0 + ((x1 - x0) * step) / steps);
    const y = Math.round(y0 + ((y1 - y0) * step) / steps);
    rect(grid, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
  }
};

const outline = (grid) => {
  const filled = grid.map((row) => row.map((cell) => cell !== "."));
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (filled[y][x]) continue;
      if (
        filled[y - 1]?.[x]
        || filled[y + 1]?.[x]
        || filled[y][x - 1]
        || filled[y][x + 1]
      ) {
        grid[y][x] = "o";
      }
    }
  }
  return grid.map((row) => row.join(""));
};

const standingPose = ({ bodyDy = 0, armSwing = 0, nearLeg = [0, 0], farLeg = [0, 0], tucked = false, land = false } = {}) => {
  const grid = newGrid(18, 29);
  const headDy = Math.max(bodyDy, 0);

  rect(grid, 6, 2 + headDy, 6, 2, "h");
  rect(grid, 5, 3 + headDy, 8, 2, "h");
  rect(grid, 7, 3 + headDy, 3, 1, "H");
  rect(grid, 6, 5 + headDy, 7, 4, "s");
  rect(grid, 6, 5 + headDy, 2, 3, "h");
  rect(grid, 7, 8 + headDy, 2, 1, "h");
  put(grid, 10, 6 + headDy, "y");
  put(grid, 13, 7 + headDy, "s");
  rect(grid, 8, 9 + bodyDy, 3, 2, "S");
  rect(grid, 7, 11 + bodyDy, 7, land ? 6 : 7, "t");
  rect(grid, 7, 11 + bodyDy, 2, land ? 6 : 7, "T");
  rect(grid, 12, 11 + bodyDy, 2, 3, "T");

  if (land) {
    line(grid, 12, 13 + bodyDy, 13, 18, "s", 2);
    line(grid, 8, 13 + bodyDy, 6, 18, "S", 2);
  } else {
    line(grid, 12, 13 + bodyDy, 12 + armSwing, 17 + bodyDy, "s", 2);
  }

  if (tucked) {
    line(grid, 8, 18 + bodyDy, 12, 20, "J", 3);
    line(grid, 12, 20, 9, 24, "j", 3);
    line(grid, 11, 14 + bodyDy, 14, 17, "s", 2);
  } else {
    const [farDx, farLift] = farLeg;
    const [nearDx, nearLift] = nearLeg;
    line(grid, 9, 18 + bodyDy, 9 + farDx, 25 - farLift, "J", 3);
    line(grid, 10 + farDx, 25 - farLift, 9 + farDx, 27 - farLift, "J", 2);
    rect(grid, 7 + farDx, 27 - farLift, 5, 2, "E");
    line(grid, 11, 18 + bodyDy, 11 + nearDx, 25 - nearLift, "j", 3);
    line(grid, 11 + nearDx, 25 - nearLift, 12 + nearDx, 27 - nearLift, "j", 2);
    rect(grid, 9 + nearDx, 27 - nearLift, 4, 2, "e");
  }

  const shifted = newGrid(18, 29);
  grid.forEach((row, y) => row.forEach((cell, x) => {
    if (x > 0) shifted[y][x - 1] = cell;
  }));
  return outline(shifted);
};

const jumpUpPose = () => {
  const grid = newGrid(18, 29);
  const base = standingPose();
  for (let y = 0; y < 18; y += 1) {
    for (let x = 0; x < 18; x += 1) {
      if (base[y][x] !== "." && base[y][x] !== "o") grid[y + 2][x] = base[y][x];
    }
  }
  line(grid, 7, 13, 4, 4, "S", 2);
  line(grid, 13, 13, 15, 3, "s", 2);
  line(grid, 9, 20, 5, 26, "J", 3);
  rect(grid, 3, 25, 4, 2, "E");
  line(grid, 11, 20, 9, 27, "j", 3);
  rect(grid, 8, 26, 5, 2, "e");
  return outline(grid);
};

const jumpFallPose = () => {
  const grid = newGrid(18, 29);
  const base = standingPose();
  for (let y = 0; y < 18; y += 1) {
    for (let x = 0; x < 18; x += 1) {
      if (base[y][x] !== "." && base[y][x] !== "o") grid[y + 1][x] = base[y][x];
    }
  }
  line(grid, 7, 13, 3, 10, "S", 2);
  line(grid, 13, 13, 14, 9, "s", 2);
  line(grid, 9, 20, 8, 25, "J", 3);
  rect(grid, 6, 25, 5, 2, "E");
  line(grid, 11, 20, 14, 27, "j", 3);
  rect(grid, 11, 26, 4, 2, "e");
  return outline(grid);
};

const frontPose = () => {
  const grid = newGrid(18, 29);
  rect(grid, 6, 2, 6, 3, "h");
  rect(grid, 5, 4, 8, 2, "h");
  rect(grid, 6, 6, 7, 4, "s");
  put(grid, 8, 7, "y");
  put(grid, 11, 7, "y");
  rect(grid, 8, 10, 3, 2, "S");
  rect(grid, 6, 12, 7, 7, "t");
  rect(grid, 6, 12, 2, 7, "T");
  line(grid, 6, 13, 4, 18, "s", 2);
  line(grid, 13, 13, 14, 18, "s", 2);
  rect(grid, 7, 19, 4, 8, "j");
  rect(grid, 11, 19, 4, 8, "J");
  rect(grid, 6, 27, 5, 2, "e");
  rect(grid, 11, 27, 5, 2, "E");
  return outline(grid);
};

const duckPose = (phase) => {
  const grid = newGrid(24, 10);
  const reaches = [17, 19, 20];
  const nearReach = reaches[phase];
  const farReach = reaches[(phase + 2) % 3];

  rect(grid, 8, 5, 9, 3, "t");
  rect(grid, 8, 5, 2, 3, "T");
  rect(grid, 10, 8, 6, 1, "T");
  line(grid, 11, 6, nearReach, 8, "s", 2);
  line(grid, 9, 6, farReach, 6, "S", 1);
  line(grid, 8, 8, 5 + (phase % 2), 8, "j", 2);
  line(grid, 12, 8, 14 - (phase % 2), 8, "J", 2);
  rect(grid, 3, 3, 4, 3, "h");
  rect(grid, 4, 2, 4, 3, "h");
  rect(grid, 5, 4, 3, 3, "s");
  put(grid, 7, 5, "y");
  put(grid, 8, 5, "s");
  rect(grid, 3, 8, 5, 1, "E");
  rect(grid, 12, 8, 5, 1, "e");
  return outline(grid);
};

const duckTransition = (height, phase) => {
  const grid = newGrid(24, height);
  if (phase === "fall0") {
    rect(grid, 7, 6, 8, 6, "t");
    rect(grid, 7, 6, 2, 6, "T");
    rect(grid, 5, 2, 6, 5, "h");
    rect(grid, 6, 4, 5, 4, "s");
    put(grid, 10, 6, "y");
    line(grid, 13, 10, 16, 15, "s", 2);
    line(grid, 8, 12, 7, 17, "j", 3);
    line(grid, 12, 12, 15, 17, "J", 3);
    rect(grid, 4, 18, 5, 2, "E");
    rect(grid, 14, 18, 5, 2, "e");
  } else if (phase === "fall1") {
    rect(grid, 8, 6, 9, 3, "t");
    rect(grid, 8, 6, 2, 3, "T");
    rect(grid, 14, 3, 6, 4, "h");
    rect(grid, 16, 6, 5, 4, "s");
    put(grid, 20, 7, "y");
    put(grid, 21, 8, "s");
    line(grid, 9, 8, 5, 5, "j", 2);
    line(grid, 15, 8, 12, 4, "J", 2);
    rect(grid, 3, 2, 5, 2, "E");
    rect(grid, 10, 2, 5, 2, "e");
  } else {
    rect(grid, 8, 6, 9, 4, "t");
    rect(grid, 8, 6, 2, 4, "T");
    rect(grid, 14, 3, 6, 5, "h");
    rect(grid, 15, 6, 5, 4, "s");
    put(grid, 20, 7, "y");
    put(grid, 21, 8, "s");
    line(grid, 9, 8, 5, 12, "s", 2);
    line(grid, 8, 9, 5, 12, "s", 1);
    line(grid, 10, 9, 13, 12, "j", 2);
    line(grid, 14, 9, 18, 12, "J", 2);
  }
  return outline(grid);
};

const LEGACY_FRAMES = {
  stand: { width: 18, height: 29, rows: standingPose() },
  front: { width: 18, height: 29, rows: frontPose() },
  jumpUp: { width: 18, height: 29, rows: jumpUpPose() },
  jumpTuck: { width: 18, height: 29, rows: standingPose({ bodyDy: 3, tucked: true }) },
  jumpFall: { width: 18, height: 29, rows: jumpFallPose() },
  land: { width: 18, height: 29, rows: standingPose({ bodyDy: 6, land: true }) },
  duckFall0: { width: 24, height: 20, rows: duckTransition(20, "fall0") },
  duckFall1: { width: 24, height: 13, rows: duckTransition(13, "fall1") },
  duckRise0: { width: 24, height: 14, rows: duckTransition(14, "rise") },
  duck0: { width: 24, height: 10, rows: duckPose(0) },
  duck1: { width: 24, height: 10, rows: duckPose(1) },
  duck2: { width: 24, height: 10, rows: duckPose(2) },
  duck3: { width: 24, height: 10, rows: duckPose(3) },
};

const runParameters = [
  { near: [3, 0], far: [-2, 0], arm: -2, dy: 0 },
  { near: [0, 0], far: [0, 0], arm: -1, dy: 0 },
  { near: [-3, 0], far: [3, 0], arm: 1, dy: 0 },
  { near: [-2, 1], far: [2, 0], arm: 2, dy: -1 },
  { near: [0, 2], far: [0, 0], arm: 1, dy: -1 },
  { near: [3, 1], far: [-3, 0], arm: -1, dy: 0 },
];

runParameters.forEach((pose, index) => {
  LEGACY_FRAMES[`run${index}`] = {
    width: 18,
    height: 29,
    rows: standingPose({
      bodyDy: pose.dy,
      armSwing: pose.arm,
      nearLeg: pose.near,
      farLeg: pose.far,
    }),
  };
});

const OLD_FRAMES = LEGACY_FRAMES;

const recolorPlayerFrame = (frame) => ({
  ...frame,
  rows: frame.rows.map((row, y) => {
    const cells = [...row];
    if (y === 1) {
      for (const x of [6, 8, 10, 12]) {
        if (cells[x] === "o") cells[x] = "h";
      }
    }
    return cells.join("");
  }),
});

const FRAMES = Object.fromEntries(
  Object.entries(OLD_FRAMES).map(([key, frame]) => [key, recolorPlayerFrame(frame)]),
);

const ghostGrid = (baseColor, shadeColor) => {
  const grid = newGrid(16, 16);
  rect(grid, 5, 2, 6, 1, baseColor);
  rect(grid, 4, 3, 8, 1, baseColor);
  rect(grid, 3, 4, 10, 8, baseColor);
  rect(grid, 2, 7, 12, 5, baseColor);
  rect(grid, 3, 12, 10, 2, baseColor);
  rect(grid, 4, 14, 2, 1, baseColor);
  rect(grid, 7, 14, 2, 1, baseColor);
  rect(grid, 10, 14, 2, 1, baseColor);
  rect(grid, 10, 4, 2, 9, shadeColor);
  rect(grid, 9, 13, 1, 1, shadeColor);
  return grid;
};

const angryGhost = () => {
  const grid = ghostGrid("w", "W");
  rect(grid, 4, 6, 3, 1, "o");
  rect(grid, 9, 6, 3, 1, "o");
  rect(grid, 5, 7, 2, 2, "r");
  rect(grid, 9, 7, 2, 2, "r");
  rect(grid, 4, 10, 8, 3, "o");
  rect(grid, 5, 11, 2, 1, "q");
  rect(grid, 8, 11, 2, 1, "q");
  rect(grid, 11, 11, 1, 1, "q");
  return outline(grid);
};

const cyclopsGhost = () => {
  const grid = ghostGrid("w", "l");
  rect(grid, 5, 5, 6, 6, "o");
  rect(grid, 6, 6, 4, 4, "i");
  rect(grid, 7, 7, 2, 2, "p");
  rect(grid, 6, 11, 4, 1, "o");
  rect(grid, 7, 12, 2, 1, "o");
  return outline(grid);
};

const blueFlower = () => {
  const grid = newGrid(13, 13);
  rect(grid, 4, 2, 5, 2, "b");
  rect(grid, 3, 4, 7, 2, "b");
  rect(grid, 2, 6, 9, 2, "b");
  rect(grid, 3, 8, 7, 2, "B");
  rect(grid, 4, 10, 5, 1, "B");
  rect(grid, 4, 7, 2, 3, "B");
  rect(grid, 7, 7, 2, 3, "B");
  rect(grid, 6, 5, 1, 4, "u");
  rect(grid, 5, 6, 3, 2, "U");
  return outline(grid);
};

const pinkFlower = () => {
  const grid = newGrid(13, 13);
  rect(grid, 5, 2, 3, 2, "w");
  rect(grid, 4, 4, 5, 2, "w");
  rect(grid, 2, 6, 4, 2, "w");
  rect(grid, 7, 6, 4, 2, "w");
  rect(grid, 4, 8, 5, 2, "w");
  rect(grid, 5, 10, 3, 1, "w");
  rect(grid, 2, 2, 2, 2, "g");
  rect(grid, 9, 2, 2, 2, "g");
  rect(grid, 2, 9, 2, 2, "g");
  rect(grid, 9, 9, 2, 2, "g");
  put(grid, 5, 5, "n");
  put(grid, 7, 5, "n");
  put(grid, 5, 8, "n");
  put(grid, 7, 8, "n");
  rect(grid, 5, 6, 3, 2, "u");
  put(grid, 6, 5, "N");
  put(grid, 6, 8, "N");
  put(grid, 4, 7, "N");
  put(grid, 8, 7, "N");
  return outline(grid);
};

const goldFlower = () => {
  const grid = newGrid(13, 13);
  rect(grid, 5, 2, 3, 2, "u");
  rect(grid, 3, 4, 7, 2, "u");
  rect(grid, 2, 6, 9, 2, "u");
  rect(grid, 3, 8, 7, 2, "u");
  rect(grid, 5, 10, 3, 1, "u");
  put(grid, 3, 5, "U");
  put(grid, 9, 5, "U");
  put(grid, 3, 8, "U");
  put(grid, 9, 8, "U");
  rect(grid, 4, 5, 5, 4, "c");
  rect(grid, 5, 6, 3, 2, "C");
  put(grid, 6, 4, "U");
  return outline(grid);
};

const heartGrid = (color) => {
  const grid = newGrid(13, 12);
  rect(grid, 3, 2, 2, 1, color);
  rect(grid, 8, 2, 2, 1, color);
  rect(grid, 2, 3, 9, 3, color);
  rect(grid, 3, 6, 7, 1, color);
  rect(grid, 4, 7, 5, 1, color);
  rect(grid, 5, 8, 3, 1, color);
  rect(grid, 6, 9, 1, 1, color);
  put(grid, 6, 10, color);
  if (color === "r") {
    rect(grid, 8, 3, 2, 2, "q");
  }
  return outline(grid);
};

const legacyGameSprites = {
  ghostAngry: { width: 16, height: 16, rows: angryGhost() },
  ghostCyclops: { width: 16, height: 16, rows: cyclopsGhost() },
  flowerBlue: { width: 13, height: 13, rows: blueFlower() },
  flowerPink: { width: 13, height: 13, rows: pinkFlower() },
  flowerGold: { width: 13, height: 13, rows: goldFlower() },
  heartFull: { width: 13, height: 12, rows: heartGrid("r") },
  heartEmpty: { width: 13, height: 12, rows: heartGrid("z") },
};

const flowerProgress = (flower, amount) => ({
  ...flower,
  rows: flower.rows.map((row, y) => [...row].map((cell) => {
    if (cell === "." || cell === "o") return cell;
    const isFilled = y >= Math.round(flower.height * (1 - amount / 3));
    return isFilled ? cell : "z";
  }).join("")),
});

for (const key of ["flowerBlue", "flowerPink", "flowerGold"]) {
  const flower = legacyGameSprites[key];
  for (let amount = 0; amount <= 3; amount += 1) {
    legacyGameSprites[`${key}Progress${amount}`] = flowerProgress(flower, amount);
  }
}

const OLD_GAME_SPRITES = legacyGameSprites;

const angryGhostPixelArt = () => {
  const grid = ghostGrid("w", "W");
  rect(grid, 6, 7, 4, 2, "o");
  rect(grid, 7, 6, 2, 4, "o");
  rect(grid, 5, 10, 2, 2, "r");
  rect(grid, 9, 10, 2, 2, "r");
  return outline(grid);
};

const cyclopsGhostPixelArt = () => {
  const grid = ghostGrid("l", "L");
  rect(grid, 5, 5, 6, 6, "o");
  rect(grid, 6, 6, 4, 4, "p");
  rect(grid, 7, 7, 2, 2, "h");
  rect(grid, 5, 11, 6, 1, "o");
  return outline(grid);
};

const blueFlowerPixelArt = () => {
  const grid = newGrid(13, 13);
  rect(grid, 5, 1, 3, 2, "b");
  rect(grid, 3, 3, 7, 3, "b");
  rect(grid, 1, 5, 11, 4, "b");
  rect(grid, 3, 8, 7, 3, "B");
  rect(grid, 4, 10, 5, 1, "B");
  rect(grid, 6, 4, 1, 5, "u");
  put(grid, 5, 5, "U");
  put(grid, 7, 5, "U");
  rect(grid, 1, 9, 2, 2, "g");
  rect(grid, 10, 9, 2, 2, "g");
  return outline(grid);
};

const pinkFlowerPixelArt = () => {
  const grid = newGrid(13, 13);
  rect(grid, 4, 2, 5, 1, "r");
  rect(grid, 3, 3, 7, 2, "r");
  rect(grid, 4, 5, 5, 2, "N");
  rect(grid, 5, 7, 3, 3, "g");
  rect(grid, 2, 8, 4, 2, "g");
  rect(grid, 7, 8, 4, 2, "g");
  rect(grid, 4, 10, 5, 1, "g");
  rect(grid, 5, 3, 3, 1, "q");
  return outline(grid);
};

const goldFlowerPixelArt = () => {
  const grid = newGrid(13, 13);
  rect(grid, 5, 1, 3, 1, "q");
  rect(grid, 4, 2, 5, 2, "q");
  rect(grid, 3, 4, 7, 2, "q");
  rect(grid, 4, 6, 5, 1, "u");
  rect(grid, 5, 7, 3, 4, "g");
  rect(grid, 2, 8, 4, 2, "g");
  rect(grid, 7, 8, 4, 2, "g");
  rect(grid, 4, 10, 5, 1, "g");
  return outline(grid);
};

const GAME_SPRITES = {
  ghostAngry: { width: 16, height: 16, rows: angryGhostPixelArt() },
  ghostCyclops: { width: 16, height: 16, rows: cyclopsGhostPixelArt() },
  flowerBlue: { width: 13, height: 13, rows: blueFlowerPixelArt() },
  flowerPink: { width: 13, height: 13, rows: pinkFlowerPixelArt() },
  flowerGold: { width: 13, height: 13, rows: goldFlowerPixelArt() },
  heartFull: { width: 13, height: 12, rows: heartGrid("r") },
  heartEmpty: { width: 13, height: 12, rows: heartGrid("z") },
};

for (const key of ["flowerBlue", "flowerPink", "flowerGold"]) {
  const flower = GAME_SPRITES[key];
  for (let amount = 0; amount <= 3; amount += 1) {
    GAME_SPRITES[`${key}Progress${amount}`] = flowerProgress(flower, amount);
  }
}

const validateGridCollection = (collection, label, palette) => {
  for (const [key, frame] of Object.entries(collection)) {
    if (frame.rows.length !== frame.height) {
      throw new Error(`${label} ${key}: expected ${frame.height} rows, got ${frame.rows.length}`);
    }
    for (const [index, row] of frame.rows.entries()) {
      if (row.length !== frame.width) {
        throw new Error(`${label} ${key}: row ${index} has width ${row.length}, expected ${frame.width}`);
      }
      for (const character of row) {
        if (character !== "." && !(character in palette)) {
          throw new Error(`${label} ${key}: unknown palette key ${JSON.stringify(character)}`);
        }
      }
    }
    if (frame.rows[0].includes("o")) {
      throw new Error(`${label} ${key}: sprite touches the top grid edge`);
    }
    const edgeRow = frame.rows.findIndex((row) => row[0] !== "." || row.at(-1) !== ".");
    if (edgeRow !== -1) {
      throw new Error(`${label} ${key}: sprite touches a side grid edge on row ${edgeRow}`);
    }
  }
};

const validateFrames = () => {
  validateGridCollection(FRAMES, "Player frame", PALETTE);
  validateGridCollection(GAME_SPRITES, "Game sprite", PALETTE);
  validateGridCollection(OLD_FRAMES, "Old player frame", OLD_PALETTE);
  validateGridCollection(OLD_GAME_SPRITES, "Old game sprite", OLD_PALETTE);
};

const toTypeScript = () => {
  const serialize = (collection) => Object.entries(collection)
    .map(([key, frame]) => `  ${key}: {\n    width: ${frame.width},\n    height: ${frame.height},\n    rows: [\n${frame.rows.map((row) => `      ${JSON.stringify(row)},`).join("\n")}\n    ],\n  },`)
    .join("\n");
  const serializePalette = (palette) => Object.entries(palette)
    .map(([key, color]) => `  ${key}: ${JSON.stringify(color)},`)
    .join("\n");
  return `// Generated by scripts/gen-character.mjs. Edit the generator, not this file.\nexport const PLAYER_PALETTE = {\n${serializePalette(PALETTE)}\n} as const;\n\nexport const PLAYER_FRAMES = {\n${serialize(FRAMES)}\n} as const;\n\nexport const GAME_SPRITES = {\n${serialize(GAME_SPRITES)}\n} as const;\n\nexport const OLD_PLAYER_PALETTE = {\n${serializePalette(OLD_PALETTE)}\n} as const;\n\nexport const OLD_PLAYER_FRAMES = {\n${serialize(OLD_FRAMES)}\n} as const;\n\nexport const OLD_GAME_SPRITES = {\n${serialize(OLD_GAME_SPRITES)}\n} as const;\n\nexport type PlayerFrameKey = keyof typeof PLAYER_FRAMES;\nexport type GameSpriteKey = keyof typeof GAME_SPRITES;\n`;
};

const toSvg = (frame, palette = PALETTE) => {
  const cells = [];
  frame.rows.forEach((row, y) => {
    [...row].forEach((character, x) => {
      if (character !== ".") {
        cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[character]}"/>`);
      }
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${frame.width} ${frame.height}" shape-rendering="crispEdges">${cells.join("")}</svg>\n`;
};

const toSlug = (key) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const toReviewPage = () => {
  const playerCard = (key, className = "", old = false) => (
    `<figure class="${className}"><img src="/character/${old ? "old-" : ""}${Object.hasOwn(FRAMES, key) ? key : toSlug(key)}.svg" alt="${old ? "Old " : ""}${key} pixel-art frame"><figcaption>${old ? "old-" : ""}${key}</figcaption></figure>`
  );
  const section = (title, cards, className = "") => (
    `<section class="${className}"><h2>${title}</h2><div class="cards">${cards}</div></section>`
  );
  const runCards = Array.from({ length: 6 }, (_, index) => playerCard(`run${index}`)).join("\n");
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
    `<div class="progress-row"><span>${amount}/3</span>${["flowerBlue", "flowerPink", "flowerGold"]
      .map((key) => `<img src="/character/${toSlug(`${key}Progress${amount}`)}.svg" alt="${key} ${amount} of 3" width="39" height="39">`).join("")}</div>`
  )).join("\n");
  const oldRunCards = Array.from({ length: 6 }, (_, index) => playerCard(`run${index}`, "", true)).join("\n");
  const oldPoseCards = ["stand", "jumpUp", "jumpTuck", "jumpFall", "land", "front"]
    .map((key) => playerCard(key, "", true)).join("\n");
  const oldSpriteCards = Object.keys(OLD_GAME_SPRITES)
    .filter((key) => !key.endsWith("Progress0") && !key.endsWith("Progress1") && !key.endsWith("Progress2") && !key.endsWith("Progress3"))
    .map((key) => `<figure class="large-icon"><img src="/character/old-${toSlug(key)}.svg" alt="Old ${key} pixel-art"><figcaption>old-${key}</figcaption></figure>`).join("\n");
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
  figcaption{font-size:11px;color:#62646c}.wide{min-height:106px}.wide img{height:72px;max-width:220px}
  .large-icon{min-width:128px;min-height:152px}.large-icon img{height:112px;max-width:128px}
  .heart{min-width:120px;min-height:128px}.heart img{height:84px}
  .progress{padding:10px 14px;display:grid;gap:8px;background:#f7f6f2;color:#62646c;border-radius:5px}
  .progress-row{display:flex;align-items:center;gap:8px}.progress-row span{width:28px;font-size:12px}
  .progress-row img{width:39px;height:39px;image-rendering:pixelated}
  @media(max-width:600px){body{padding:14px}.cards{gap:8px}figure{min-width:82px;padding:8px}.player img{height:88px}}
</style>
<h1>OOHA pixel-art review</h1>
<p>Generated from <code>scripts/gen-character.mjs</code>. Review at native pixel scale before changing game placement.</p>
${section("Run cycle — 18x29 source, 2x in game (36x58)", runCards, "player")}
${section("Other poses — 18x29 source, 2x in game", poseCards, "player")}
${section("Duck — prone crawl, 4 frames (24x10 source, 48x20 in game)", duckCards, "player")}
${section("Duck transitions — down: stand → fall-0 → fall-1 → crawl; up: rise-0 → squat → run", transitionCards, "player")}
${section("Ghosts — 16x16 source, 2x in game (32x32)", ghostCards, "icons")}
${section("Flowers — 13x13 source, about 2.5x in game", flowerCards, "icons")}
${section("Lives — 13x12 source, 2x in HUD (26x24)", heartCards, "icons")}
${section("Flower progress — fills from the bottom, one third per flower collected", `<div class="progress">${progressRows}</div>`, "icons")}
${section("Previous player art (preserved as old-*.svg)", oldRunCards + oldPoseCards, "player")}
${section("Previous game sprites (preserved as old-*.svg)", oldSpriteCards, "icons")}
</html>
`;
};

const main = async () => {
  validateFrames();
  if (process.argv.includes("--check")) {
    const generatedFiles = [
      [outputTypeScript, toTypeScript()],
      ...Object.entries(FRAMES).map(([key, frame]) => [
        path.join(outputDirectory, `${key}.svg`),
        toSvg(frame),
      ]),
      ...Object.entries(GAME_SPRITES).map(([key, frame]) => [
        path.join(outputDirectory, `${toSlug(key)}.svg`),
        toSvg(frame),
      ]),
      ...Object.entries(OLD_FRAMES).map(([key, frame]) => [
        path.join(outputDirectory, `old-${key}.svg`),
        toSvg(frame, OLD_PALETTE),
      ]),
      ...Object.entries(OLD_GAME_SPRITES).map(([key, frame]) => [
        path.join(outputDirectory, `old-${toSlug(key)}.svg`),
        toSvg(frame, OLD_PALETTE),
      ]),
      [reviewPage, toReviewPage()],
    ];
    for (const [filePath, expected] of generatedFiles) {
      let existing;
      try {
        existing = await readFile(filePath, "utf8");
      } catch (error) {
        throw new Error(`Missing generated file ${filePath}. Run npm run generate:character.`, { cause: error });
      }
      if (existing !== expected) {
        throw new Error(`Generated file is out of date: ${filePath}. Run npm run generate:character.`);
      }
    }
    console.log(`Validated ${Object.keys(FRAMES).length} player frames and all generated assets.`);
    return;
  }

  await mkdir(path.dirname(outputTypeScript), { recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputTypeScript, toTypeScript(), "utf8");
  await Promise.all(
    Object.entries(FRAMES).map(([key, frame]) => (
      writeFile(path.join(outputDirectory, `${key}.svg`), toSvg(frame), "utf8")
    )),
  );
  await Promise.all(
    Object.entries(GAME_SPRITES).map(([key, frame]) => (
      writeFile(path.join(outputDirectory, `${toSlug(key)}.svg`), toSvg(frame), "utf8")
    )),
  );
  await Promise.all(
    Object.entries(OLD_FRAMES).map(([key, frame]) => (
      writeFile(path.join(outputDirectory, `old-${key}.svg`), toSvg(frame, OLD_PALETTE), "utf8")
    )),
  );
  await Promise.all(
    Object.entries(OLD_GAME_SPRITES).map(([key, frame]) => (
      writeFile(path.join(outputDirectory, `old-${toSlug(key)}.svg`), toSvg(frame, OLD_PALETTE), "utf8")
    )),
  );
  await writeFile(reviewPage, toReviewPage(), "utf8");
  console.log(`Generated ${Object.keys(FRAMES).length} player frames and ${Object.keys(GAME_SPRITES).length} game sprites in ${outputDirectory}`);
  console.log(`Review sprites at ${path.join(websiteRoot, "public", "character-review.html")}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
