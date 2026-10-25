import {
  PLAYER_FRAMES,
  PLAYER_PALETTE,
  type PlayerFrameKey,
} from "@/game/playerFrames";
import { drawPixelSprite } from "@/game/pixelSprites";

export const drawPlayerSprite = (
  context: CanvasRenderingContext2D,
  key: PlayerFrameKey,
  x: number,
  baselineY: number,
  alpha = 1,
) => {
  if (typeof document === "undefined") {
    return;
  }

  const frame = PLAYER_FRAMES[key];
  const destinationWidth = frame.width * 2;
  const destinationHeight = (frame.height * destinationWidth) / frame.width;
  context.save();
  context.globalAlpha *= alpha;
  drawPixelSprite(
    context,
    frame,
    PLAYER_PALETTE,
    x,
    baselineY - destinationHeight,
    destinationWidth,
  );
  context.restore();
};
