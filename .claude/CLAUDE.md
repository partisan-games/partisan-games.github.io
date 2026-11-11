# Partisan Games: notes for agents

Small 2D and 3D browser games in plain ES modules, no build step. `index.html` maps `three` to `/libs/three/` and every import is root-relative (`/core/...`). `libs/` is vendored: do not edit it. Architecture and method order: [docs/DOCS.md](../docs/DOCS.md). Checks and test setup: [docs/TESTING.md](../docs/TESTING.md).

## Game lifecycle facts that caused most bugs

- Switching games changes `location.hash` without a page reload (`scenes/main.js`, `scenes/SceneManager.js`). Whatever a scene or its objects add to `document`, `window`, `body` or the shared `#platno-3d` canvas must be removed in `end()`, or it lives on in the next game.
- `init()` is async. A newer start can end a scene while its `init` still runs; `SceneManager` ends it again when `init` finishes. Async click handlers in scenes must check `this.ui.ended` after each `await` and guard against a second click.
- The game loop keeps running after victory or defeat: `finish()` only stops game time. Scenes check end conditions every frame, so `Scena.defeat`/`victory` keep the first result and `UI.showMessage` stays silent while any central screen (`ui.screen`: start, pause, end) is shown. Scenes call `this.defeat`/`this.victory`; `ui.showDefeatScreen`/`showVictoryScreen` only draw the screen and are for `Scena`.
- Central screens are shown on events (`UI.showScreen`/`hideScreen`); the loop only redraws `sceneUI`. Delayed game actions use `after()` from `core/timers.js`, a clock the scene loop moves, so they wait in a pause and die with the game; ESLint forbids `setTimeout` in game code.
- Per-frame values need `dt`; a value per frame changes with the screen's refresh rate.
- Anything a module adds to `document`, `window` or `head` must be removable: keep the handler in a field (not an inline arrow) so `end()` can remove it, and add page-wide styles once. `tests/smoke/leaks.spec.js` catches what grows across game switches.
- Three.js `AnimationMixer` reports `finished` and `loop` for every action, including the one fading out; listeners must check `e.action`.

## Working rules

- Styles, sounds, keys, asset paths and the 60 fps unit each have one source: `ui/styles.js`, `core/io/sound.js`, `core/io/keys.js`, `config.assets`, `core/konstante.js` (see `docs/DOCS.md`). Read from there instead of writing the value again.
- New and renamed identifiers are in English; existing Serbian names (mostly 2D: `Predmet`, `ugao`, `umri`) stay until a change renames them. Rename instead of adding an alias.
- `core/`, `core3d/` and `ui/` are shared by all 39 games: a change there needs a unit test and a full `npm run smoke`.
- A bug fix needs a test that fails without the fix. To prove it, copy the changed files to the scratchpad, revert the fix, run the test, and copy the files back. Do not use `git stash` (it also takes unrelated uncommitted work) or `tar` with `C:` paths (it treats `C:` as a host).
- Scripts that start `node scripts/serve.js` in the background leave port 4173 busy; stop the process afterwards, or the next smoke run reuses a stale server.
- To inspect a running game, open `/#<scene>` with Playwright and read `window.sceneManager.instance.scene` after importing `/scenes/SceneManager.js` (see `tests/smoke/helpers.js`).
