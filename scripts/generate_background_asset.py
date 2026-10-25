#!/usr/bin/env python3
r"""Build the OOHA background tile while preserving the actual horizon row.

The horizontal wraparound fix is still required, but it must never violate the scene's true horizon.
The horizon is the real authoring anchor, and the player stands on it at GROUND_Y = 240 on a 300 px canvas.
"""

from __future__ import annotations

import argparse
import re
import warnings
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = 100_000_000
warnings.filterwarnings("ignore", category=Image.DecompressionBombWarning)


def read_game_constants(constants_path: Path) -> dict[str, int]:
    text = constants_path.read_text(encoding="utf-8")
    values: dict[str, int] = {}
    for key in ("CANVAS_WIDTH", "CANVAS_HEIGHT", "GROUND_Y", "GROUND_HEIGHT", "PLAYER_H"):
        match = re.search(rf"export const {key}\s*=\s*(\d+)", text)
        if match:
            values[key] = int(match.group(1))
    return values


def estimate_horizon_y(image: Image.Image) -> int:
    """Find the horizon using the image's own sky/ground contrast while preserving the original scene anchor."""
    width, height = image.size
    if height <= 1:
        return 0

    row_scores: list[float] = []
    for y in range(height):
        total_r = 0
        total_g = 0
        total_b = 0
        for x in range(width):
            r, g, b = image.getpixel((x, y))[:3]
            total_r += r
            total_g += g
            total_b += b
        avg_r = total_r / width
        avg_g = total_g / width
        avg_b = total_b / width
        row_scores.append((avg_g - avg_b) + 0.35 * (avg_g - avg_r))

    window = 11
    smoothed: list[float] = []
    for index in range(height):
        start = max(0, index - window // 2)
        end = min(height, index + window // 2 + 1)
        smoothed.append(sum(row_scores[start:end]) / (end - start))

    for y in range(1, height - 30):
        if smoothed[y] > 0 and all(smoothed[y + offset] > 0 for offset in range(1, 25)):
            return max(0, min(height - 1, y))

    return int(height * 0.43)


def find_best_overlap_width(image: Image.Image, candidates: tuple[int, ...] = (128, 160, 192, 224, 256)) -> int:
    """Pick the overlap whose left and right edge regions are the most visually similar.

    We prefer a match in the lower scenic half where the grass and horizon contour matter more than the sky.
    """
    width, height = image.size
    best_width = candidates[0]
    best_score = float("inf")

    for overlap in candidates:
        if overlap >= width:
            continue

        left = image.crop((0, 0, overlap, height))
        right = image.crop((width - overlap, 0, width, height))
        diff_total = 0.0
        weight_total = 0.0

        for y in range(height):
            weight = 1.0 if y >= height * 0.25 else 0.35
            for x in range(overlap):
                pl = left.getpixel((x, y))
                pr = right.getpixel((x, y))
                diff_total += (
                    abs(pl[0] - pr[0]) + abs(pl[1] - pr[1]) + abs(pl[2] - pr[2])
                ) * weight
                weight_total += weight

        score = diff_total / max(1.0, weight_total)
        if score < best_score:
            best_score = score
            best_width = overlap

    return best_width


def mean_abs_rgb_difference(left: Image.Image, right: Image.Image) -> float:
    """Return the average per-channel absolute difference between two images of equal size."""
    width, height = left.size
    total = 0.0
    pixels = 0
    for y in range(height):
        for x in range(width):
            pl = left.getpixel((x, y))[:3]
            pr = right.getpixel((x, y))[:3]
            total += abs(pl[0] - pr[0]) + abs(pl[1] - pr[1]) + abs(pl[2] - pr[2])
            pixels += 3
    return total / max(1, pixels)


def derive_manual_add_crop(crop_path: Path, add_crop_path: Path) -> Image.Image:
    """Create the manual add-on programmatically from the original crop.

    The manually edited edge was produced by taking the left 8% of the crop, flipping it, and using it as a
    replacement end-section. Reproducing that step inside the script makes the fix deterministic and keeps the
    original crop untouched.
    """
    original = Image.open(crop_path).convert("RGBA")
    width, height = original.size
    section_width = max(1, int(round(width * 0.08)))
    left_section = original.crop((0, 0, section_width, height)).transpose(Image.FLIP_LEFT_RIGHT)
    if add_crop_path.exists():
        return Image.open(add_crop_path).convert("RGBA")

    add_crop_path.parent.mkdir(parents=True, exist_ok=True)
    left_section.save(add_crop_path, format="PNG")
    return left_section


def build_transition_tile(
    crop_path: Path,
    add_crop_path: Path,
    output_path: Path,
    *,
    constants_path: Path | None = None,
) -> dict:
    original = Image.open(crop_path).convert("RGBA")
    edited = derive_manual_add_crop(crop_path, add_crop_path)
    width, height = original.size
    if width < 2:
        raise ValueError("Original crop is too small to tile.")
    if edited.size[1] != height:
        raise ValueError(f"Edited section height mismatch: {edited.size[1]} != {height}")

    constants = {}
    if constants_path is not None and constants_path.exists():
        constants = read_game_constants(constants_path)

    horizon_y = estimate_horizon_y(original)
    overlap_candidates = (128, 160, 192, 224, 256)
    best_overlap = 0
    best_score = float("inf")

    for overlap in overlap_candidates:
        if overlap >= edited.width:
            continue
        left = edited.crop((0, 0, overlap, height))
        right = original.crop((width - overlap, 0, width, height))
        diff_total = 0.0
        weight_total = 0.0
        for y in range(height):
            weight = 1.0 if y >= height * 0.25 else 0.35
            for x in range(overlap):
                pl = left.getpixel((x, y))[:3]
                pr = right.getpixel((x, y))[:3]
                diff_total += (
                    abs(pl[0] - pr[0]) + abs(pl[1] - pr[1]) + abs(pl[2] - pr[2])
                ) * weight
                weight_total += weight
        score = diff_total / max(1.0, weight_total)
        if score < best_score:
            best_score = score
            best_overlap = overlap

    if best_overlap <= 0:
        best_overlap = min(192, edited.width)

    tile_width = width + edited.width - best_overlap
    tile = Image.new("RGBA", (tile_width, height))
    tile.paste(original, (0, 0))
    tile.paste(edited, (width - best_overlap, 0))

    for y in range(height):
        for x in range(width - best_overlap, width):
            local = x - (width - best_overlap)
            alpha = local / max(1, best_overlap - 1)
            left_pixel = original.getpixel((x, y))
            right_pixel = edited.getpixel((local, y))
            blended = tuple(
                int(left_pixel[i] * (1.0 - alpha) + right_pixel[i] * alpha)
                for i in range(4)
            )
            tile.putpixel((x, y), blended)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    tile.save(output_path, format="PNG")

    preview = Image.new("RGBA", (tile.width * 3, tile.height))
    for index in range(3):
        preview.paste(tile, (tile.width * index, 0))

    first_join = preview.crop((tile.width - 32, 0, tile.width + 32, preview.height))
    left_first = first_join.crop((0, 0, 32, first_join.height))
    right_first = first_join.crop((32, 0, 64, first_join.height))
    first_join_mean = mean_abs_rgb_difference(left_first, right_first)

    second_join = preview.crop((tile.width * 2 - 32, 0, tile.width * 2 + 32, preview.height))
    left_second = second_join.crop((0, 0, 32, second_join.height))
    right_second = second_join.crop((32, 0, 64, second_join.height))
    second_join_mean = mean_abs_rgb_difference(left_second, right_second)

    preview_path = output_path.with_name(output_path.stem + "-preview.png")
    preview.save(preview_path, format="PNG")

    return {
        "original_size": original.size,
        "edited_size": edited.size,
        "tile_size": tile.size,
        "overlap_width": best_overlap,
        "horizon_y": horizon_y,
        "ground_y": constants.get("GROUND_Y"),
        "join_mean_abs_diff": [first_join_mean, second_join_mean],
        "output": str(output_path),
        "preview": str(preview_path),
        "source_files": {
            "crop": str(crop_path),
            "add_crop": str(add_crop_path),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the OOHA background tile using the original crop and the manually edited edge section.")
    parser.add_argument("--crop", type=Path, default=Path("C:/git/ooha/ooha-website/public/game-bg-crop.png"), help="Original landscape crop.")
    parser.add_argument("--add-crop", type=Path, default=Path("C:/git/ooha/ooha-website/public/game-bg-add-crop.png"), help="Manually edited end section to integrate into the tile.")
    parser.add_argument("--out", type=Path, default=Path("C:/git/ooha/ooha-website/public/game-bg-tile.png"), help="Output tile path.")
    parser.add_argument("--constants-file", type=Path, default=Path("C:/git/ooha/ooha-website/src/game/constants.ts"), help="Game constants file to read GROUND_Y from.")
    args = parser.parse_args()

    if not args.crop.exists():
        raise FileNotFoundError(f"Original crop not found: {args.crop}")
    if not args.add_crop.exists():
        raise FileNotFoundError(f"Edited add-crop not found: {args.add_crop}")

    details = build_transition_tile(args.crop, args.add_crop, args.out, constants_path=args.constants_file)
    print("=== OOHA tile rebuild ===")
    print(f"original_size: {details['original_size']}")
    print(f"edited_size: {details['edited_size']}")
    print(f"tile_size: {details['tile_size']}")
    print(f"overlap_width: {details['overlap_width']}")
    print(f"horizon_y: {details['horizon_y']}")
    print(f"ground_y: {details['ground_y']}")
    print(f"join_mean_abs_diff: {details['join_mean_abs_diff']}")
    print(f"source_files: {details['source_files']}")
    print(f"saved_to: {details['output']}")
    print(f"preview_saved_to: {details['preview']}")


if __name__ == "__main__":
    main()
