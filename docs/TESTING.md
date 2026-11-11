# Testing

`npm run verify` runs every check; run it before committing. CI (`.github/workflows/ci.yml`) runs the same steps.

| Command | What it checks | Time |
|---|---|---|
| `npm run lint` | ESLint over all code and tests | seconds |
| `npm test` | unit tests in `tests/unit/` (Node, fake DOM) | seconds |
| `npm run check` | every import and literal asset path exists; every menu item has a scene | seconds |
| `npm run smoke` | every game in a real headless Chromium (`tests/smoke/`) | ~4 min |

First time only: `npx playwright install chromium`.

## Unit tests (`tests/unit/`)

- Run on `node:test` with `@happy-dom/global-registrator` as the DOM. `setup/register.js` also resolves the browser imports (`/core/...`, `three`) the way `index.html` does.
- Modules that read `#ui` or `#modal` when imported (`ui/UI.js`, `core/Scena.js`) must be imported after `helpers/dom.js` `createPageElements()`.
- `helpers/frames.js` replaces `requestAnimationFrame`, so a test steps the game loop frame by frame.
- 3D logic runs on real three.js: actors get box meshes and tiny animation clips (`actor.test.js`, `follow.test.js`). Give boxes their origin at the feet (`geometry.translate(0, height / 2, 0)`), like the character models, or ray casts pass over them.

## Smoke tests (`tests/smoke/`)

- `scenes.spec.js`: each game loads and survives a few seconds of random input.
- `flow.spec.js`: each game pauses and continues, ends, plays again and returns to the menu; 3D games must draw a picture.
- `navigation.spec.js`: menu, switching games, Back/Forward, unknown game, runtime error screen.
- `phone.spec.js` (project `phone`, Pixel 7 emulation): touch controls of `warplane`, `moon-landing`, `cannon`.

A test fails on any uncaught error, console error, failed request, or more than one full screen button. Textures that models reference but the repository lacks are listed in `known-issues.js`.

Import `test` from `helpers.js`, not from Playwright: it exposes the game's `SceneManager` as `window.sceneManager`, which `waitForScene`, `startGame` and the flow test use.

### Pitfalls

- 3D renders in software (SwiftShader); with four games at once one frame can take seconds. Hold a key until its effect shows instead of pressing it, and wait with generous timeouts.
- Random play can end a game (a mine, a zombie). Do not play randomly before a step that needs a running game.
- Headless Escape does not release a locked mouse; first-person games pause on that release, so the flow test calls `document.exitPointerLock()`.
- `page.waitForFunction` does not await an async predicate; keep predicates synchronous.
- A touch hold needs CDP `Input.dispatchTouchEvent` (`touchStart`, wait, `touchEnd`); `tap()` is too short to charge the cannon.
