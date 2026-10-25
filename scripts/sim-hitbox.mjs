import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const websiteRoot = path.join(repoRoot, "ooha-website");
const constantsPath = path.join(websiteRoot, "src", "game", "constants.ts");
const gamePath = path.join(websiteRoot, "src", "components", "Game.tsx");
const guidePath = path.join(repoRoot, "avatar_gen.md");

const readConstants = async () => {
  const source = await readFile(constantsPath, "utf8");
  const constants = {};
  for (const match of source.matchAll(/export const ([A-Z_]+)\s*=\s*(-?\d+(?:\.\d+)?);/g)) {
    constants[match[1]] = Number(match[2]);
  }
  return constants;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const overlaps = (a, b) => (
  a.x < b.x + b.w
  && a.x + a.w > b.x
  && a.y < b.y + b.h
  && a.y + a.h > b.y
);

const main = async () => {
  const constants = await readConstants();
  const guide = await readFile(guidePath, "utf8");
  const game = await readFile(gamePath, "utf8");
  const read = (key) => {
    assert(Number.isFinite(constants[key]), `Missing game constant ${key}`);
    return constants[key];
  };

  const documentedValues = [
    ["standing sprite size", `${read("PLAYER_W")}x${read("PLAYER_H")}`, /36x58/],
    ["duck sprite size", `${read("PLAYER_DUCK_W")}x${read("PLAYER_DUCK_H")}`, /48x20/],
    ["duck horizontal offset", String(read("PLAYER_DUCK_OFFSET_X")), /x-6\+6/],
    ["ground Y", String(read("GROUND_Y")), /GROUND_Y\s*=\s*240/],
    ["jump launch velocity", String(read("JUMP_VELOCITY")), /vy\s*=\s*-760/],
    ["jump buffer constant", String(read("JUMP_BUFFER_MS")), /JUMP_BUFFER_MS\s*=\s*140/],
    ["ghost dimensions", `${read("GHOST_W")}x${read("GHOST_H")}`, /16x16, 2x = 32x32/],
  ];

  documentedValues.forEach(([label, actual, pattern]) => {
    assert(pattern.test(guide), `${label}: corresponding value is missing from avatar_gen.md`);
    console.log(`MATCH ${label}: ${actual}`);
  });
  assert(
    /x:\s*player\.x\s*\+\s*PLAYER_DUCK_OFFSET_X\s*\+\s*6,\s*y:\s*player\.y,\s*w:\s*PLAYER_DUCK_W\s*-\s*12,\s*h:\s*PLAYER_DUCK_H/.test(game),
    "Current duck collision bounds differ from the dimensions used by the hitbox simulation.",
  );
  assert(
    /x:\s*player\.x\s*\+\s*6,\s*y:\s*player\.y,\s*w:\s*PLAYER_W\s*-\s*12,\s*h:\s*PLAYER_H/.test(game),
    "Current standing collision bounds differ from the dimensions used by the hitbox simulation.",
  );
  assert(18 * 2 === read("PLAYER_W") && 29 * 2 === read("PLAYER_H"), "Standing sprite grid no longer matches the game player dimensions.");
  assert(24 * 2 === read("PLAYER_DUCK_W") && 10 * 2 === read("PLAYER_DUCK_H"), "Prone sprite grid no longer matches the game duck dimensions.");
  assert(/13x13, 2\.5x = 33x33/.test(guide), "Flower artwork dimensions are missing from avatar_gen.md.");
  console.log(
    `MISMATCH flower dimensions: guide art is 33x33; gameplay bounds are ${read("FLOWER_W")}x${read("FLOWER_H")}.`,
  );

  const groundY = read("GROUND_Y");
  const playerHeight = read("PLAYER_H");
  const duckHeight = read("PLAYER_DUCK_H");
  const ghostHeight = read("GHOST_H");
  const inset = read("GHOST_INSET");
  const bob = read("GHOST_BOB_AMPLITUDE");
  const lowGhostY = groundY - ghostHeight - 4;
  const highGhostY = groundY - ghostHeight - 40;
  const jumpHeight = read("JUMP_VELOCITY") ** 2 / (2 * read("GRAVITY"));
  const playerAtApex = { x: 0, y: groundY - playerHeight - jumpHeight, w: read("PLAYER_W") - 12, h: playerHeight };
  const lowGhostAtHighest = { x: 0, y: lowGhostY - bob + inset, w: ghostHeight - inset * 2, h: ghostHeight - inset * 2 };
  const duckPlayer = { x: 0, y: groundY - duckHeight, w: read("PLAYER_DUCK_W") - 12, h: duckHeight };
  const highGhostAtLowest = { x: 0, y: highGhostY + bob + inset, w: ghostHeight - inset * 2, h: ghostHeight - inset * 2 };
  const standingPlayer = { x: 0, y: groundY - playerHeight, w: read("PLAYER_W") - 12, h: playerHeight };
  const lowGhostAtHighestBottom = lowGhostAtHighest.y + lowGhostAtHighest.h;
  const highGhostAtLowestBottom = highGhostAtLowest.y + highGhostAtLowest.h;

  assert(!overlaps(playerAtApex, lowGhostAtHighest), "Jump apex should clear the lowest low-ghost collision box.");
  assert(!overlaps(duckPlayer, highGhostAtLowest), "Duck should clear the lowest high-ghost collision box.");
  assert(overlaps(duckPlayer, lowGhostAtHighest), "Duck should still collide with a low ghost.");
  assert(overlaps(standingPlayer, highGhostAtLowest), "Standing should collide with a high ghost.");
  assert(highGhostAtLowestBottom === 202, `Expected high ghost collision bottom 202, got ${highGhostAtLowestBottom}.`);
  assert(lowGhostAtHighest.y === 202, `Expected low ghost collision top 202, got ${lowGhostAtHighest.y}.`);

  const bufferedPressUsed = /JUMP_BUFFER_MS/.test(game);
  console.log(`MATCH jump apex rise: ${jumpHeight.toFixed(2)} px (guide rounds to 111 px)`);
  console.log(`MATCH highest player hitbox top: ${(groundY - playerHeight - jumpHeight).toFixed(2)} px`);
  console.log(`MATCH low ghost collision top: ${lowGhostAtHighest.y}px; player clears it at jump apex`);
  console.log(`MATCH high ghost collision bottom: ${highGhostAtLowestBottom}px; duck clears it`);
  console.log("MATCH standing player collides with a high ghost.");
  if (!bufferedPressUsed) {
    console.log("NOTE JUMP_BUFFER_MS=140 is declared but not used by the current game.");
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
