import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Camac, collideWithWreck, Boat, SBoat, GameClock, canvas2d

before(async() => {
  createPageElements()
  ;({ default: Camac } = await import('/scenes/camac/Main.js'))
  ;({ default: collideWithWreck } = await import('/scenes/camac/wreckCollision.js'))
  ;({ default: Boat } = await import('/core/gameplay/bodies/boats/Boat.js'))
  ;({ default: SBoat } = await import('/core/gameplay/bodies/boats/SBoat.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

function createScene(t) {
  const scene = new Camac()
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
  boat.body.takeHit(100)
  play(6)
  assert.equal(scene.encounter.boat, null)
  assert.equal(scene.targets.includes(boat.body), false)
})

test('reaching the pier takes the boat out of the player hands and the troops land', t => {
  const { scene, play } = createScene(t)
  scene.player.x = scene.landing.x / scene.projection.pxPerMeter
  play(1 / 30)
  assert.equal(scene.landing.active, true)
  assert.equal(scene.controllers.includes(scene.keys), false, 'the keys no longer steer it')
  play(8)
  assert.match(scene.ui.outro, /landed on Šolta/)
  const { x, y } = scene.projection.point(scene.player)
  assert.ok(Math.abs(x - scene.landing.x) < 1, 'the boat lies at the pier')
  assert.deepEqual([scene.playerView.x, scene.playerView.y], [x, y], 'and is drawn there')
})

test('a fast boat cannot cross a sinking wreck, loses speed and glances off it', () => {
  const clock = new GameClock()
  const boat = new Boat({ x: 10, z: 30, clock })
  const wreck = new SBoat({ x: 30, z: 30, yaw: Math.PI / 2, clock })
  wreck.takeHit(100)
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
