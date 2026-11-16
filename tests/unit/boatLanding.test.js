import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Landing
before(async() => {
  createPageElements()
  Landing = (await import('/scenes/camac/Landing.js')).default
})

function setup() {
  const session = { state: 'running', clock: { now: 0 } }
  const player = { startX: 200, x: 200, y: 200, height: 76, angle: 0, speed: 200,
    dead: false, stop() {
      this.speed = 0
    } }
  const landing = new Landing({ coast: { edgeAt: () => 30 }, session, player, viewLeft: () => 0 })
  return { session, player, landing }
}

test('reaching the pier takes control and stops even a moving boat', () => {
  const { session, player, landing } = setup()
  player.x = landing.x - 40
  player.y = landing.pierY + player.height / 2 + 8
  landing.update()
  assert.equal(landing.active, true)
  assert.equal(player.controlsLocked, true)
  assert.equal(player.speed, 0)
  session.clock.now = .4
  landing.update()
  assert.ok(player.x > landing.x - 40 && player.x < landing.x)
  session.clock.now = .8
  landing.update()
  assert.equal(player.x, landing.x)
  assert.equal(landing.progress, 0)
  session.clock.now = 2.6
  landing.update()
  assert.ok(Math.abs(landing.progress - .5) < 1e-8)
  assert.equal(player.x, landing.x)
  session.state = 'paused'
  const { progress } = landing
  session.clock.now = 5
  landing.update()
  assert.equal(landing.progress, progress)
  session.state = 'running'
  landing.update()
  assert.equal(landing.complete, true)
})

test('the end cannot be missed vertically or skipped by a fast frame', () => {
  for (const y of [75, 300, 700]) {
    const { player, landing } = setup()
    player.x = landing.x + 250
    player.y = y
    player.angle = Math.PI / 2
    landing.update()
    assert.equal(landing.active, true)
    assert.equal(player.controlsLocked, true)
    assert.equal(player.speed, 0)
  }
})

test('the ending waits for the route end and cannot start for a dead boat', () => {
  const { player, landing } = setup()
  landing.update()
  assert.equal(landing.active, false)
  player.x = landing.x + 250
  player.dead = true
  landing.update()
  assert.equal(landing.active, false)
  assert.equal(setup().landing.active, false)
})
