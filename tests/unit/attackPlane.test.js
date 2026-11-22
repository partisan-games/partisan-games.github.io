import { test } from 'node:test'
import assert from 'node:assert/strict'
import AttackPlane, { attackPlane, attackPlaneKinds } from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

/** An enemy plane seen from above at x 50, z 20, with a target below it, on its own clock. */
function planeAlone(kind = attackPlaneKinds.fighter, { canFire = () => true, damage } = {}) {
  const clock = new GameClock()
  const target = new Body({ x: 50, z: 60, size: { length: 15, height: 2, width: 12 }, states: { idle: {}, dead: {} } })
  const body = new AttackPlane({ kind, x: 50, z: 20, clock, targets: [target], canFire, damage, random: () => 0 })
  const live = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      clock.advance(1 / 60)
      body.update(1 / 60)
    }
  }
  return { body, target, clock, live }
}

test('it flies where it is put and holds fire until it is set to fire, then fires where it aims', () => {
  const { body, target, live } = planeAlone()
  body.aimAt(target)
  live(1)
  assert.equal(body.shotsFired, 0)
  body.setState('fire')
  live(1 / 60)
  assert.equal(body.shotsFired, 1)
  const [round] = body.bullets.projectiles
  assert.ok(round.vz > 0 && Math.abs(round.vx) < 1e-9, 'down at the target')
  assert.ok(Math.abs(Math.hypot(round.vx, round.vz) - attackPlane.bulletSpeed) < 1e-9)
  live(.5)
  assert.equal(body.shotsFired, 1, 'not again before its reload')
  live(2)
  assert.equal(target.hitsTaken, 1)
})

test('a game sets how much each of its bullets takes, one by default', () => {
  for (const damage of [undefined, 4]) {
    const { body, target, live } = planeAlone(attackPlaneKinds.fighter, { damage })
    body.aimAt(target)
    body.setState('fire')
    live(1)
    assert.equal(target.health.current, target.health.maximum - (damage ?? 1))
  }
})

test('it fires only while it may, and a shot down plane not at all', () => {
  let may = false
  const { body, target, live } = planeAlone(attackPlaneKinds.fighter, { canFire: () => may })
  assert.equal(body.aimAt(target), false)
  body.setState('fire')
  live(1)
  assert.equal(body.shotsFired, 0)
  may = true
  body.setState('dead')
  live(1)
  assert.equal(body.shotsFired, 0)
})

test('a heavy plane takes five hits and burns after half of them; a fighter falls to one', () => {
  const heavy = planeAlone(attackPlaneKinds.heavy).body
  heavy.takeHit(2)
  assert.equal(heavy.burning, false)
  heavy.takeHit(1)
  assert.equal(heavy.burning, true)
  heavy.takeHit(2)
  assert.equal(heavy.dead, true)
  const fighter = planeAlone().body
  fighter.takeHit(1)
  assert.equal(fighter.dead, true)
})

test('shot down, it flies on straight ahead at its speed', () => {
  const { body, live } = planeAlone()
  body.face(0)
  body.setState('dead')
  live(1)
  assert.ok(Math.abs(body.x - (50 + attackPlaneKinds.fighter.speed)) < 1e-6)
  assert.equal(body.z, 20)
})

test('the boss keeps its nose down and fires every barrel from its nose and its wings in turn', () => {
  const { body, target } = planeAlone(attackPlaneKinds.boss)
  body.face(0)
  assert.equal(body.yaw, -Math.PI / 2)
  const guns = [0, 1, 2].map(() => body.nextGun().x - body.x)
  attackPlaneKinds.boss.guns.forEach((share, i) => assert.ok(Math.abs(guns[i] - share * body.size.length) < 1e-9))
  body.aimAt(target)
  body.shoot()
  assert.equal(body.bullets.projectiles.length, attackPlaneKinds.boss.fire.spread.length)
})
