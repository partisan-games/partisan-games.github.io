import { test } from 'node:test'
import assert from 'node:assert/strict'
import Flak, { flak, barrel } from '/core/gameplay/bodies/artillery/Flak.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'
import { turn } from '/core/gameplay/angles.js'

/** A flak at x 100 with a plane-sized target, on its own clock, with no page. */
function gunAlone({ canFire = () => true } = {}) {
  const clock = new GameClock()
  const plane = new Body({ x: 85.7, y: 17.86, size: { length: 7.14, height: 2.86, width: 8.57 }, states: { idle: {}, dead: {} } })
  const gun = new Flak({ x: 100, y: 1.49, clock, targets: [plane], canFire, random: () => 0 })
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      clock.advance(1 / 30)
      gun.update(1 / 30)
    }
  }
  return { gun, plane, live }
}

test('the flak bursts its shell where it aims, and the burst hurts a target only close by', () => {
  const { gun, plane, live } = gunAlone()
  gun.aimAt(plane)
  gun.setState('attack')
  live(4)
  assert.ok(gun.shell.bursts >= 1)
  assert.ok(Math.hypot(gun.shell.x - plane.x, gun.shell.y - plane.y) < flak.burstRadius, 'it burst at the plane')
  assert.equal(plane.health.current, 100 - flak.damage * gun.shell.bursts)
  const far = gunAlone()
  far.gun.aimAt({ x: far.plane.x, y: far.plane.y + 7.14 })
  far.gun.setState('attack')
  far.live(4)
  assert.ok(far.gun.shell.bursts >= 1)
  assert.equal(far.plane.health.current, 100, 'a burst too far off')
})

test('the flak cannot aim out of reach or below its breech, and holds fire after the result', () => {
  let running = true
  const { gun, plane, live } = gunAlone({ canFire: () => running })
  assert.equal(gun.aimAt({ x: 100 - flak.reach - 1, y: 3 }), false)
  assert.equal(gun.aimAt({ x: 92.86, y: .71 }), false)
  running = false
  gun.aimAt(plane)
  gun.setState('attack')
  live(5)
  assert.equal(gun.shotsFired, 0)
})

test('the barrel turns towards the plane at its own pace and fires only once it points there', () => {
  const { gun, live } = gunAlone()
  gun.aimAt({ x: 121.4, y: 14.29 })
  gun.setState('attack')
  live(1 / 30)
  assert.ok(Math.abs(gun.barrelAngle - (barrel.rest - barrel.rate / 30)) < 1e-9, 'one step of its turn')
  assert.equal(gun.shotsFired, 0, 'it still points away')
  live(2)
  assert.ok(Math.abs(turn(gun.barrelAngle, gun.aimAngle)) <= barrel.onTarget)
  assert.equal(gun.shotsFired, 1)
})

test('a flak at ease neither trains its barrel nor fires', () => {
  const { gun, plane, live } = gunAlone()
  gun.aimAt(plane)
  live(5)
  assert.equal(gun.barrelAngle, barrel.rest)
  assert.equal(gun.shotsFired, 0)
})
