# Testing

`npm run verify` runs every check; run it before committing. CI (`.github/workflows/ci.yml`) runs the same steps.

| Command | What it checks | Time |
|---|---|---|
| `npm run lint` | ESLint over all code and tests, including rules against browser timers in game code | seconds |
| `npm test` | unit tests in `tests/unit/` (Node, fake DOM) | seconds |
| `npm run check` | every import and literal asset path exists; every menu item has a scene | seconds |
| `npm run smoke` | every game in a real headless Chromium (`tests/smoke/`) | ~4 min |

First time only: `npx playwright install chromium`.

## Unit tests (`tests/unit/`)

- Run on `node:test` with `@happy-dom/global-registrator` as the DOM. `setup/register.js` also resolves the browser imports (`/core/...`, `three`) the way `index.html` does.
- Modules that read `#ui` or `#modal` when imported (`ui/UI.js`, `core/Scena.js`) must be imported after `helpers/dom.js` `createPageElements()`.
- `helpers/frames.js` replaces `requestAnimationFrame`, so a test steps the game loop frame by frame.
- 3D logic runs on real three.js: actors get box meshes and tiny animation clips (`actor.test.js`, `follow.test.js`). Give boxes their origin at the feet (`geometry.translate(0, height / 2, 0)`), like the character models, or ray casts pass over them.
- Integration tests drive a whole chain with real keyboard events on `document`: `player.test.js` (key → states → movement → animation), `combat.test.js` (an enemy spots, chases and kills the player), `game2d.test.js` (2D movement, screen edges, a hit and its point). `vis.test.js` plays the vis waves, paths, formations, enemy types, aimed fire and boss with a stand-in scene, and `bomb.test.js` the bomb. `shaders.test.js` checks that every shader makes a new material each time. `frameRate.test.js` plays the same seconds at 30 and at 60 frames per second and compares the result. Give `Input` `useKeyboard: true`, since it defaults to the keyboard only on devices with a mouse, and end the input in `t.after`.
- `lint.test.js` checks the custom ESLint rules in `eslint.config.mjs` with the ESLint API.
- Tests that pin down behavior before a refactor compare with a recording: `screens.test.js` with `fixtures/screens.json` (central screen HTML per style, whitespace collapsed), `styles.test.js`, `sound.test.js` (a fake `Audio` records file and volume), `keys.test.js`, `assets.test.js` (a fake `fetch` and image records the requested paths) and `timers.test.js`.
- A delayed action runs on the game clock (`core/timers.js`), which only the scene loop moves. A test that updates objects without a running scene advances it with `timers.update(dt)`; `t.mock.timers` moves only browser timers.
- Images never load in unit tests, so a `Predmet` made from an image file has no `sirina` or `visina`, and checks such as "on the ground" stay false; set the size in the test.
- Modules that load a model when imported (`core3d/actor/derived/Cannon.js`, `core3d/physics/Tank.js`, `scenes/moon-landing/Lander.js`) cannot be imported in a unit test; move the logic to test into its own module, as `ui/PowerMeter.js` was.
- A test marked `todo` documents a known issue that is not fixed yet; it runs but does not fail the suite.

## Smoke tests (`tests/smoke/`)

- `scenes.spec.js`: each game loads and survives a few seconds of random input.
- `flow.spec.js`: each game pauses and continues, ends, plays again and returns to the menu; 3D games must draw a picture.
- `navigation.spec.js`: menu, switching games, Back/Forward, unknown game, runtime error screen.
- `phone.spec.js` (project `phone`, Pixel 7 emulation): touch controls of `warplane`, `moon-landing`, `cannon`.
- `victory.spec.js`: each of the 18 games that can be won is put just before winning, and the victory must show and stay. The other 21 games have no victory: `2d-tank`, `avatar-planets`, `camac`, `capoeira-girl`, `city-colorful`, `dark-city`, `demon-forest`, `drvar`, `flying-through-space`, `graffiti-city`, `graffiti-city-maze`, `led-city`, `liberated-city`, `locomotive`, `lookat-cursor`, `minas-tirith`, `otpisani`, `physics-vehicle`, `ruins`, `spomenici`, `zeppelin`.
- `leaks.spec.js`: 20 game switches; listeners on `document` and `window`, WebGL contexts and page elements must not grow, nor the textures, buffers and shader programs left on the graphics card after a 3D game (counted in a 2D game, from the second round on, when the shared renderer has compiled its shaders).
- `styles.spec.js`: each game's start screen HTML and the classes of its health bar and camera button match `fixtures/styles.json`. After an intended change, rerun with `RECORD_STYLES=<folder>` to write one file per game, then merge them into the fixture.

A test fails on any uncaught error, console error, failed request, or more than one full screen button. Textures that models reference but the repository lacks are listed in `known-issues.js`.

Import `test` from `helpers.js`, not from Playwright: it exposes the game's `SceneManager` as `window.sceneManager`, which `waitForScene`, `startGame` and `onScene` use. `onScene(page, fn)` runs `fn(scene)` in the page; `fn` is sent as source text, so it cannot use variables from the test.

There are no screenshot or FPS tests on purpose: screenshots would catch only visual changes on rarely changed menus, yet need separate baselines for Windows and Linux and rerecording after every look change; software rendering in the test does not resemble a real browser's speed.

### Pitfalls

- 3D renders in software (SwiftShader); with four games at once one frame can take seconds. Hold a key until its effect shows instead of pressing it, and wait with generous timeouts.
- Random play can end a game (a mine, a zombie). Do not play randomly before a step that needs a running game.
- Headless Escape does not release a locked mouse; first-person games pause on that release, so the flow test calls `document.exitPointerLock()`.
- `page.waitForFunction` does not await an async predicate; keep predicates synchronous.
- Headless Chromium does not grant a pointer lock, and `fps-airport` updates only while the mouse is locked; its victory test fakes `document.pointerLockElement`.
- A touch hold needs CDP `Input.dispatchTouchEvent` (`touchStart`, wait, `touchEnd`); `tap()` is too short to charge the cannon.
