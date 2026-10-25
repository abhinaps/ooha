export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type GameState = "idle" | "playing" | "paused" | "gameover" | "won";
export type FlowerColor = "blue" | "pink" | "gold";
export type FlowerTally = Record<FlowerColor, number>;
export type GhostHeight = "low" | "high";
