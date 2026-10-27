# Pixel-Art Generation Guide (Flower Dodger)

How to generate, rebuild, review, and wire up the player and game-art sprites. All pixel art is **generated, never hand-edited**: `ooha-website/src/game/playerFrames.ts`, `ooha-website/public/character/*.svg`, and `ooha-website/public/character-review.html` are outputs of `scripts/gen-character.mjs`.

Related sources in this repository: `ooha-website/src/game/constants.ts`, `ooha-website/src/game/playerAnimation.ts`, `ooha-website/src/game/playerSprites.ts`, `ooha-website/src/game/gameSprites.ts`, `ooha-website/src/components/Game.tsx`, `ooha-website/src/components/HUD.tsx`, `scripts/gen-character.mjs`, and `scripts/sim-hitbox.mjs`.

---

## 0. Visual reference (target look)

Reference page: `http://localhost:3000/character-review.html`. Every regenerated frame should be checked there against the target below.

### 0.1 Player character (reference-sheet art)

- The active run cycle and poses are sampled from `run.webp` and `run-1.webp`; the duck frames and transitions are sampled from `duck.webp`.
- Preserve the reference artwork: dark charcoal hair with a violet highlight, warm skin, a red shirt with red-on-red folds, charcoal trousers, and light sneakers.
- The outlines and the near-by color shades are part of the source art. Close shades are intentional pixel gradients, not duplicate-color defects; keep them distinct in the palette.
- The source `front` pose faces forward; the run, standing, jump, land, and duck poses use the supplied side-facing art.

### 0.2 Frame groups on the review page

| Group | Frames (review-page labels) |
|---|---|
| Run cycle | `run-0` ... `run-5` (legs scissor, arm counter-swings, 1px body bob) |
| Other poses | `stand`, `jump up (rising)`, `jump tuck (apex)`, `jump fall (descending)`, `land (squash, ~90ms)`, `front` |
| Duck, prone crawl | `duck-0` ... `duck-3` (24x10 source, 48x20 in game) plus one larger preview |
| Duck transitions | Down: `stand` -> `fall-0` -> `fall-1` -> `crawl`. Up: `rise-0` -> `squat (land)` -> `run` |

Pose notes:

- `jump up`: head tilted back, near arm raised overhead, legs trailing straight.
- `jump tuck`: knees pulled up to the chest, arm wrapped around the knee, body compressed.
- `jump fall`: both arms flung out for balance, legs reaching down.
- `land` / `squat`: deep crouch, head low, hands resting at the knees.
- `fall-0`: crouch tipping forward onto the hands; `fall-1`: horizontal, feet kicked up behind.
- `crawl`: flat on the belly, head lifted with the nose forward, legs trailing, ground-line outline on the bottom row.
- `rise-0`: hips high, hands planted, then `squat`, then back to `run`.

### 0.3 Companion sprites

| Asset | Source / in game |
|---|---|---|
| Ghost `angry` | `entities.webp`, 16x16, 2x = 32x32 (in a 224x224 sheet cell) |
| Ghost `cyclops` | `entities.webp`, 16x16, 2x = 32x32 (in a 224x224 sheet cell) |
| Flowers `blue`, `pink`, `gold` | `entities.webp`, 13x13, 2.5x = 33x33 |
| Hearts `full`, `empty` | `entities.webp`, 13x12 source, 2x = 26x24 |

### 0.4 Scoreboard (HUD, 3x)

Flower icons reuse the flower grids and **fill from the bottom, one third per flower collected** (0/3, 1/3, 2/3, 3/3). Unfilled pixels are flat grey, the outline is always drawn, and each state is shown at large and small size on the review page. Row 0/3 is a fully grey silhouette; row 3/3 is the full-colour flower.

### 0.5 Playing box

The target design calls for five bezel style options, each shown for playing and game over; the start screen reuses the same button. Style 1 is the "Pixel bezel": a chunky stair-stepped pink border. The current generator/review page covers the sprite and HUD art above, not the bezel options; the other four styles need their visual references before implementation.

---

## 1. Quick start

```bash
cd ooha-website
npm run generate:character       # writes player/game sprite data, SVGs, and review gallery
npm run check:character          # validates generated frames and simulates hitboxes
```

- The generator reads the reference WebP sheets with Python and Pillow, then validates dimensions and palette keys. The source art includes its own outlines and may touch a crop edge; old hand-authored sprites retain their stricter margin checks.
- Python and Pillow are required for `npm run generate:character` and `npm run check:character`. Set `PYTHON` to the Python executable if it is not named `python`.
- The review page at `public/character-review.html` groups player poses, ghosts, flowers, hearts, and all four progress-fill states.
- Its animation preview cards loop the six-frame run cycle, show a low ghost passing beneath the player during the game-physics jump arc, and show the run-to-duck and duck-to-run transition frames. These previews are for review only and do not change game behavior.
- Adding a frame means updating `scripts/gen-character.mjs` and the visual frame selector in `src/components/Game.tsx`. `PlayerFrameKey` is generated.

---

## 2. Frame inventory

| Sprite | Source grid | Scale | Drawn size | Game box it must match |
|---|---|---|---|---|
| stand / run0-5 / jumpUp / jumpTuck / jumpFall / land / front | 18x29 | 2x | 36x58 | `PLAYER_W` x `PLAYER_H` |
| prone `duck0-3` | 24x10 | 2x | 48x20 | `PLAYER_DUCK_W` x `PLAYER_DUCK_H` |
| `duckFall0` | 24x20 | 2x | 48x40 | visual only (hitbox already prone) |
| `duckFall1` | 24x13 | 2x | 48x26 | visual only |
| `duckRise0` | 24x14 | 2x | 48x28 | visual only (hitbox already standing) |

**Frame keys:** `stand, front, jumpUp, jumpTuck, jumpFall, land, duckFall0, duckFall1, duckRise0, duck0-3, run0-5`

---

## 3. Shared art rules (every grid)

- Rows are equal-length strings. `.` = transparent. Any other char is a palette key.
- Source-sheet sprites already include their outlines and color gradients; do not redraw or flatten them in the generator.
- Every sampled source color gets its own palette entry and one UTF-16 private-use code unit in the generated rows. This preserves neighboring shades as distinct pixels instead of snapping them to a smaller hand-picked palette.
- The exact `#19151f` outline color uses the shared key `o`; other sampled outline shades remain distinct. Flower progress retains cells within 10 RGB-distance units of that outline color.
- The generated palette also reserves `z` (`#5d5c70`) for unfilled flower-progress pixels.
- New source artwork may touch the crop boundary because the supplied silhouette and outline are already baked in. Legacy procedural artwork still uses the 4-neighbour outline pass and must leave room for it.
- A missing palette key, `undefined` cell (ragged row) or `.` is skipped silently at runtime. Only the generator validates.

The generated `PLAYER_PALETTE` in `playerFrames.ts` is the authoritative source palette. `OLD_PLAYER_PALETTE` contains the prior procedural artwork's named colors.

---

## 4. Legacy procedural artwork

The new active art is extracted from the supplied reference sheets. The following build details describe only the preserved previous art, emitted with the `old-` prefix and rendered using `OLD_PLAYER_PALETTE`.

```text
W=18  H=29  DUCK_W=24  DUCK_H=10  GROUND=27 (row where a planted foot starts)
Rows of a 29-row pose: 0 margin | 1-8 head | 9 neck | 10-17 torso | 18-26 legs | 27-28 shoes
```

### 4.1 Head and torso (`upperBody`, shifted by `dy`)

- Hair rows 1-3 (cols 5-12), highlight row 2 cols 7-9.
- Face rows 4-8: skin, 1px nose at col 13 on row 6, eye at `(10, 5+dy)`.
- Neck row 9 cols 8-10 in `S`.
- Torso `rect(6, 10+dy, 7, 8)` in `t`, with column 6 in `T`.
- Arm: sleeve `rect(10, 10+dy, 2, 3)`, forearm 5 steps from `(10, 13+dy)` toward `10+dx`.
- Leg: hip x 8, top row `18+dy`, 4px wide, shoe `rect(ankleX, 27-lift+dy, 5, 2)`.

### 4.2 Run cycle (6 frames, `run0`-`run5`)

| Frame | Near leg `{dx, lift}` | Arm swing | Body bob |
|---|---|---|---|
| 0 | `{3, 0}` reach, planted | -2 | 0 |
| 1 | `{0, 0}` under hip | -1 | 0 |
| 2 | `{-3, 0}` push off | 1 | 0 |
| 3 | `{-2, 1}` toe leaves | 2 | -1 |
| 4 | `{0, 2}` knee up | 1 | -1 |
| 5 | `{3, 1}` swing forward | -1 | 0 |

### 4.3 Jump set (stretch -> curl -> stretch -> compress)

| Key | When drawn (`Player.draw`) | Build |
|---|---|---|
| `jumpUp` | `vy < -230` | far arm up/back `[7,11]->[4,2]`, far leg `{-4,2}`, near leg `{-2,0}`, near arm `[11,11]->[14,1]` |
| `jumpTuck` | `\|vy\| <= 230` (apex) | `dy 3`, thigh `(9,19)->(13,20)` then shin `->(9,24)` (limb width 3), arm wraps knee `[10,11]->[14,16]` |
| `jumpFall` | `vy > 230` or speed-drop active | far arm `[7,11]->[2,8]`, far leg `{-1,2}`, near leg `{3,0}`, near arm `[11,11]->[16,7]` |
| `land` | `landMs > 0` (90 ms) and second half of rise | `dy 8`, head low, knees bent, hands at knees |

No take-off crouch frame exists on purpose (it adds input lag).

### 4.4 Duck set

| Key | Grid | Used when | Notes |
|---|---|---|---|
| `duckFall0` | 24x20 | first half of `DUCK_IN_MS` (110) | knees bent, tipping forward, shoes rows 18-19 |
| `duckFall1` | 24x13 | second half | horizontal, feet kicked up |
| `duck0-3` | 24x10 | crawl loop | torso `rect(6,5,10,4)`, belly shadow row 8, head `proneHead` (nose x 22, eye (20,3)), bottom row = ground outline |
| `duckRise0` | 24x14 | first half of `RISE_MS` (140) | hips high, hands planted; then `land` |

Crawl table (opposite limbs work together):

| Frame | nearKnee | farKnee | nearArm reach | farArm reach |
|---|---|---|---|---|
| 0 | yes | no | 0 | 2 |
| 1 | no | no | 1 | 2 |
| 2 | no | yes | 2 | 0 |
| 3 | no | no | 2 | 1 |

`REACH = [17, 19, 22]` (forearm end x). Near leg `yTop 7`, far leg `yTop 6`; bent knee at `(9, 3)`.

---

## 5. Rendering engine

Player draw: `drawPlayerSprite(ctx, key, x, baselineY, alpha = 1)` in `src/game/playerSprites.ts`.

1. Grids are baked to cached offscreen canvases at 2x, giving standing frames their 36x58 logical dimensions and prone frames 48x20.
2. Each palette cell is drawn as an integer-sized rectangle; the generated grid already contains its four-neighbour outline.
3. Cached frames are blitted with `imageSmoothingEnabled = false`.

Player-specific behaviour:

- Frames are cached by key in one `Map`.
- **Feet-anchored:** the renderer draws each frame with its bottom on `baselineY`, so standing, transition, and prone frames land on the same ground.
- Sets `ctx.globalAlpha = alpha` for the invincibility pulse.
- The game keeps its 800x300 logical canvas and lets CSS scale it responsively; it does not resize the backing canvas to device pixel ratio.
- The sprite renderer returns without drawing during server rendering.

Ghosts and flowers use `drawGameSprite(ctx, key, x, y, width, height)` in `src/game/gameSprites.ts`; the player and game renderers share the `drawPixelSprite()` baker in `src/game/pixelSprites.ts`. The baker uses the current canvas transform to calculate the device-pixel cell size, rounds every source-pixel edge independently, and caches canvases per sprite, destination width, and bake scale. Blitting temporarily switches to identity transform, disables smoothing, and snaps the destination origin to device pixels. This keeps pixel edges crisp under fractional canvas transforms without rebuilding the art on every draw. HUD hearts use the generated 13x12 SVGs at 26x24; flower progress uses generated icons that fill from the bottom at 0/3 through 3/3.

---

## 6. Frame selection (`Player.draw`, first match wins)

| Condition | Key |
|---|---|
| `state === "duck"` and `duckInMs > DUCK_IN_MS / 2` | `duckFall0` |
| `state === "duck"` and `duckInMs > 0` | `duckFall1` |
| `state === "duck"` | `` `duck${duckFrame}` `` (0-3) |
| `state === "jump"` and (`speedDrop` or `vy > APEX_BAND`) | `jumpFall` |
| `state === "jump"` and `vy < -APEX_BAND` | `jumpUp` |
| `state === "jump"` otherwise | `jumpTuck` |
| `riseMs > 0` and `riseMs > RISE_MS / 2` | `duckRise0` |
| `riseMs > 0` otherwise | `land` |
| `landMs > 0` | `land` |
| otherwise | `` `run${runFrame}` `` (0-5) |

**Placement:** `feet = player.y + (ducking ? PLAYER_DUCK_H : PLAYER_H)`; `wide = ducking || key === "duckRise0"`; `x = player.x + (wide ? PLAYER_DUCK_OFFSET_X : 0)`; then `drawPlayerSprite(ctx, key, x, feet, alpha)`. `duckRise0` is drawn while the player is standing, so `feet = y + PLAYER_H`, which equals `GROUND_Y` (240).

Run and crawl frame timers are visual-only and advance with game speed. Physics updates continue to use the existing game loop.

---

## 7. Hitboxes (the only collision data; `overlaps` is strict AABB)

| State | `getBounds()` | Logical numbers |
|---|---|---|
| stand / run / jump / land | `x+6, y, 24, 58` | x 126-150, y 182-240 grounded |
| prone | `x-6+6, y, 36, 20` | x 120-156, y 220-240 |

In source pixels:

- Standing box = src cols 3-14 (`6/2` to `30/2`), full 29 rows. It does **not** shrink for `jumpTuck` or `land`, so the top of the box can be empty air in those poses. The nose at col 13-14 sits on the right edge of the box.
- Prone box = src cols 3-20 of the 24-wide grid; nose and outline (cols 22-23) stick out about 6 px on purpose.
- The hitbox switches instantly on duck/unduck and on jump; transition frames (`duckFall0/1`, `duckRise0`, `land`) are visual only.

---

## 8. How the avatar plugs into game logic

### Jump
- `Player.jump()` resets `y = GROUND_Y - PLAYER_H` (so a duck jump does not start below the floor) and sets `vy = -760`.
- Landing at `y >= 182` sets `state = "run"` and starts the visual 90 ms landing pose.
- `JUMP_BUFFER_MS = 140` exists in `constants.ts`, but the current `Game.tsx` does not implement buffered jumps; a press before landing is not retained.
- Pose thresholds: `APEX_BAND = 230` px/s. `jumpUp` if `vy < -230`, `jumpFall` if `vy > 230` or speed drop, else `jumpTuck`.
- The sprite is anchored on its feet, so the bottom row of every standing frame must be shoes (rows 27-28). A frame with an empty bottom row floats above the ground.
- Clearing a low ghost needs feet at least 38 px up (`GROUND_Y - lowTopMin = 240 - 202`). Peak is 111 px, so there is large slack.

### Duck
- `duck(true)` on the ground: `startDuck()` sets `y = 220`, `duckInMs = 110`, prone hitbox at once.
- High ghost bottom is at most 202: above the prone top (220), below the standing top (182). A low ghost still hits a prone player, so ducking never dodges it.
- Release: `y` back to 182, `riseMs = 140`, standing hitbox immediately while `duckRise0` / `land` are still drawn. Be down by ghost offset about 27 (`offset = ghost.x - PLAYER_X`), release once offset <= -20.
- `duckRise0` and `duck*` are the "wide" frames, drawn at `x = PLAYER_X + PLAYER_DUCK_OFFSET_X`; `Player.draw()` and `poseAt()` both decide this per key.
- Duck while airborne = speed drop (`speedDrop = true`, `vy = 0` if rising); landing while still held goes straight into prone.

### Damage and feedback
- `takeDamage()` is ignored while `invincibleMs > 0` (1500 ms); the overlap test itself is skipped during that time.
- Draw alpha pulses `0.3 + 0.7 * (sin(elapsed * 0.045) * 0.5 + 0.5)`.
- Current draw order: background, flowers, ghosts, player, particles.

### Animation timing (must stay in sync with the landing page)

| Value | Visual animation source |
|---|---|
| Run frame | `RUN_FRAME_MS = 65`, scaled by game speed, 6 frames |
| Crawl frame | `DUCK_FRAME_MS = 110`, 4 frames |
| Drop in | `DUCK_IN_MS = 110` (two visual halves) |
| Stand up | `RISE_MS = 140` (two visual halves) |
| Landing squash | `LAND_SQUASH_MS = 90` |
| Apex band | `APEX_BAND = 230` |

These values are in `src/game/playerAnimation.ts` and affect visuals only. They do not change jump physics, duck timing, collision checks, or spawn behavior.

---

## 9. Regeneration checklist

1. Update the source sheets or crop configuration in `scripts/extract-character-sheets.py` for new art (never edit `playerFrames.ts` or generated SVGs).
2. Keep every standing/jump/land/run frame exactly **18x29** and every prone/duck frame **24 wide** (`duckFall0` 20 rows, `duckFall1` 13, `duckRise0` 14, `duck0-3` 10).
3. Keep shoes on rows 27-28 in standing frames; prone bottom row = ground outline.
4. Keep legacy procedural shapes off the grid edge so the outline pass can add its border; source-sheet silhouettes already include their edge outlines.
5. Keep source colors distinct when they form gradients; the generator builds the active palette from sampled source colors.
6. Run `npm run generate:character` from `ooha-website` (it throws on invalid rows and keys; it requires Python with Pillow).
7. If a frame was added, update the visual frame selector in `src/components/Game.tsx`.
8. If animation timings change, edit the visual-only values in `src/game/playerAnimation.ts`.
9. Run `npm run check:character` and playtest: duck should clear a high ghost, jump should clear a low ghost, and standing should hit a high ghost.

---

## 10. What breaks when the avatar is generated or used incorrectly

| Mistake | Effect |
|---|---|
| Player frame not 18 wide / 29 tall (or prone not 24x10) | Bake cell is computed from `SPRITE_W` (18), so a wider frame draws wider than `PLAYER_W`; the feet baseline moves and the character floats or sinks relative to `GROUND_Y`. |
| Empty bottom rows in a standing frame | Sprite floats above the ground (anchor is the grid bottom, not the shoes). |
| Prone frame taller than 10 rows without updating `PLAYER_DUCK_H` | Visual no longer matches the 20 px prone hitbox. Transition frames may differ because they are visual only. |
| Prone frame not 24 wide | `wide` x offset (-6) no longer centres it; sprite shifts relative to its hitbox. |
| Legacy procedural shapes touching the grid edge | `put()` clips silently and `outline()` cannot add the border, so the silhouette loses its outline. Source-sheet crops already contain their outlines. |
| Missing or misspelled palette key | Pixel skipped silently (transparent hole). Only the generator checks this. |
| Hand-editing `playerFrames.ts` | Overwritten on the next generator run. |
| Changing `PLAYER_*` without art or `getBounds()` | Hitbox and visual disagree; hits feel unfair. |
| Changing player positions or dimensions without updating `getPlayerBounds()` | Hitbox and art no longer match. |
| Changing `GROUND_Y` without adjusting the hero overlay anchor | Runner's soles leave the painted horizon. |
| Drawing sprites without the cached pixel bake | Pixel edges can blur. |

---

## 11. Verified against the current game

The numeric values below were compared with `ooha-website/src/game/constants.ts`:

| Guide value | Current game value | Result |
|---|---:|---|
| Standing sprite 18x29 at 2x = 36x58 | `PLAYER_W=36`, `PLAYER_H=58` | Match |
| Prone sprite 24x10 at 2x = 48x20 | `PLAYER_DUCK_W=48`, `PLAYER_DUCK_H=20` | Match |
| Prone horizontal offset -6 | `PLAYER_DUCK_OFFSET_X=-6` | Match |
| Ground Y 240 | `GROUND_Y=240` | Match |
| Jump velocity -760 | `JUMP_VELOCITY=-760` | Match |
| Jump apex about 111 px | `GRAVITY=2600`, `JUMP_VELOCITY=-760` gives 111.08 px | Match |
| Ghost hitbox extents | 32x32 sprites, 4 px inset, 6 px bob | Match; worst-case high-ghost bottom and low-ghost top are both y=202 |
| Flower art 13x13 at 2.5x = 33x33 | Current flower bounds are `FLOWER_W=32`, `FLOWER_H=34` | Mismatch; preserve the 32x34 gameplay bounds if flower art is added |

Differences from the guide's original implementation:

- `JUMP_BUFFER_MS=140` is present but not used in `Game.tsx`; buffered jumps are not current behavior. This avatar integration does not add buffering.
- Run/duck/transition timings and the 230 px/s pose band were not existing game constants. They now live in `src/game/playerAnimation.ts` and are used only for sprite selection.
- The guide's device-pixel-ratio canvas resize and `setTransform` pipeline are not present in this game. The existing canvas keeps its logical 800x300 backing size and is CSS-scaled.
- Game behavior is implemented in `src/components/Game.tsx`; there is no separate `Player` class, `journey.ts`, or `poseAt()` in this project.
- The guide's 26x24 heart artwork is not a game constant here; the current lives HUD is rendered as HTML text.