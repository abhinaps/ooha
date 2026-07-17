# OOHA Website — Build Spec & Visual Style Guide

> This doc is the build reference. Fill in placeholders (marked `[ASSET: ...]` and `[FILL IN: ...]`) as assets and decisions are finalized.

---

## 1. Concept Summary

A single-page pre-launch site combining a **painterly landscape background** with **retro pixel-art game elements**. Two states within one shared shell: a **sign-up screen** and a **playable game screen**, both using the same header and background treatment.

---

## 2. Visual Style Guide

### 2.1 Art Direction
- Background: painted/oil-canvas landscape texture — soft, analog, storybook feel
- Foreground game elements: crisp pixel-art sprites (8-bit/16-bit style) — deliberate contrast against the painterly backdrop
- Overall mood: cozy, playful, nostalgic-arcade meets fine art

### 2.2 Color Palette

Sampled directly from the provided mockups. Treat as a strong starting point — confirm against final source files/Figma if available, since flattened PNG exports can shift a swatch slightly from the original.

| Role | Color | Hex (sampled) | Notes |
|---|---|---|---|
| Sky | Pale periwinkle blue | `#D9E0FC` | Fairly consistent across both screens |
| Field | Warm olive-yellow green | `#B99900` (deep shadow) / `#A7AD2C` (mid-tone) | Field has a gradient — darker/warmer toward bottom, brighter yellow-green in lit patches. Treat as a 2-stop gradient, not a flat fill |
| Header background | White | `#FFFFFF` | |
| Logo / primary text | Near-black | `#1A1A1A` | Visually reads as pure black — confirm exact value from vector source |
| Input field background | White | `#FFFFFF` | |
| Button fill (Submit) | Soft lavender-blue | `#D0D8EC` | Muted, close to sky tone but slightly greyer/darker for contrast |
| Button text | Black | `#000000` | |
| Heart / life icon | Red | `#D71F22` | |
| Play button overlay | White circle + lavender-blue triangle | `#FFFFFF` / `#D0D8EC` | Circle appears ~60–70% opacity over the game background |

**Suggested CSS variables:**
```css
--ooha-sky: #D9E0FC;
--ooha-field-light: #A7AD2C;
--ooha-field-dark: #B99900;
--ooha-black: #1A1A1A;
--ooha-white: #FFFFFF;
--ooha-button: #D0D8EC;
--ooha-heart-red: #D71F22;
```

`[FILL IN: confirm final hex values against source design files if available]`

### 2.3 Typography

| Use | Style | Font | Notes |
|---|---|---|---|
| Logo wordmark | Rounded, bubbly display face | `[FILL IN: font name or "custom/locked graphic"]` | Confirm if licensed webfont or locked SVG |
| Headlines (e.g. "SIGN UP") | Bold, condensed, all caps | `[FILL IN]` | |
| Supporting copy | Light italic, letter-spaced caps | `[FILL IN]` | |
| Body / UI text | `[FILL IN]` | | |

### 2.4 Layout Notes
- Shared header across all screens: white bar, logo left, italic "WE ARE LAUNCHING SOON" right
- Generous negative space on sign-up screen — background artwork carries visual weight
- Game screen uses standard platformer HUD conventions: lives top-right, collectibles tray top-left, centered play/pause overlay

---

## 3. Screens & Components

### 3.1 Header (shared)
- [ ] Logo (left)
- [ ] "WE ARE LAUNCHING SOON" label (right)
- [ ] White background bar, fixed height across both screens

`[ASSET: header background — likely just a CSS color, no image needed]`

### 3.2 Sign-Up Screen
- [ ] Headline: "SIGN UP"
- [ ] Subcopy: "TO STAY UP TO DATE ON ALL THINGS OOHA" (logo inline within text)
- [ ] Email input field
- [ ] Submit button
- [ ] Background: full landscape painting

`[ASSET: landscape background — full resolution + web-optimized export]`

### 3.3 Game Screen
- [ ] Play/pause overlay button (centered, circular)
- [ ] Lives HUD (top-right) — 3 hearts
- [ ] Collectibles tray (top-left) — 5 flower types
- [ ] Runner character (auto-runs, jump input)
- [ ] Enemy (ghost, floats/bobs, must be avoided)
- [ ] Flower pickups placed in-world along the run path
- [ ] Score/distance tracking (implied, not shown in mockup — confirm if wanted)
- [ ] Game-over state → transitions to/reveals email capture
- [ ] Email input field
- [ ] Submit button

`[ASSET: game section — see full asset list in Section 4]`

**Game mechanic notes:**
- `[FILL IN: is this a side-scrolling runner (Chrome dino style) or a fixed-position obstacle dodge?]`
- `[FILL IN: does the flower tray fill in as a collection progress tracker, or is it purely decorative?]`
- `[FILL IN: what happens on game over — restart option? Direct to email capture only?]`
- `[FILL IN: is there a score or distance counter?]`
- `[FILL IN: reward for completing/playing — discount code, early access tag, or just "thanks for playing"?]`

### 3.4 About / Brand Story Section
- [ ] Short brand description (2–3 lines)

`[FILL IN: copy]`

### 3.5 Footer
- [ ] Social icons/links
- [ ] Copyright line
- [ ] Contact email (optional)

`[FILL IN: social handles]`

---

## 4. Visual Asset Checklist

### Branding
- [ ] `[ASSET: OOHA wordmark — SVG, black]`
- [ ] `[ASSET: OOHA wordmark — SVG, white (for dark backgrounds, if ever needed)]`
- [ ] `[ASSET: Favicon — 32×32 / 16×16 PNG or SVG]`

### Background
- [ ] `[ASSET: landscape painting — full-res source]`
- [ ] `[ASSET: landscape painting — compressed web export (WebP/JPG)]`
- [ ] `[ASSET: wide/tileable version — only needed if game scrolls horizontally]`

### Runner Character (sprite sheet)
- [ ] `[ASSET: run cycle — 4–6 frames]`
- [ ] `[ASSET: jump frame(s)]`
- [ ] `[ASSET: hit/damage frame]`
- [ ] `[ASSET: game-over/stumble frame]`

### Ghost Enemy (sprite sheet)
- [ ] `[ASSET: idle/float animation — 2–4 frames]`
- [ ] `[ASSET: additional enemy variants — optional, v2]`

### Flower Collectibles (5 types)
- [ ] `[ASSET: lily — HUD icon size]`
- [ ] `[ASSET: lily — in-world size]`
- [ ] `[ASSET: small white flower — HUD icon size]`
- [ ] `[ASSET: small white flower — in-world size]`
- [ ] `[ASSET: orange flower — HUD icon size]`
- [ ] `[ASSET: orange flower — in-world size]`
- [ ] `[ASSET: sunflower — HUD icon size]`
- [ ] `[ASSET: sunflower — in-world size]`
- [ ] `[ASSET: red/tulip flower — HUD icon size]`
- [ ] `[ASSET: red/tulip flower — in-world size]`
- [ ] `[ASSET: uncollected/outline states for all 5 — ONLY if tray is a progress tracker]`

### HUD / UI
- [ ] `[ASSET: heart icon — filled state]`
- [ ] `[ASSET: heart icon — empty/outline state]`
- [ ] `[ASSET: play button icon]`
- [ ] `[FILL IN: submit button hover/pressed state design, if any]`

### Type
- [ ] `[ASSET: logo font file / webfont license, if not a locked SVG]`
- [ ] `[ASSET: headline font file / webfont license]`

### Social / Misc
- [ ] `[ASSET: Open Graph share image — ~1200×630 static export of hero]`

---

## 5. Open Decisions Before Build

1. `[FILL IN: color hex codes]`
2. `[FILL IN: confirmed font names/files]`
3. `[FILL IN: game mechanic — side-scroll vs fixed dodge]`
4. `[FILL IN: flower tray — tracker or decoration]`
5. `[FILL IN: game-over → email flow behavior]`
6. `[FILL IN: signup incentive, if any]`
7. `[FILL IN: social handles for footer]`
8. `[FILL IN: brand story copy]`