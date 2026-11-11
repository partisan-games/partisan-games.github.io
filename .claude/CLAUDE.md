# Partisan Games: notes for agents

Small 2D and 3D browser games in plain ES modules, no build step. `index.html` maps `three` to `/libs/three/` and every import is root-relative (`/core/...`). `libs/` is vendored: do not edit it. Architecture and method order: [docs/DOCS.md](../docs/DOCS.md). Checks and test setup: [docs/TESTING.md](../docs/TESTING.md).

## Game lifecycle facts that caused most bugs

- Switching games changes `location.hash` without a page reload (`scenes/main.js`, `scenes/SceneManager.js`). Whatever a scene or its objects add to `document`, `window`, `body` or the shared `#platno-3d` canvas must be removed in `end()`, or it lives on in the next game.
- `init()` is async. A newer start can end a scene while its `init` still runs; `SceneManager` ends it again when `init` finishes. Async click handlers in scenes must check `this.ui.ended` after each `await` and guard against a second click.
- The game loop keeps running after victory or defeat: `finish()` only stops game time. Scenes check end conditions every frame, so `Scena.defeat`/`victory` keep the first result and `UI.showMessage` stays silent while any menu (start, pause, end) is shown. Call `this.defeat`/`this.victory`, never `this.ui.defeat`/`victory`, which skip `finish()`.
- Per-frame values need `dt`; a value per frame changes with the screen's refresh rate.
- Three.js `AnimationMixer` reports `finished` and `loop` for every action, including the one fading out; listeners must check `e.action`.

## Working rules

- `core/`, `core3d/` and `ui/` are shared by all 39 games: a change there needs a unit test and a full `npm run smoke`.
- A bug fix needs a test that fails without the fix. To prove it, copy the changed files to the scratchpad, revert the fix, run the test, and copy the files back. Do not use `git stash` (it also takes unrelated uncommitted work) or `tar` with `C:` paths (it treats `C:` as a host).
- Scripts that start `node scripts/serve.js` in the background leave port 4173 busy; stop the process afterwards, or the next smoke run reuses a stale server.
- To inspect a running game, open `/#<scene>` with Playwright and read `window.sceneManager.instance.scene` after importing `/scenes/SceneManager.js` (see `tests/smoke/helpers.js`).
