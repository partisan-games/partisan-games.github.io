import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Health from '/core/gameplay/Health.js'

let Camac, collideWithWreck, Boat, SBoat, sBoat, GameClock, canvas2d

before(async() => {
  createPageElements()
  ;({ default: Camac } = await import('/scenes/camac/Main.js'))
  ;({ default: collideWithWreck } = await import('/scenes/camac/wreckCollision.js'))
  ;({ default: Boat } = await import('/core/gameplay/bodies/boats/Boat.js'))
  ;({ default: SBoat, sBoat } = await import('/core/gameplay/bodies/boats/SBoat.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

/** The scene from its `stage`, by default the landing on Šolta, whose banks are guarded. */
function createScene(t, stage = 1) {
  const scene = new Camac({ stage })
  scene.init()
  scene.clear = () => {}
  scene.session.start()
  t.after(() => scene.end())
  const play = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      scene.session.update(1 / 30)
      scene.update(1 / 30, i / 30)
    }
  }
  return { scene, play }
}

test('the view follows the boat down the river and the shore nests stay where they were dug in', t => {
  const { scene, play } = createScene(t)
  const nests = scene.shoreDefenses.positions.map(({ body }) => ({ body, x: body.x, z: body.z }))
  assert.equal(nests.length, 2)
  for (let i = 0; i < 60; i++) {
    scene.player.throttle(1 / 30)
    play(1 / 30)
  }
  assert.ok(scene.cameraX > 0, 'the view moved on')
  for (const { body, x, z } of nests) assert.deepEqual([body.x, body.z], [x, z])
})

test('an S-boat comes after its quiet start, and its sunk wreck leaves play', t => {
  const { scene, play } = createScene(t)
  scene.shoreDefenses.positions.forEach(({ body }) => body.setState('dead'))
  play(10.2)
  const { boat } = scene.encounter
  assert.ok(boat, 'it has come')
  assert.ok(scene.targets.includes(boat.body))
  boat.body.takeHit(sBoat.health)
  play(6)
  assert.equal(scene.encounter.boat, null)
  assert.equal(scene.targets.includes(boat.body), false)
})

test('the S-boat is over four player-boat lengths, with its large hull and gun muzzles at the drawn scale', t => {
  const { scene } = createScene(t)
  scene.encounter.launch()
  const { body, view } = scene.encounter.boat
  const ratio = view.width / scene.playerView.width
  assert.ok(ratio > 4.5 && ratio < 4.7, 'the 33m S-boat must not look like the 7m launch')
  assert.equal(view.width, body.size.length * scene.projection.pxPerMeter)
  assert.equal(view.height, body.size.width * scene.projection.pxPerMeter)
  const bow = body.x - scene.player.size.length * 1.8
  assert.notEqual(body.hitTime({ x: bow, z: body.z - 10 }, { x: bow, z: body.z + 10 }), null,
    'the visible long bow is part of the target, beyond the old 11m hit box')
  const mount = body.mount(body.gunIndex), { muzzle } = body
  const barrelPixels = Math.hypot(muzzle.x - mount.x, muzzle.z - mount.z) * scene.projection.pxPerMeter
  assert.ok(Math.abs(barrelPixels - view.width * 12 / 300) < 1e-8, 'rounds leave the enlarged drawn gun')
})

test('reaching the pier takes the boat out of the player hands, the troops land, and the boat sets out for home', t => {
  const { scene, play } = createScene(t)
  const { landing } = scene
  scene.player.x = landing.x / scene.projection.pxPerMeter
  play(1 / 30)
  assert.equal(landing.active, true)
  assert.equal(scene.controllers.includes(scene.keys), false, 'the keys no longer steer it')
  for (let i = 0; i < 30 * 8 && !landing.complete; i++) {
    play(1 / 30)
    if (landing.complete) break
    const { x, y } = scene.projection.point(scene.player)
    if (landing.progress > 0) {
      assert.ok(Math.abs(x - landing.x) < 1, 'the boat lies at the pier')
      assert.deepEqual([scene.playerView.x, scene.playerView.y], [x, y], 'and is drawn there')
    }
  }
  assert.equal(landing.complete, true)
  play(2.1)
  assert.equal(scene.stage, 2, 'back across the channel')
  assert.equal(scene.controllers.includes(scene.keys), true, 'in the player hands again')
  assert.equal(scene.ui.outro, '')
})

test('the stages follow each other without a new coin, out of the harbour, to Šolta and home, where the game is won', t => {
  const { scene, play } = createScene(t, 0)
  const sail = () => {
    scene.player.x = (scene.finishX + 10) / scene.projection.pxPerMeter
    play(1 / 30)
  }
  assert.deepEqual([scene.stage, scene.landing], [0, null], 'no pier on the way out of the home harbour')
  sail()
  assert.equal(scene.stage, 0, 'the game rests a moment between stages')
  play(2.1)
  assert.equal(scene.stage, 1)
  assert.ok(scene.landing, 'the pier of Šolta is ahead')
  scene.stage = 2
  scene.startStage()
  assert.equal(scene.enlisted.length, 0, 'the enemies of the last stage are gone')
  sail()
  assert.match(scene.ui.outro, /landed on Šolta/)
})

test('a fast boat cannot cross a sinking wreck, loses speed and glances off it', () => {
  const clock = new GameClock()
  const boat = new Boat({ x: 10, z: 30, clock })
  const wreck = new SBoat({ x: 30, z: 30, yaw: Math.PI / 2, clock })
  wreck.takeHit(sBoat.health)
  const before = { x: boat.x, z: boat.z }
  boat.x = 50
  boat.vx = 100
  assert.equal(collideWithWreck(boat, wreck, before, { x: wreck.x, z: wreck.z }), true)
  assert.ok(boat.x < 30, 'stopped on its near side')
  assert.ok(boat.vx < 100 * .25)
  clock.advance(3)
  wreck.update(3)
  assert.equal(collideWithWreck(boat, wreck, before, { x: wreck.x, z: wreck.z }), false, 'once it has gone under')
})

test('enemy rounds sink the boat and the game is lost', t => {
  const { scene, play } = createScene(t)
  scene.player.takeHit(100)
  play(1 / 30)
  assert.match(scene.ui.outro, /Game over/)
  assert.ok(canvas2d.width > 0)
})

test('each stage deploys its fleet in order, and transitions remove its vessel, controller and hit record', t => {
  const { scene, play } = createScene(t, 0)
  // the passes are hurried along the clock, and the raids that come meanwhile must not sink the boat
  scene.player.health = new Health({ maximum: 10000 })
  const all = new Set()
  for (let stage = 0; stage < 3; stage++) {
    scene.stage = stage
    scene.startStage()
    const { encounter } = scene
    for (let pass = 0; pass < encounter.fleet.length; pass++) {
      scene.session.clock.advance(60)
      encounter.update()
      const enemy = encounter.boat
      assert.equal(enemy.id, encounter.fleet[pass])
      all.add(enemy.id)
      assert.ok(scene.targets.includes(enemy.body))
      assert.ok(scene.controllers.includes(enemy.raider))
      enemy.body.takeHit(enemy.body.health.maximum)
      scene.splashHits()
      play(5.2)
      encounter.update({ allowSpawn: false })
      assert.equal(encounter.boat, null)
      assert.equal(scene.targets.includes(enemy.body), false)
      assert.equal(scene.controllers.includes(enemy.raider), false)
      assert.equal(scene.hitsSeen.has(enemy.body), false)
    }
  }
  assert.deepEqual([...all].sort(), ['german-launch', 'german-patrol-vessel', 'german-skiff', 'mfp', 'rboot', 'sboat', 'vorpostenboot'])
})

test('a continuous full-throttle crossing meets every vessel type and returns home', t => {
  const { scene, play } = createScene(t, 0)
  // Isolate route and encounter timing from survival; real shots and enemies still run.
  scene.player.health = new Health({ maximum: 10000 })
  t.mock.getter(scene.input, 'up', () => true)
  t.mock.getter(scene.input, 'attack', () => true)
  const met = new Set()
  let bossOnReturn = false
  for (let i = 0; i < 30 * 160 && scene.running; i++) {
    scene.handleInput(1 / 30)
    play(1 / 30)
    if (scene.encounter.boat && scene.onScreen(scene.encounter.boat.body)) {
      met.add(scene.encounter.boat.id)
      bossOnReturn ||= scene.stage === 2 && scene.encounter.boat.id === 'sboat'
    }
  }
  assert.deepEqual([...met].sort(), ['german-launch', 'german-patrol-vessel', 'german-skiff', 'mfp', 'rboot', 'sboat', 'vorpostenboot'])
  assert.ok(bossOnReturn, 'the strongest enemy is visible on the return crossing')
  assert.equal(scene.stage, 2)
  assert.match(scene.ui.outro, /landed on Šolta/)
})
