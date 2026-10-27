npm run build# Character review handoff

## Status

The review gallery is generated at `public/character-review.html` by
`scripts/gen-character.mjs`. It has not been published; publication is deferred
because the destination is private.

## Integrated updates

- The ducking preview uses the cyclops ghost.
- Flower progress is represented by the sprite's visual fill, with no numeric
  counters or dark panel backgrounds.
- The in-game HUD shows the three flower progress sprites without dark chips or
  numeric counters, plus three hearts without a surrounding panel. A collision
  replaces a full heart with the hollow-heart sprite.
- Gameplay scoring, flower collection, lives, and collision mechanics are
  unchanged.

## Publishing later

The repository's `.github/workflows/deploy.yml` attempts to publish
`ooha-website/out` to GitHub Pages after a push to `main`. A production build
currently does not create that `out` directory because `next.config.ts` does
not enable static export. Configure and validate the intended private hosting
destination before changing deployment settings or pushing to `main`.
