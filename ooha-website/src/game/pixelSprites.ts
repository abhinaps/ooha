export interface PixelSprite {
  readonly rows: readonly string[];
}

type SpritePalette = Readonly<Record<string, string>>;

const bakedSprites = new WeakMap<PixelSprite, Map<string, HTMLCanvasElement>>();
const isPaletteKey = (cell: string, palette: SpritePalette): boolean => (
  Object.hasOwn(palette, cell)
);

const bake = (
  sprite: PixelSprite,
  palette: SpritePalette,
  destinationWidth: number,
  scale: number,
): HTMLCanvasElement | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const sourceWidth = sprite.rows[0]?.length ?? 0;
  if (sourceWidth === 0 || sprite.rows.length === 0) {
    throw new Error("Cannot bake an empty pixel sprite.");
  }

  const cellSize = (destinationWidth * scale) / sourceWidth;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * cellSize));
  canvas.height = Math.max(1, Math.round(sprite.rows.length * cellSize));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create the pixel sprite canvas context.");
  }

  for (let y = 0; y < sprite.rows.length; y += 1) {
    const y0 = Math.round(y * cellSize);
    const y1 = Math.round((y + 1) * cellSize);
    const row = sprite.rows[y];
    for (let x = 0; x < sourceWidth; x += 1) {
      const cell = row[x];
      if (cell === ".") continue;
      if (!isPaletteKey(cell, palette)) {
        throw new Error(`Unknown pixel sprite palette key: ${cell}`);
      }

      const x0 = Math.round(x * cellSize);
      const x1 = Math.round((x + 1) * cellSize);
      context.fillStyle = palette[cell];
      context.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }

  return canvas;
};

export const drawPixelSprite = (
  context: CanvasRenderingContext2D,
  sprite: PixelSprite,
  palette: SpritePalette,
  x: number,
  y: number,
  destinationWidth: number,
  stepped = false,
) => {
  if (typeof document === "undefined") {
    return;
  }

  const transform = context.getTransform();
  const scale = Math.abs(transform.a) || 1;
  const bakeScale = stepped
    ? 2 ** (Math.round(Math.log2(scale) * 4) / 4)
    : scale;

  let spriteCache = bakedSprites.get(sprite);
  if (!spriteCache) {
    spriteCache = new Map();
    bakedSprites.set(sprite, spriteCache);
  }

  const cacheKey = `${destinationWidth}@${bakeScale}`;
  let bitmap = spriteCache.get(cacheKey);
  if (!bitmap) {
    if (spriteCache.size > 40) {
      spriteCache.clear();
    }
    bitmap = bake(sprite, palette, destinationWidth, bakeScale) ?? undefined;
    if (!bitmap) {
      return;
    }
    spriteCache.set(cacheKey, bitmap);
  }

  const drawScale = scale / bakeScale;
  const drawWidth = Math.round(bitmap.width * drawScale);
  const drawHeight = Math.round(bitmap.height * drawScale);
  const drawX = Math.round(x * scale + transform.e);
  const drawY = Math.round(y * scale + transform.f);

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  context.restore();
};
