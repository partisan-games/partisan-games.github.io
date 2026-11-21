import { test } from 'node:test'
import assert from 'node:assert/strict'
import Rifleman, { rifle, patrol, riflemanKinds } from '/core/gameplay/bodies/soldiers/Rifleman.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

/** A soldier facing left at x 50, with a plane-sized target, on his own clock, with no page. */
function soldierAlone({ canFire = () => true, kind = riflemanKinds.soldier } = {}) {
  const clock = new GameClock()
  const target = new Body({ x: 40, y: 12, size: { length: 10, height: 4, width: 12 }, states: { idle: {}, dead: {} } })
  const soldier = new Rifleman({ kind, x: 50, y: 1.28, yaw: Math.PI, clock, targets: [target], canFire, random: () => 0 })
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      clock.advance(1 / 30)
      soldier.update(1 / 30)
    }
  }
  return { soldier, target, live }
}

test('a soldier has the states idle, patrol, fire and dead, and starts at ease', () => {
  const { soldier } = soldierAlone()
  assert.deepEqual(soldier.states, ['idle', 'patrol', 'fire', 'dead', 'reload'])
  assert.equal(soldier.state, 'idle')
})

test('a soldier keeps his state: at ease he stands, on patrol he walks to and fro within reach of his post', () => {
  const { soldier, live } = soldierAlone()
  live(2)
  assert.equal(soldier.x, 50)
  soldier.setState('patrol')
  let seen = { min: 50, max: 50 }
  for (let i = 0; i < 30 * 20; i++) {
    live(1 / 30)
    seen = { min: Math.min(seen.min, soldier.x), max: Math.max(seen.max, soldier.x) }
  }
  assert.ok(seen.max - 50 <= patrol.range + 1e-9 && 50 - seen.min <= patrol.range + 1e-9)
  assert.ok(seen.max - seen.min > patrol.range, 'he walks both ways')
})

test('a soldier aims only at a point above him, raising his rifle for a steep one, and faces it', () => {
  const { soldier } = soldierAlone()
  assert.equal(soldier.aimAt({ x: 40, y: 0 }), false, 'below him')
  assert.equal(soldier.aimAt({ x: 70, y: 3 }), true)
  assert.equal(soldier.forward, 1)
  assert.equal(soldier.raised, false)
  assert.equal(soldier.aimAt({ x: 45, y: 30 }), true)
  assert.equal(soldier.forward, -1)
  assert.equal(soldier.raised, true)
  assert.ok(soldier.muzzle.y > soldier.y, 'the raised rifle fires from above his centre')
})

test('a soldier set to fire hits where he aims as often as he reloads; at ease, dead or after the result he does not', () => {
  let running = true
  const { soldier, target, live } = soldierAlone({ canFire: () => running })
  soldier.aimAt(target)
  live(1)
  assert.equal(soldier.shotsFired, 0, 'at ease')
  soldier.setState('fire')
  live(rifle.reload * 2 + 1)
  assert.equal(soldier.shotsFired, 3)
  assert.equal(target.health.current, 100 - 3 * rifle.damage, 'each bullet takes a little of the plane')
  running = false
  live(rifle.reload * 2)
  assert.equal(soldier.shotsFired, 3, 'not after the result')
  running = true
  soldier.setState('dead')
  live(rifle.reload * 2)
  assert.equal(soldier.shotsFired, 3, 'not once dead')
  assert.equal(soldier.alive, false)
})

test('one bullet fells a soldier, and each kind lists the shots he fires', () => {
  for (const kind of Object.values(riflemanKinds)) {
    const { soldier } = soldierAlone({ kind })
    soldier.takeHit(10)
    assert.equal(soldier.state, 'dead')
    for (const shot of Object.values(soldier.shots))
      assert.equal(soldierAlone({ kind }).soldier.aimAt({ x: 50 - shot.x, y: 1.28 + shot.y }), true)
  }
})
