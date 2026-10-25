import type { Rect } from "@/types/game";
import { BASE_SPEED, MAX_SPEED, SPEED_ACCELERATION } from "@/game/constants";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const accelerate = (speed: number, dt: number) =>
  Math.min(MAX_SPEED, speed + SPEED_ACCELERATION * dt);

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

export const FLOWER_SPAWN_MS_START = 2400;
export const FLOWER_SPAWN_MS_END = 1000;

export const getFlowerSpawnMs = (elapsedSeconds: number) => {
  const progress = clamp(elapsedSeconds / 75, 0, 1);
  return (
    FLOWER_SPAWN_MS_START +
    (FLOWER_SPAWN_MS_END - FLOWER_SPAWN_MS_START) * progress
  );
};

export const getGhostSpawnMs = (gameSpeed: number, baseIntervalMs = 2200) =>
  Math.max(baseIntervalMs * 0.5, baseIntervalMs / (gameSpeed / BASE_SPEED));

export const isClearOfGhosts = (
  bounds: Rect,
  ghosts: readonly { getBounds(): Rect }[],
  clearance = 34,
) => {
  const padded = {
    x: bounds.x - clearance,
    y: bounds.y - clearance,
    w: bounds.w + clearance * 2,
    h: bounds.h + clearance * 2,
  };

  return !ghosts.some((ghost) => overlaps(padded, ghost.getBounds()));
};
