# OOHA Developer Guide

This project is a small Next.js landing-page app with a browser game and email capture flow. The app lives in the `ooha-website` folder and uses the App Router from Next.js.

## 1. Project overview

The main goal of the project is to combine:
- a prelaunch marketing page,
- a playable mini-game,
- and an email sign-up flow.

The important pieces are:
- app pages and route composition,
- reusable UI components,
- game logic and constants,
- API route for subscribing users.

---

## 2. Where to start

### Main app shell
- `ooha-website/src/app/layout.tsx`
  - global metadata
  - fonts
  - page wrapper

- `ooha-website/src/app/globals.css`
  - shared styling reset
  - app-level theme defaults

### Homepage
- `ooha-website/src/app/page.tsx`
  - main landing page entry
  - composes the header and the game

### Game page
- `ooha-website/src/app/game/page.tsx`
  - play preview route
  - includes game component and signup form

---

## 3. Key files by responsibility

### App UI and pages
- `ooha-website/src/app/page.tsx`
- `ooha-website/src/app/game/page.tsx`
- `ooha-website/src/components/Header.tsx`
- `ooha-website/src/components/EmailForm.tsx`

Use these when changing:
- landing page content
- page layout
- navigation/header text
- page sections
- CTA blocks

### Game code
- `ooha-website/src/components/Game.tsx`
- `ooha-website/src/game/constants.ts`
- `ooha-website/src/game/utils.ts`
- `ooha-website/src/types/game.ts`

Use these when changing:
- jumping and physics
- collision rules
- enemy or flower behavior
- spawn timing
- difficulty tuning
- win / lose state

### Email capture flow
- `ooha-website/src/components/EmailForm.tsx`
- `ooha-website/src/app/api/subscribe/route.ts`

Use these when changing:
- validation logic
- button copy
- success/error messaging
- API provider integration
- CRM or email platform hooks

---

## 4. How the game works

The game loop is in `ooha-website/src/components/Game.tsx`.

It manages a world object with:
- player state
- ghosts
- flowers
- particles
- lives
- tally of collected flowers
- current game status (`idle`, `playing`, `gameover`, `won`)

The animation loop runs using `requestAnimationFrame`, updates physics, checks collisions, spawns new entities, and re-renders the canvas.

The visual game overlays are layered above the canvas:
- `StartScreen`
- `HUD`
- `GameOverScreen`
- `WinScreen`

---

## 5. Tuning values and where to edit them

The main balance values live in:
- `ooha-website/src/game/constants.ts`

Common values you may adjust:
- `GRAVITY`
- `JUMP_VELOCITY`
- `BASE_SPEED`
- `MAX_SPEED`
- `FLOWER_QUOTA`
- `GHOST_SPAWN_MS`
- `FLOWER_SPAWN_MS_START`
- `FLOWER_SPAWN_MS_END`
- `INVINCIBILITY_MS`

If the game feels too hard or too easy, start here before changing the actual logic.

---

## 6. Best places for future changes

### Add a new section to the homepage
Create or update a component in:
- `ooha-website/src/components/`
Then import it into:
- `ooha-website/src/app/page.tsx`

### Add a new route or page
Create a folder under:
- `ooha-website/src/app/`
Then add a `page.tsx` file in that folder.

### Add a new game mechanic
Start in:
- `ooha-website/src/components/Game.tsx`
Then add constants in:
- `ooha-website/src/game/constants.ts`
And helper logic in:
- `ooha-website/src/game/utils.ts`

### Add a new API route
Use this pattern:
- `ooha-website/src/app/api/.../route.ts`

The current example is:
- `ooha-website/src/app/api/subscribe/route.ts`

### Add form validation or backend submission changes
Edit:
- `ooha-website/src/components/EmailForm.tsx`
- `ooha-website/src/app/api/subscribe/route.ts`

---

## 7. Development workflow

When making a change, follow this order:

1. Decide which layer it belongs to:
   - page/layout
   - component styling
   - game logic
   - API/backend

2. Check the closest existing file with similar behavior.

3. Keep config values in constants instead of hard-coding them inline.

4. Reuse a component before creating a new one.

5. Validate with the app in the browser and run lint/build when relevant.

---

## 8. Quick reference table

| Need | File |
|---|---|
| Homepage layout | `ooha-website/src/app/page.tsx` |
| App wrapper and metadata | `ooha-website/src/app/layout.tsx` |
| Global theme and reset | `ooha-website/src/app/globals.css` |
| Header | `ooha-website/src/components/Header.tsx` |
| Game loop | `ooha-website/src/components/Game.tsx` |
| Difficulty values | `ooha-website/src/game/constants.ts` |
| Collision + spawn helpers | `ooha-website/src/game/utils.ts` |
| Game types | `ooha-website/src/types/game.ts` |
| Signup form | `ooha-website/src/components/EmailForm.tsx` |
| Signup API | `ooha-website/src/app/api/subscribe/route.ts` |

---

## 9. Common change examples

### Change homepage copy
Edit `ooha-website/src/app/page.tsx` and the relevant component files.

### Change button colors or form styling
Edit the relevant component class names or the global stylesheet.

### Change game difficulty
Start in `ooha-website/src/game/constants.ts`.

### Change game win condition
Look at:
- `ooha-website/src/components/Game.tsx`
- `ooha-website/src/game/constants.ts`

### Change signup success text
Edit `ooha-website/src/components/EmailForm.tsx` and/or the API route response.

### Change backend provider
Edit `ooha-website/src/app/api/subscribe/route.ts`.

---

## 10. Notes

This project is intentionally modular but still compact. Most feature work will be centered in one of three places:
- page composition in the app router,
- UI components in `src/components`,
- game behavior in `src/components/Game.tsx` and `src/game/*`.

That makes it easy to extend without creating unnecessary layers.
