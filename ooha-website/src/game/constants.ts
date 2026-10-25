export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 300;

export const GROUND_Y = 240;
export const GROUND_HEIGHT = 60;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = -760;
export const JUMP_BUFFER_MS = 140;

export const PLAYER_X = 120;
export const PLAYER_W = 36;
export const PLAYER_H = 58;
export const PLAYER_DUCK_H = 20;
export const PLAYER_DUCK_W = 48;
export const PLAYER_DUCK_OFFSET_X = -6;

export const GHOST_W = 32;
export const GHOST_H = 32;
export const GHOST_INSET = 4;
export const GHOST_LOW_Y = GROUND_Y - GHOST_H - 4;
export const GHOST_HIGH_Y = GROUND_Y - GHOST_H - 40;
export const GHOST_BOB_AMPLITUDE = 6;

export const FLOWER_W = 32;
export const FLOWER_H = 34;
export const FLOWER_GROUND_Y = GROUND_Y - FLOWER_H;

export const BASE_SPEED = 230;
export const MAX_SPEED = 460;
export const SPEED_ACCELERATION = 2;

export const FLOWER_QUOTA = 3;
export const FLOWER_AIR_LIFT_MIN = 60;
export const FLOWER_AIR_LIFT_MAX = 100;
export const GOLD_AIR_LIFT_MIN = 105;
export const GOLD_AIR_LIFT_MAX = 120;

export const INVINCIBILITY_MS = 1500;
export const SPEED_DROP_MULTIPLIER = 3;

export const SPAWN_CLEARANCE = 34;
export const GHOST_SPAWN_MS = 2200;

export const FLOWER_SPAWN_MS_START = 2400;
export const FLOWER_SPAWN_MS_END = 1000;
export const FLOWER_SPAWN_RAMP_SECONDS = 75;

export const FLOWER_COLORS_HEX: Record<"blue" | "pink" | "gold", string> = {
  blue: "#4a8fe0",
  pink: "#fd79a8",
  gold: "#fdcb6e",
};

export const FLOWER_POINTS: Record<"blue" | "pink" | "gold", number> = {
  blue: 1,
  pink: 3,
  gold: 10,
};
