import {
  GAME_SPRITES,
  PLAYER_PALETTE,
  type GameSpriteKey,
} from "@/game/playerFrames";
import { drawPixelSprite } from "@/game/pixelSprites";

export const drawGameSprite = (
  context: CanvasRenderingContext2D,
  key: GameSpriteKey,
  x: number,
  y: number,
  width: number,
) => {
  if (typeof document === "undefined") {
    return;
  }

  const frame = GAME_SPRITES[key];
  drawPixelSprite(context, frame, PLAYER_PALETTE, x, y, width);
};
