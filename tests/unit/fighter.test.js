import { test } from 'node:test'
import assert from 'node:assert/strict'
import Fighter, { fighter } from '/core/gameplay/bodies/aircraft/Fighter.js'
import Interceptor, { interceptor } from '/core/gameplay/controllers/Interceptor.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

/** A fighter at x 100, 20 m up, facing `way`, with a plane-sized target, on its own clock, with no page. */
function fighterAlone({ way = -1, canFire = () => true, onCrash } = {}) {
  const clock = new GameClock()
  const plane = new Body({ x: 70, y: 20, size: { length: 10, height: 4, width: 12 }, states: { idle: {}, dead: {} } })
  plane.vx = 15
  plane.vy = 0
  const body = new Fighter({ x: 100, y: 20, clock, targets: [plane], canFire, onCrash })
  body.face(way)
  const live = (seconds, controller) => {
    for (let i = 0; i < seconds * 30; i++) {
      clock.advance(1 / 30)
      controller?.update()
      body.update(1 / 30)
    }
  }
  return { body, plane, live }
}

test('a fighter aims only at a point within its cone ahead of its nose', () => {
  const { body } = fighterAlone()
  assert.equal(body.aimAt({ x: 80, y: 20 + 20 * Math.tan(fighter.cone * .9) }), true, 'inside the cone')
  assert.equal(body.aimAt({ x: 80, y: 20 + 20 * Math.tan(fighter.cone * 1.5) }), false, 'outside the cone')
  assert.equal(body.aimAt({ x: 120, y: 20 }), false, 'behind it')
  body.pitch = -.3
  assert.equal(body.aimAt({ x: 80, y: 20 - 20 * Math.tan(.3) }), true, 'below its diving nose')
  assert.equal(body.aimAt({ x: 80, y: 20 }), false, 'level, above its diving nose')
})

test('set to fire, a fighter fires straight ahead with its own velocity as its guns reload, never after the result', () => {
  let running = true
  const { body, live } = fighterAlone({ canFire: () => running })
  body.steer(-fighter.speed, 0)
  live(1)
  assert.equal(body.shotsFired, 0, 'not while it only flies')
  body.setState('attack')
  live(1 / 30)
  const [round] = body.bullets.projectiles
  assert.ok(Math.abs(round.vx - (-fighter.gun.speed - fighter.speed)) < 1e-9 && round.vy === 0)
  live(fighter.gun.reload * 3 + .05)
  assert.equal(body.shotsFired, 4)
  running = false
  live(1)
  assert.equal(body.shotsFired, 4)
})

test('its bullets take only a little of the plane, and shot down it fires no more', () => {
  const { body, plane, live } = fighterAlone()
  body.setState('attack')
  live(1)
  assert.ok(plane.health.current < 100 && plane.health.current >= 100 - fighter.gun.damage * 7)
  body.takeHit(fighter.health)
  const { shotsFired } = body
  live(1)
  assert.equal(body.shotsFired, shotsFired)
})

test('a shot down fighter keeps its speed, dives ever steeper nose first, and crashes where it reaches the ground', () => {
  const crashes = []
  const { body, live } = fighterAlone({ onCrash: point => crashes.push(point) })
  body.steer(-fighter.speed, 0)
  body.setState('dead')
  live(1 / 30)
  assert.ok(body.vx < 0 && body.pitch < 0)
  const { pitch } = body
  live(.5)
  assert.ok(body.pitch < pitch, 'steeper')
  live(5)
  assert.equal(body.crashed, true)
  assert.equal(body.y, 0)
  assert.equal(crashes.length, 1)
  assert.equal(crashes[0].x, body.x)
})

test('an interceptor flies head on at the fighter speed, or from behind overtakes the plane, and passes beside it', () => {
  for (const [way, side] of [[-1, 0], [1, .9]]) {
    const { body, plane, live } = fighterAlone({ way })
    const controller = new Interceptor(body, { plane, random: () => side })
    live(3, controller)
    assert.equal(body.vx, way < 0 ? -fighter.speed : plane.vx + interceptor.overtake)
    assert.ok(Math.abs(Math.abs(body.y - plane.y) - interceptor.passOffset) < .1, 'it passes beside the plane, not into it')
  }
})

test('an interceptor passes above the plane when there is no room below it', () => {
  const { body, plane } = fighterAlone()
  plane.y = interceptor.passOffset
  assert.equal(new Interceptor(body, { plane, random: () => 0 }).passSide, 1)
})
