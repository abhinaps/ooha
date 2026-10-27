# Flower Dodger --- OOHA Game Build Specification

**Source:** `ooha game spec.pdf` (18-page scanned PDF)\
**Purpose:** Implementation-ready specification for the Flower Dodger
game and the OOHA prelaunch website that wraps it.\
**Source fidelity note:** The PDF is a scanned document. The
specification below preserves the legible requirements and numeric logic
recovered from it. A few constants and portions of the landing-page
choreography were not reliably legible in OCR; these are explicitly
marked **VERIFY FROM SOURCE** rather than guessed.

------------------------------------------------------------------------

## 1. Product concept

Build a side-scrolling, Chrome-Dino-style runner with an objective
rather than a score chase.

-   Logical game canvas: **800 × 300**.
-   Avatar stays on the left; ghosts and flowers scroll in from the
    right.
-   Jump over **low ghosts** and duck under **high ghosts**.
-   Collect **3 blue + 3 pink + 3 gold flowers** to win.
-   Player starts with **3 lives**.
-   World speed increases with elapsed play time.
-   No high score, no timer, and no on-screen score. HUD contains only
    flower progress and lives.
-   End states show **"GAME OVER"** or **"YOU WON"** and a **"Play
    Again"** action.
-   No game progress is persisted.

The game is embedded in a scroll-driven OOHA prelaunch website: the
avatar appears to run through the scene, the camera pulls back to reveal
the game frame, the playable game fades in on matching pixels, and an
email sign-up appears afterwards. The art direction is pixel art over a
painted world, with a 1 px dark outline (`#1a1520`) and a square frame
with CRT treatment.

## 2. Stack and project configuration

-   Next.js **16.4 App Router**
-   React **19.3**
-   Tailwind CSS **v4**
-   TypeScript **5**, strict mode
-   Canvas 2D rendering
-   State architecture: mutable simulation state in refs; React state
    only for visible UI values (lives, flower tally, game state; score
    is mentioned only as a canvas aria-label in the source)
-   Import alias: `@/*` → `./src/*`
-   Animation/simulation runs in `requestAnimationFrame`, with `dt`
    measured in seconds.

### Next.js configuration

The source gives this configuration shape:

``` ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};
```

Dependencies named in the source: - `next: 16.4.0` - `react: 19.3.0` -
`react-dom: 19.3.0` - `@tailwindcss/turbopack: 4` - `tailwindcss: 4` -
`typescript: 5` - `eslint: 9` - `eslint-config-next: 16.4.0` -
`@types/node: 20` - `@types/react` and `@types/react-dom: 19`

`globals.css` starts with `@import "tailwindcss";`. `layout.tsx` uses
Geist and Geist Mono via `next/font/google`, exposed as
`--font-geist-sans` and `--font-geist-mono`. The HTML language is `en`;
`suppressHydrationWarning` is used because browser extensions may inject
attributes. Body is a full-height flex column. Metadata: - Title:
`OOHA — Prelaunch` - Description:
`Something new is coming. Play while you wait.`

**Repository-first rule:** Before changing anything, inspect
`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`,
`AGENTS.md`, and `node_modules/next/dist/docs/`. The source warns that
this Next.js version has breaking changes. Add only what is missing and
verify against the source checklist (§12 in the PDF).

## 3. Required file structure

``` text
src/
  app/
    layout.tsx
    page.tsx                    # prelaunch landing page
    launch/page.tsx
    api/subscribe/route.ts
    globals.css
  components/
    Game.tsx
    HUD.tsx
    PixelHeart.tsx
    FlowerProgress.tsx
    StartScreen.tsx
    GameOverScreen.tsx
    WinScreen.tsx
  game/
    constants.ts
    useGameLoop.ts
    utils.ts
    entities/
      Player.ts
      PlayerSprite.ts
      playerFrames/              # generated
      pixelSprites.ts
      ghostSprites.ts
      flowerSprites.ts
      Ghost.ts
      Flower.ts
    systems/
      CollisionSystem.ts
      SpawnSystem.ts
      ParticleSystem.ts
    background/
      Background.ts
      Scenery.ts
  landing/
    journey.ts
    JourneyStage.tsx
    ProductCard.tsx
    products.ts
    SiteHeader.tsx
    SignUpPanel.tsx
    SubscribeForm.tsx
  types/game.ts
tools/
  gen-character.mjs
  sim-hitbox.mjs
public/
  ooha/
    world.jpg                    # 6490 × 3269 painting
    logo.png                     # 900 × 347
  character/
    *.svg                        # generated review SVGs
  character-review.html          # development viewer
```

## 4. Types and coordinate system

``` ts
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
```

Coordinates use logical canvas dimensions `800 × 300`, origin at the
top-left, and y increases downward. CSS scales the canvas.
`GROUND_Y = 240` is the **top of the ground**. A standing entity's y is
`GROUND_Y - height`. The world painting's horizon is pinned to
`GROUND_Y`, so the character's soles sit on the horizon.

## 5. Constants

The following values are legible in the source scan. Identifier spelling
is normalized to valid TypeScript where OCR split identifiers.

``` ts
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 300;

export const GROUND_Y = 240;
export const GROUND_HEIGHT = 60;

export const GRAVITY = 2600;             // px/s²
export const JUMP_VELOCITY = -760;       // px/s; peak ~111 px, airtime ~0.58 s
export const JUMP_BUFFER_MS = 140;      // jump pressed this soon before landing still fires

export const PLAYER_X = 120;
export const PLAYER_W = 36;
export const PLAYER_H = 58;
export const PLAYER_DUCK_H = 20;
export const PLAYER_DUCK_W = 48;
export const PLAYER_DUCK_OFFSET_X = -6;

export const GHOST_W = 32;
export const GHOST_H = 32;
export const GHOST_INSET = 4;
export const GHOST_LOW_Y = GROUND_Y - GHOST_H - 4;  // 204
export const GHOST_HIGH_Y = GROUND_Y - GHOST_H - 40; // 168
export const GHOST_BOB_AMPLITUDE = 6;

export const FLOWER_W = 32;
export const FLOWER_H = 34;
export const FLOWER_GROUND_Y = GROUND_Y - FLOWER_H;

export const BASE_SPEED = 230;            // px/s
export const MAX_SPEED = 460;             // px/s
export const SPEED_ACCELERATION = 2;      // px/s per second of play

export const FLOWER_QUOTA = 3;
export const FLOWER_AIR_LIFT_MIN = 60;
export const FLOWER_AIR_LIFT_MAX = 100;
export const GOLD_AIR_LIFT_MIN = 105;
export const GOLD_AIR_LIFT_MAX = 120;

export const INVINCIBILITY_MS = 1500;
export const SPEED_DROP_MULTIPLIER = 3;   // gravity multiplier while fast-falling

export const BACKGROUND_SRC = "/ooha/world.jpg";
export const WORLD_HEIGHT = 1500;
export const WORLD_HORIZON_FRAC = 1420 / 3260;
export const WORLD_HORIZON_Y = GROUND_Y;
export const WORLD_TOP = WORLD_HORIZON_Y - WORLD_HORIZON_FRAC * WORLD_HEIGHT; // about -413
export const BACKGROUND_PARALLAX = 0.35;

export const SPAWN_CLEARANCE = 34;          // padding so a flower never spawns on a ghost
export const GHOST_SPAWN_MS = 2200;        // about 506 px apart at base speed

export const FLOWER_SPAWN_MS_START = 2400;
export const FLOWER_SPAWN_MS_END = 1000;
export const FLOWER_SPAWN_RAMP_SECONDS = 75;
```

The scan shows flower hex colors, but OCR corrupts the blue and gold
values. Pink is legible as `#fd79a8`; verify the exact
`FLOWER_COLORS_HEX` mapping from the original PDF/art source before
implementing. The source lists `FLOWER_POINTS` as blue `1`, pink `3`,
gold `10`; these points are not displayed as a score and must not drive
speed.

## 6. Game loop and utility logic

### Fixed substeps

``` ts
const MAX_SUBSTEP = 1 / 120;
const MAX_FRAME_SECONDS = 1 / 15;
```

The loop: 1. Stores latest `update` and `render` callbacks in refs using
an effect, not during render. 2. Does nothing if `running` is false. 3.
On each RAF, computes
`elapsed = min((now - last) / 1000, MAX_FRAME_SECONDS)`. 4. Splits
elapsed time into `ceil(elapsed / MAX_SUBSTEP)` equal update steps. 5.
Calls update for each substep, then renders once. 6. Cancels the active
RAF on cleanup.

This caps a long frame to 1/15 second and keeps collision simulation
slices at or below 1/120 second.

### Speed

``` ts
export const accelerate = (speed: number, dt: number) =>
  Math.min(MAX_SPEED, speed + SPEED_ACCELERATION * dt);
```

Speed begins at `230 px/s`, increases by `2 px/s` per second of play,
and reaches `460 px/s` after approximately **115 seconds**.

### Collision

Touching edges do **not** count as a collision. Use strict comparisons:

``` ts
export function overlaps(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
```

Hitboxes are inset from visual sprites. Do not use sprite rectangles as
collision boxes unless the entity's `getBounds()` specifies them.

### Spawn timing

Ghost height is random with equal probability:

``` ts
Math.random() < 0.5 ? "low" : "high"
```

Spawn interval shrinks as speed rises so the **distance in pixels**
between spawns remains roughly constant:

``` ts
return timer >= Math.max(
  baseIntervalMs * 0.5,
  baseIntervalMs / (gameSpeed / BASE_SPEED)
);
```

Flower spawn interval ramps linearly from **2400 ms** to **1000 ms**
over **75 seconds**:

``` ts
const t = clamp(elapsedSeconds / FLOWER_SPAWN_RAMP_SECONDS, 0, 1);
return FLOWER_SPAWN_MS_START +
  (FLOWER_SPAWN_MS_END - FLOWER_SPAWN_MS_START) * t;
```

### Flower colour weighting

Base weights are blue `6`, pink `3`, gold `1` (60/30/10). If a colour
has already reached its quota of 3, its weight becomes `1` rather than
zero; it can still spawn rarely, preventing overall flower density from
collapsing. The source describes these pool ratios: - Start: 60/30/10 -
Blue quota complete: 20/60/20 - Blue and pink quotas complete: 33/33/33

Use weighted random selection based on these weights.

### Flower/ghost clearance

`isClearOfGhosts(...)` checks whether a proposed flower bounds
rectangle, inflated by the `SPAWN_CLEARANCE` padding, overlaps any
ghost's bounds. A flower must not spawn too close to a ghost. The full
implementation details should be checked against the PDF scan before
finalizing edge behavior.

### Particles

`burst(x, y, color, count = 12)` creates particles with: - Angle:
`(i / count) * 2π + random offset in approximately [-0.5, 0.5]` - Speed:
approximately `80 + random * 120` - `vx = cos(angle) * speed` -
`vy = sin(angle) * speed - 60` - Initial life: `1` - Size:
`3 + random * 4`

Each update: move by velocity, add downward acceleration `200 * dt` to
`vy`, reduce life by `dt * 1.8`, remove dead particles. Draw with
`globalAlpha = life` and a filled circle of radius `size * life`.

## 7. Player behaviour

Player states are `"run" | "jump" | "duck"`. There is no `"hurt"` state.
Invincibility is tracked by `invincibleMs`; it pulses opacity and blocks
repeated damage, but **does not disable player control**.

Initial fields: - `x = PLAYER_X` - `y = GROUND_Y - PLAYER_H` - `vy` -
`lives = 3` - `invincibleMs`

Animation/control fields include `runFrame`, `runTimer`, `duckFrame`,
`duckTimer`, `jumpBufferMs`, `speedDrop`, `landMs`, `duckInMs`,
`riseMs`.

Animation constants: - `RUN_FRAME_MS = 65` - `RUN_FRAMES = 6` -
`DUCK_FRAME_MS = 110` - `DUCK_FRAMES = 4` - `DUCK_IN_MS = 110` -
`RISE_MS = 149` - `APEX_BAND = 230` - `LAND_SQUASH_MS = 90`

A player is grounded while state is `run` or `duck`.

### Jump

-   If grounded, snap y to `GROUND_Y - PLAYER_H`, set
    `vy = JUMP_VELOCITY`, set state to `jump`, and clear `speedDrop`,
    jump buffer, landing squash, duck-in and rise timers.
-   If airborne, store a jump buffer of `JUMP_BUFFER_MS`; a buffered
    jump fires on landing.
-   No double jump.

### Duck and fast-fall

-   Releasing duck clears `speedDrop`.
-   If currently ducking, releasing duck stands the player up (`run`),
    sets standing y, and starts the short duck-in/rise visual timers.
-   If duck is held while jumping, enable `speedDrop = true` and clamp
    vertical velocity so it is not negative (the player begins falling
    faster).
-   If duck is held while running, enter duck state:
    -   state `duck`
    -   clear landing/rise timers
    -   set `duckInMs = DUCK_IN_MS`
    -   reset duck frame/timer
    -   set y to `GROUND_Y - PLAYER_DUCK_H`
-   If fast-fall is still held on touchdown, enter duck state; otherwise
    return to run and apply `LAND_SQUASH_MS`.

### Damage and invincibility

`takeDamage()` is a no-op when `invincibleMs > 0`. Otherwise decrement
lives by one and set `invincibleMs = 1500 ms`. During invincibility,
blink/pulse opacity; collisions must not repeatedly remove lives during
the window.

### Update order and animation

-   Decay invincibility and all transient timers by `dt * 1000`,
    clamping each at zero.
-   In jump state, apply gravity (`GRAVITY`, multiplied by
    `SPEED_DROP_MULTIPLIER` during fast-fall), integrate vertical
    velocity and position, clamp at floor, then handle touchdown.
-   After landing, execute any unexpired buffered jump if grounded.
-   Run/duck animation timers advance in proportion to `dt * 1000` and
    frame duration scaled by `BASE_SPEED / max(gameSpeed, 1)`, carrying
    timer remainder forward so the legs do not skate.
-   Frame selection:
    -   Duck: use duck-in frames while `duckInMs` is active, then the
        current duck animation frame.
    -   Jump: use falling frame while fast-falling or `vy > 230`; use
        rising frame when `vy < -230`; otherwise use tuck frame.
    -   Rise and landing squash frames are visual-only; they must never
        block input.
-   Draw sprites feet-anchored. Standing feet are `y + PLAYER_H`;
    ducking feet are `y + PLAYER_DUCK_H`. The 24-pixel-wide
    crawl/duck-fall/duck-rise frames are offset using
    `PLAYER_DUCK_OFFSET_X`.
-   Invincibility opacity is a pulse around a low/high alpha; exact OCR
    of the sine expression is imperfect, so verify the precise formula
    from the PDF if pixel-perfect reproduction is required.

### Player hitboxes

Standing/run/jump:

``` ts
{ x: x + 6, y, w: PLAYER_W - 12, h: PLAYER_H }
```

Duck:

``` ts
{
  x: x + PLAYER_DUCK_OFFSET_X + 6,
  y,
  w: PLAYER_DUCK_W - 12,
  h: PLAYER_DUCK_H,
}
```

Hitboxes depend on state, not on the visual animation frame.

## 8. Ghost entity

-   New ghost spawns at `x = CANVAS_WIDTH + 20`.
-   y is `GHOST_LOW_Y` or `GHOST_HIGH_Y`.
-   Choose a random bob timer and random sprite variant.
-   Each update: `x -= gameSpeed * dt`; advance bob timer; set y to base
    y plus `sin(bobTimer) * GHOST_BOB_AMPLITUDE`.
-   Off-screen when `x + GHOST_W < 0`.
-   Bounds are inset by `GHOST_INSET` (4 px) from the visual rectangle.
-   Ghosts are avoided by jumping low ghosts and ducking under high
    ghosts.

## 9. Flowers and objective

-   Flower dimensions: `32 × 34`.
-   Ground flower y is `GROUND_Y - FLOWER_H`.
-   Flower positions scroll left with game speed.
-   Flower colours: blue, pink, gold.
-   Standard flower air lift is randomly selected between **60--100
    px**; gold flower air lift is **105--120 px**.
-   Collecting a flower increments that colour's tally and emits a
    colour-matched particle burst.
-   The objective is reached only when all three tallies are at least 3:
    blue ≥ 3, pink ≥ 3, gold ≥ 3.
-   Flowers at/above quota may still spawn, but at reduced weighting; do
    not make their weight zero.
-   Flower points (blue 1, pink 3, gold 10) are not shown as a score and
    must not become a visible score mechanic.

## 10. UI, rendering and visual direction

### HUD

-   Show flower progress by colour and lives.
-   Use `FlowerProgress`, `PixelHeart`, and `HUD` components.
-   No timer, score, or high-score display.
-   `StartScreen`, `GameOverScreen`, and `WinScreen` are separate
    components.
-   End screens must say exactly `GAME OVER` and `YOU WON`,
    respectively, and provide `Play Again`.

### Art

-   Pixel-art sprites with a 1 px `#141520` outline over a painted
    background.
-   Game frame is square in visual treatment and includes a CRT screen
    treatment.
-   Background asset: `/ooha/world.jpg` (source says original painting
    is 6490 × 3269).
-   Background drawing uses `WORLD_HEIGHT = 1500`, horizon fraction
    `1420 / 3260`, horizon aligned to `GROUND_Y`, and parallax factor
    `0.35`.
-   Generated character assets are reviewed through
    `public/character-review.html`; scripts are
    `tools/gen-character.mjs` and `tools/sim-hitbox.mjs`.

**VERIFY FROM SOURCE:** Exact CRT overlay values, sprite-sheet frame
names/dimensions, flower hex values, and detailed scenery routines are
not reliably recoverable from the OCR text alone.

## 11. OOHA prelaunch website journey

The source requires the playable game to be wrapped by a scroll-driven
site: 1. An avatar runs through the painted scene. 2. The camera pulls
back until the game frame is visible. 3. The actual game fades in at
pixel positions matching the preceding scene. 4. An email sign-up
appears after the game section.

Required landing modules/files: - `journey.ts`: journey/stage
configuration - `JourneyStage.tsx`: scroll-driven stage presentation -
`ProductCard.tsx` and `products.ts` - `SiteHeader.tsx` -
`SignUpPanel.tsx` - `SubscribeForm.tsx` -
`src/app/api/subscribe/route.ts`: subscription API route

The prelaunch landing page is `src/app/page.tsx`; a separate `/launch`
route is required. The sign-up form submits through the API route. Do
not assume a particular email provider, database, or storage
policy---the scanned source does not make these legible enough to
specify. Game progress itself is not persisted.

**VERIFY FROM SOURCE:** Exact journey stage names, scroll thresholds,
camera interpolation/easing, product content, form validation copy, API
response shapes, and success/error UI could not be reliably extracted
from the scan and should be transcribed from the PDF manually before
implementation.

## 12. Input, lifecycle and state requirements

-   Use refs for high-frequency mutable world simulation; use React
    state only for values that must update React UI.
-   RAF loop should run only while game state is `playing`; pause/stop
    should cancel the loop cleanly.
-   Reset all world entities, timers, speed, tallies, lives,
    invincibility and particles when starting a fresh game or selecting
    Play Again.
-   Game state values are `idle`, `playing`, `paused`, `gameover`, and
    `won`.
-   Collision should use the entity bounds and strict overlap rule;
    touching edges are not collisions.
-   Keep input responsive during invincibility and during purely visual
    animation transitions.
-   Do not persist the run, tally, lives, or score.

## 13. Implementation acceptance checklist

-   [ ] Inspect repository/configuration/docs before editing; retain
    existing correct setup.
-   [ ] Canvas logical dimensions are 800 × 300 and CSS scaling does not
    alter game coordinates.
-   [ ] Ground top is y = 240 and the background horizon aligns to it.
-   [ ] Player starts at x = 120, standing height 58, and has 3 lives.
-   [ ] Jump velocity, gravity and jump buffering match the specified
    constants.
-   [ ] No double jump; buffered jump fires when landing if buffer
    remains.
-   [ ] Ducking lowers the hitbox; duck held in the air triggers
    fast-fall and landing duck.
-   [ ] Low and high ghost y positions match constants; ghost hitbox
    inset is 4 px.
-   [ ] Strict rectangle overlap means edge-touching does not collide.
-   [ ] Damage decrements one life and grants 1500 ms invincibility;
    player remains controllable.
-   [ ] Speed ramps from 230 to 460 at +2 px/s per second.
-   [ ] Ghost spawn interval scales with speed to maintain approximate
    world-space spacing.
-   [ ] Flower interval moves from 2400 ms to 1000 ms over 75 seconds.
-   [ ] Flower colour weighting changes as quotas are reached, while
    completed colours retain weight 1.
-   [ ] Flowers avoid ghosts with 34 px clearance.
-   [ ] Winning requires 3 blue, 3 pink and 3 gold flowers.
-   [ ] HUD shows only flower progress and lives; no score or timer.
-   [ ] Game over and win screens use the exact required labels and Play
    Again action.
-   [ ] Particles are emitted on collection and are removed after their
    life expires.
-   [ ] No game progress is persisted.
-   [ ] Scroll journey includes running scene → camera pullback →
    pixel-matched game fade-in → email sign-up.
-   [ ] `/`, `/launch`, and `/api/subscribe` exist with the required
    roles.
-   [ ] Verify remaining scan-dependent details called out above before
    claiming pixel-perfect completion.

## 14. Source limitations and unresolved items

This source PDF is a scan, and text extraction returned no selectable
text. The following should be checked visually against the original
pages before implementing exact fidelity: 1. `FLOWER_COLORS_HEX` values
for blue and gold. 2. Exact invincibility pulse equation. 3. Exact
sprite frame names and frame-sheet geometry. 4. Background scenery
routines and CRT treatment settings. 5. Full `isClearOfGhosts`
implementation and any fallback behaviour when a flower location is
blocked. 6. Exact landing journey stages, thresholds, transitions, and
product-card copy. 7. Subscribe form validation, API request/response
format, and success/error messaging. 8. Exact final source checklist
referenced as §12, since the scan/OCR did not expose it completely.

Do not silently substitute guessed values for these unresolved details.

## 14a. Additional source-confirmed notes captured during review

The following details were captured as explicit implementation notes and
should be treated as source-confirmed unless later contradicted by a
clean transcribed PDF page:

1. Flower burst colours
   - Blue: `#4a8fe0`
   - Gold: `#fdcb6e`
   - These are only used for the collect-burst particle colour. The
     flower sprites themselves are drawn from their sprite palette.

2. Invincibility pulse
   - `elapsed = INVINCIBILITY_MS - invincibleMs` in milliseconds
   - `INVINCIBILITY_MS = 1500`
   - `alpha = 0.3 + 0.7 * (Math.sin(elapsed * 0.045) * 0.5 + 0.5)`
   - This ranges from about `0.3` to `1.0`, with a period of roughly
     `140 ms`.

3. Sprite frame sheet geometry
   - Main frame: `18 × 29` for stand, run 0-5, jump up, jump fall, and
     land.
   - Duck frame: `24 × 20` for duck-fall 0.
   - Rise frame: `24 × 13` for duck-rise.
   - Everything draws at `*2`, so the effective on-canvas size is
     `36 × 58` for the main frame.
   - The note explicitly says: "we will make the frames ourselves now."

4. Background update / draw rules
   - `groundOffset = (groundOffset + speed * dt) % 40`
   - `sceneOffset = (sceneOffset + speed * 0.35 * dt) % WORLD_PERIOD`
   - Background drawing: draw the scenery frame first, then draw the
     ground dashes using `rgba(46, 58, 10, 0.42)` with a dash every
     `20 × 3 px` at `Ground_Y`.
   - CRT treatment for the landing page is not yet implemented.

5. `isClearOfGhosts` implementation
   ```ts
   function isClearOfGhosts(
     bounds: Rect,
     ghosts: readonly { getBounds(): Rect }[],
     clearance = SPAWN_CLEARANCE
   ) {
     const padded = {
       x: bounds.x - clearance,
       y: bounds.y - clearance,
       w: bounds.w + clearance * 2,
       h: bounds.h + clearance * 2,
     };

     return !ghosts.some((g) => overlaps(padded, g.getBounds()));
   }
   ```
   - `SPAWN_CLEARANCE = 34`.
   - The only fallback is in `game.update`.
   - On flower spawn, the timer resets to 0 and the flower colour is
     rolled once.
   - Two candidate positions are built for that colour: the preferred
     height and the opposite height.
   - The first candidate that passes `isClearOfGhosts` is used.
   - If both candidates are blocked, the colour is not rerolled and the
     flower is not nudged; the next attempt occurs after a full interval.
   - When a new ghost spawns, any existing flowers that fail
     `isClearOfGhosts` are removed.

6. Landing journey details
   - This section is not yet implemented.
   - Exact journey stages, thresholds, transitions, and product-card copy
     remain source-dependent and must be verified from the original PDF
     before finalizing the landing-page build.

7. Repo verification requirement
   - Subscribe-form validation, API request/response format, and success
     or error messaging must be verified from the repo itself before
     final implementation, because the scan did not expose those details
     reliably enough to transcribe with confidence.
