# Testing

Architecture and ownership: [ARHITEKTURA](ARHITEKTURA.md). Check execution requires the project owner's permission; a prepared test or an earlier passing run does not establish that the current working copy passes.

`npm run verify` runs lint, unit tests and the project check; run it before committing. The browser leak check is separate (`npm run smoke`, first `npx playwright install chromium`); CI (`.github/workflows/ci.yml`) runs both.

| Command | What it checks | Time |
|---|---|---|
| `npm run lint` | ESLint over all code and tests, including rules against browser timers and wall-clock time in game code and against imports that leave `core/gameplay/` and `core/runtime/` | seconds |
| `npm test` | unit tests in `tests/unit/` (Node, fake DOM) | seconds |
| `npm run check` | every import and literal asset path exists; every menu item has a scene | seconds |
| `npm run smoke` | game-switch leak check in a real headless Chromium (`tests/smoke/`) | ~20 s |

First time only: `npx playwright install chromium`.

## UI verification limits

The [key-description tests](../tests/unit/keys.test.js) preserve the current text, not its completeness. DOM tests do not establish native keyboard activation, focus, pointer lock, physical touch or rendered geometry.

On 2026-11-20, after the token flow (charge on Start or a choice, Play again with the same choice, refund) and the theme picker, the owner-authorized full unit suite and `npx eslint .` (0 errors) passed. The full `npm run smoke -- --workers=1` then failed only in arcade, flow and loading, whose cases still expected payment on the card; after updating them to the new flow, those 48 cases passed. The later focus outline, price tag without a count and replay-icon alignment were checked only by the owner in the browser. Later the same day, after the compact pocket, wrapping touch buttons and windows that fit the phone (checked on sample screenshots at 320×568, 390×844 and 844×390), the 798 unit tests and lint passed, and the browser specs then in place passed after their expectations were updated to the intended changes; the remaining specs were then removed.

An earlier one-Chromium probe (Bunker, FPS Base, Warplane at 1280×800, normal audio policy) confirmed native Tab/Enter/Space/Volume arrows in pause and Settings, real pointer lock, AudioContext start after trusted input and clean disposal on navigation. Headless Escape does not release pointer lock, so a Playwright probe calls `document.exitPointerLock()`; this does not prove physical Escape in a visible browser. For visibility assertions, check the visible screen or control: a zero-sized wrapper can contain visible fixed-position children.

When changing the [payment indicator](UI.md#potvrđena-oznaka-naplate), inspect the rendered button at actual size with the longest label in every theme, in enabled, disabled and enabled-again states and with reduced motion; confirm motion or stillness from rendered frames, not the filename.

No screenshots per theme and screen size: the owner checks the look by playing (2026-11-20). Still unrun: every custom start choice with its failure/refund path, and real touch (concurrent presses, cancel, blur).

## Franjo Kluz sprite integration verification limits

The FK-13 sprite integration on 2026-11-20 received an independent source review with no remaining confirmed actionable defects. The review traced the shared Sprite/World/Renderer2D contracts, local atlas drawing, original collider dimensions, image-loading order, one-shot firing/falling, vehicle fire, muzzle effects and camera-relative visibility of gun barrels and propellers. JavaScript parser checks and structural asset preparation passed; these do not establish gameplay or visual acceptance.

FK-13 request 2 added `rest`, `walk` and `fireUp` art to both soldiers without changing gameplay code. Running [prepare.py](../assets/images/armies/sources/franjo-kluz/prepare.py) regenerated the atlases, metadata, runtime data, GIFs and preview HTML. Pixel hashes verified that the first three rows remain identical, and file hashes verified that the other atlases remain unchanged. Checks covered the unchanged frame size, anchor and facing; four distinct frames per new clip; transparent frame edges; the common foot baseline; the specified durations and GIF loop modes; and `muzzle` on the first aiming frame. New poses and the marked muzzle were visually inspected as local images; generated runtime data passed a JavaScript syntax check. This is asset verification, without an in-game or browser run; patrol, alert transitions, aiming holds and projectile origins still require Claude's integration and its checks.

The [art integration tests](../tests/unit/franjoKluzArt.test.js) and [Kluz tests](../tests/unit/franjoKluz.test.js) passed in the full unit suite of 2026-11-20 (see [UI verification limits](#ui-verification-limits)). The art has not been reviewed in the running game.

## Ustanak verification limits

The owner closed the Ustanak work on 2026-11-17. Final source and prepared tests received an independent source review without confirmed actionable findings; unit tests, lint, project checks and browser execution were not run for the final working copy, by the owner's decision. Acceptance does not establish a passing runtime or an auditioned final sound mix.

[Terrain tests](../tests/unit/ustanakTerrain.test.js) include all four independent wind/destruction combinations and round reset. [Managed sound tests](../tests/unit/managedSound.test.js) cover ownership and playback lifecycle. Ustanak browser cases stage the last hit of each round for 1P victory/defeat and 2P victory, pause during delayed damage, replay and old-scene sound shutdown; they do not replace a naturally played full match or listening review. They passed in the full smoke run of 2026-11-20 described under [UI verification limits](#ui-verification-limits).

## Recording analysis · ZV-06

The owner explicitly authorized recording analysis on 2026-11-19, separately from game/tests/browser execution. [Measured results and source hashes](references/audio/zv06-2026-11-19.json) cover 33 existing files and 13 unselected review candidates: sequential ffprobe metadata and ffmpeg decoding with `astats`, `silencedetect=noise=-50dB:d=0.05` and `ebur128=peak=true`. The process tree used one allowed logical CPU at BelowNormal priority, with single-thread decoding/filtering. All 46 files decoded successfully in 26.422 seconds for the analysis loop; this excludes setup/report review, does not measure game performance, and does not establish a peak RAM figure. No audio was played and no recording or gain setting was changed.

Decoded floating-point sample peaks and estimated intersample peaks exceed 0 dBFS in several sources; this indicates needed headroom, not proof of clipping at the game's final output. For example, `rifle.mp3` measures +5.1 dBTP, while `cannon-load.mp3` measures +1.3 dBTP. The two burst files differ by 6 LU (`rafal.mp3` −3.6 LUFS, `rifle-burst.mp3` −9.6 LUFS), so a category-wide gain cannot compensate for their recording levels. Gated integrated loudness is diagnostic here; short effects, speech and continuous ambience must not all be normalized to one target.

Before preparation, the existing aircraft file had about 92 ms leading and 51 ms trailing silence at the stated threshold; the steady-engine candidate had about 61/367 ms. The load effect had about 1.106 seconds of trailing silence. Rain and the marine/diesel candidates had relatively large decoded endpoint jumps. These findings informed the trims and cyclic crossfades recorded in [PROCESSING.json](../assets/sounds/PROCESSING.json). Silence detection cannot distinguish intended pauses from excess padding; endpoint differences alone neither prove an audible click nor guarantee a seamless browser loop.

The separately authorized [post-encoding analysis](references/audio/zv06-prepared-2026-11-19.json) covers the installed 57 MP3 files and their hashes. All decoded successfully; none exceeded 0 dBTP. The sequential analysis loop took 6.715 seconds with the same one-logical-CPU, BelowNormal, single-thread limits. Very short effects have `integrated_lufs: null` where the meter could not establish valid gated loudness; RMS/peak values remain available. This measures recordings, not the mixed browser output, CPU cost in-game or peak RAM. No audio was played.

## Global audio migration verification limits

Unit tests, lint and the project check pass for the migrated audio system, and the owner checked the sound in the browser (2026-11-20). Browser smoke, native decoding, phase cancellation, MP3 loop joins, mixed peaks, actual Ammo contacts, DSP cost, p95 frame time and audio RAM remain unverified.

### Owner listening reports · 2026-11-19, resolved 2026-11-20

Ustanak aircraft and fire, the Vis player engine, all of Landing on Šolta and the Wounded Escape patrol could not be heard. Playback worked, but these sources reached the speaker at −49 to −70 dBFS, under shots at −33 to −38: group and mix headroom gains stacked on the old source volumes, prepared recordings were quieter (`avion-mali.mp3` by 6.8 dB), and 100 px per acoustic unit attenuated across the screen; patrol speech beyond 1200 px was rejected outright. The fix is the on-screen rule in [ARHITEKTURA](ARHITEKTURA.md): a real-loudness floor of −45 dBFS and every 2D source on screen kept above it. The owner confirmed the result by listening ("mnogo je bolje"); the boat engine and wake were then tuned by ear.

**Lasting verification lesson:** successful decoding, acceptable file peaks, connected source code and prepared tests do not prove in-game audibility. After permission, first confirm that an intended source is actually heard in its game, then evaluate distance, stereo direction, loop continuity and performance. Repeated silence across games is a reason to inspect the common playback path as a hypothesis, not evidence of a particular root cause.

Low-end acceptance still requires comparing identical scenes with and without sound on an identified slow device: a scene maintaining 30 FPS without audio should retain that level with audio and no audible dropouts. The initial p95 target for synchronous JS audio updates is at most 1 ms; neither target has been demonstrated, and JS timing does not measure native DSP or audio memory. CPU emulation must be labelled as such. Optimization remains mandatory before measurements; measurements tune and verify it.

[Managed-source integration cases](../tests/unit/managedSound.test.js) prepare first pooled shots, muzzle snapshots, loop pause/resume, offscreen engines, player-turn switching, moving speech, ready/result phases and failed-loop retry without per-frame allocations or requests. [Consumer cases](../tests/unit/sound.test.js) prepare player-owned aiming, independent bursts, 3D world transforms and model axes, contacts/impacts, weather, scene cleanup and a future object using the same contract. [Contact cases](../tests/unit/contactEvents.test.js) exercise first-contact dispatch and idle/removal cleanup with a fake manifold; real Ammo remains a browser check.

After permission, run the targeted audio/scene tests and changed-file lint/import checks first. Then use one browser sequentially: Ustanak 1P/2P and replay; offscreen aircraft and scrolling 2D worlds; moving patrol speech; parented 3D player/FPS and vehicle orientation; tank muzzle/contact, Lander thrust/landing, Warplane missile/crash; pause, tab return and scene replacement. Listen to near/middle/far and crossing sources on headphones, stereo and mono. Finally compare the same workload with/without audio on an identified slow device using the fixture below; do not infer performance from voice caps alone.

## Ustanak terrain checks · 2026-11-20

Unit tests (563), lint and `npm run check` pass. [Terrain cases](../tests/unit/ustanakTerrain.test.js) cover the crater shape, deepening to the bottom, a shell landing in a crater and on its far wall, units falling with gravity (cannon collider included), a new round, and the drawn layer cutting the same floors as the height map. One headless Chrome took a screenshot of each round with craters cut by `Terrain.blast` in the running game, including one under the enemy cannon. The agent did not play a match; the owner played one and accepted the terrain (2026-11-20).

## Franjo Kluz checks · 2026-11-20

On the Franjo Kluz working copy (missions, enemies, fighters, NDH disguise, siren): unit tests (607), `npm run check` and ESLint without `--fix` (0 errors; 41 warnings, none in Franjo Kluz files) pass. `npm run smoke -- --workers=1` ran once in one Chrome: 167 of 171 pass, including the Franjo Kluz victory and the deleted core `PlayerPlane`. The 4 failures are all in Ustanak browser cases, whose files this work did not change: the 2P match sees one battlefield background instead of three, and the round-ending cases read `.every` of an undefined scene value. In the later full run of the same day these cases passed. No browser playthrough or listening was done by the agent; the owner's checklist is in the plan.

## Unit tests (`tests/unit/`)

- [Audio engine tests](../tests/unit/audioEngine.test.js) use injected fake context, network and media factories to cover lazy activation and retry, shared decoding, request cancellation across owners, late completion, load recovery, pause cursors, streamed music routing/resource recovery and extensible source descriptors. They also cover SceneAudio opt-in without multiplying the main volume twice; [scene tests](../tests/unit/Scene.test.js) distinguish automatic startup and synthetic clicks from trusted input. These tests were prepared for ZV-02 and have not been run; real autoplay, decoding and playback remain unverified.

- [Spatial audio tests](../tests/unit/spatialAudio.test.js) prepare numerical cases for matching 2D/3D acoustic distances, attenuation boundaries, nearest area points, player orientation, scrolling worlds, frozen emission points and exact listener coordinates at 30/60/144 Hz. The audio-engine tests additionally prepare shared-frame and pause/resume transition cases; scene tests cover discarded fixed-step time. These additions have not been run. They inspect calculated state, not audible gain/pan/filter output; migrated consumers still require runtime verification.

- ZV-04 cases in the [audio-engine tests](../tests/unit/audioEngine.test.js) prepare overlapping event voices, frozen shot origins after owner recycling/removal, owner-loop phase and removal, scene-owned tail pause/resume, rapid pause/resume rejection ordering, natural cleanup, loading deadlines and isolation between old/new scenes. Locked or still-loading events must not replay as a burst on resume. These additions have not been run; no audible mix or browser timing behavior is confirmed.

- [Profile and Doppler tests](../tests/unit/audioProfiles.test.js) prepare near/middle/far numerical examples for each spatial profile, monotone attenuation/filtering, approach/recession, shared translation, constant-distance movement, teleport/turn/pause resets, pitch bounds and independent audio randomness. ZV-05 audio-engine cases prepare native graph routing, first-sample attenuation, group/source/trim/master factors, cursor preservation under changed rates, streamed pitch behavior and partial-graph recovery. These tests have not been run. The recording backend does not render sound or prove browser automation, compressor peaks or perceptual quality.

- Low-end performance is a required audio design goal. ZV-13 adds application-wide and per-profile admission caps, critical reservations, virtual loops, shared ambient ownership and deferred distant-ambient automation. Prepared audio-engine cases cover a 1,000-event burst across sessions, fade occupancy, loop competition, pause/rate-adjusted virtual phase, initial off-range loops, metadata cancellation, streamed reconnection, shared-area lifetime, urgent listener changes and repeated-session cleanup. These additions have not been run; source/node counters do not prove runtime performance or audio memory in bytes.

- The [isolated audio workload](../tests/fixtures/audioWorkload.js) is a manual browser fixture with no UI, automatic animation loop or playback on import. After permission, use it while no game is active, start it directly from a real gesture, and feed `step(dt, frameMs)` from a controlled frame loop. It drives 100 moving loop sources and bursts of 200 shots, supports a `withAudio: false` comparison, pause/resume and explicit disposal, and reports p95 synchronous update/frame time, peak native/reserved voices and retained clip count. Record the device, cold/warm cache, browser and CPU conditions; the JS interval omits async work outside that interval, so inspect full frame timings too. Separately measure native DSP stability and actual audio memory; retained clip count is not a byte measurement. Confirm cleanup after disposal and repeated runs. CPU throttling is a limited substitute for identified slow hardware. The fixture has not been executed, and no FPS or 1 ms target has been established as passing.

  After permission, the listening scenario reuses the same accepted recording at `nearDistance`, midway to `fadeStart`, midway between `fadeStart` and `maxDistance`, then at the silent `maxDistance` boundary for each spatial profile, with a declared player/world scale. Listen from both sides, then approach, pass and recede with engine/flight; compare speech/music with unchanged pitch. Include a listener switch, source teleport, pause/resume and simultaneous impacts. No new production asset or UI is required by this scenario; the fixture values above are preparation, not a listening result.

- Run on `node:test` with `@happy-dom/global-registrator` as the DOM. `setup/register.js` also resolves the browser imports (`/core/...`, `three`) the way `index.html` does.
- Modules that read `#ui` or `#modal` when imported (`ui/UI.js`, `core/Scene.js`) must be imported after `helpers/dom.js` `createPageElements()`.
- `helpers/frames.js` replaces `requestAnimationFrame`, so a test steps the game loop frame by frame.
- 3D logic runs on real three.js: actors get box meshes and tiny animation clips (`actor.test.js`, `follow.test.js`). Give boxes their origin at the feet (`geometry.translate(0, height / 2, 0)`), like the character models, or ray casts pass over them.
- Integration tests drive a whole chain with real keyboard events on `document`: `player.test.js` (key → states → movement → animation), `combat.test.js` (an enemy spots, chases and kills the player), `game2d.test.js` (2D movement, screen edges, a hit and its point). `vis.test.js` plays the vis waves, paths, formations, enemy types, aimed fire and boss with a stand-in scene, `bomb.test.js` the bomb, and `visPlayer.test.js` the vis player's loop, the safe time after it comes back, its fire levels and the power-ups. `shaders.test.js` checks that every shader makes a new material each time. `frameRate.test.js` plays the same seconds at 30 and at 60 frames per second and compares the result. Give `Input` `useKeyboard: true`, since it defaults to the keyboard only on devices with a mouse, and end the input in `t.after`.
- `lint.test.js` checks the custom ESLint rules in `eslint.config.mjs` with the ESLint API.
- Tests that pin down behavior before a refactor compare with a recording: `sound.test.js` (injected audio context/network/media record shared-system behavior), `assets.test.js` (a fake `fetch` and image records the requested paths) and `timers.test.js` (delays of game objects on their game clocks).
- A delayed action runs on a game clock. In a game it is the scene's session: a test without a running scene makes a `GameSession`, calls `start()` (the clock moves only while it runs) and advances it with `session.update(dt)`; objects take it as `session` or its `clock`. A 3D actor has its own `clock`, moved by its `update(dt)`; a test can also call `actor.clock.advance(dt)`. `t.mock.timers` moves only browser timers.
- A building block has its own test with fake dependencies instead of a scene (e.g. `rifleman.test.js`, `vehicle.test.js`, `fighter.test.js`, `tank.test.js`); a game test checks only how the game composes blocks and its own rules ([architecture](ARHITEKTURA.md#gradivni-blokovi)). `storybookCatalog.test.js` builds every storybook story, plays each of its states and checks that every listed shot fires.
- Pure gameplay and runtime modules (`core/gameplay/`, `core/runtime/`) are tested without any DOM setup: `Health.test.js`, `weapon.test.js` and `session.test.js`. `tenkici.test.js` plays the tanks' fire, recoil, health and result; `Scene.test.js` also checks that a game ended late leaves the next game its screen, results and canvas; `models.test.js` checks the model cache, and statically that every scene which imports a model module awaits its `models` with `requestModels`, since a scene that forgets it fails only in the browser, and that no module loads a model when imported.
- Images never load in unit tests, so a `GameObject2D` made from an image file has no `width` or `height`, and checks such as "on the ground" stay false; set the size in the test.
- A model module only describes its model, so it can be imported in a unit test; creating its object before the model has loaded throws. Physics modules need Ammo, which does not load in unit tests; move the logic to test into its own module, as `ui/PowerMeter.js` was. `scenes/moon-landing/Lander.js` also takes a `mesh`, so `lander.test.js` gives it a box.
- A test marked `todo` documents a known issue that is not fixed yet; it runs but does not fail the suite.
- A browser timer left by a test keeps Node alive, and `npm test` then hangs with no output at all. `scenes/main.js` builds the `Arcade`, whose timer waits for midnight; a test that imports it calls `arcade.dispose()` in `after`. To find a hanging file, run each file alone under `timeout`.
- happy-dom never finishes a Web Animation, so `await animation.finished` waits forever; `router.test.js` replaces `arcade.insertCoin`, which waits for the coin animation.
- `DailyCoins.test.js` checks the ordinary daily wallet; `DevelopmentCoins.test.js` checks the local 1000-coin allowance with the same persistence, spending, refund, exhaustion and daily-reset behavior. The new local-mode tests are prepared and await permission to run.

## Smoke test (`tests/smoke/`)

Only [leaks.spec.js](../tests/smoke/leaks.spec.js) remains (owner's decision, 2026-11-20): 20 switches between nine 2D and 3D games; listeners on `document` and `window`, WebGL contexts and page elements must not grow, nor the textures, buffers and shader programs left on the graphics card after a 3D game. It also fails on any uncaught error, console error or failed request; textures that models reference but the repository lacks are listed in `known-issues.js`. The other browser checks (start, flow, victory, phone, styles, tokens) were removed: they mostly failed on intended changes, and the owner checks the games by playing. Starting and playing a game is therefore no longer checked automatically.

Import `test` from `helpers.js`, not from Playwright: it exposes the game's `SceneManager` as `window.sceneManager`, which `waitForScene` uses.

### Pitfalls

- A local passing run does not prove that GitHub CI passed.
- In `bunker` and `ustanak`, keep `super.update(dt, t)` before the result guard: returning before it freezes fire particles and the flag after victory.
- 3D renders in software (SwiftShader); with four games at once one frame can take seconds. Hold a key until its effect shows instead of pressing it, and wait with generous timeouts.
- Headless Escape does not release a locked mouse; first-person games pause on that release, so a Playwright probe calls `document.exitPointerLock()`.
- `page.waitForFunction` does not await an async predicate; keep predicates synchronous.
- A touch hold needs CDP `Input.dispatchTouchEvent` (`touchStart`, wait, `touchEnd`); `tap()` is too short to charge the cannon.
