import { test } from 'node:test'
import assert from 'node:assert/strict'
import CoverSoldier, { coverSoldier } from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Body from '/core/gameplay/bodies/Body.js'

const run = (body, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) body.update(dt)
}

test('he runs to his cover and is safe behind it until he rises to fire', () => {
  const soldier = new CoverSoldier()
  soldier.moveTo({ x: 3, z: 4, cover: 1.2 })
  assert.equal(soldier.exposed, true, 'running in the open')
  run(soldier, 5 / coverSoldier.speed + .2)
  assert.equal(soldier.state, 'idle')
  assert.deepEqual([soldier.x, soldier.z], [3, 4])
  assert.equal(soldier.exposed, false)
  soldier.fireAt(new Body())
  assert.equal(soldier.exposed, true)
})

test('a cover lower than the crouching man does not hide him', () => {
  const soldier = new CoverSoldier()
  soldier.moveTo({ x: 1, z: 0, cover: coverSoldier.crouch - .1 })
  run(soldier, 1)
  assert.equal(soldier.inCover, true)
  assert.equal(soldier.exposed, true)
})

test('he aims before he fires, so the other side can shoot first, then hurts his target each second', () => {
  const soldier = new CoverSoldier(), target = new Body({ health: 100 })
  soldier.fireAt(target)
  run(soldier, trench.aimTime - .1)
  assert.equal(target.health.current, 100)
  run(soldier, 1.1)
  assert.equal(soldier.state, 'attack')
  assert.ok(Math.abs(target.health.current - (100 - trench.damage)) < 1, `${target.health.current}`)
  soldier.ceaseFire()
  assert.equal(soldier.state, 'idle')
})

test('the farther his target, the less his burst hurts it, down to a quarter far off', () => {
  const harm = x => {
    const soldier = new CoverSoldier(), target = new Body({ x, health: 100 })
    soldier.fireAt(target)
    run(soldier, trench.aimTime + 1)
    return 100 - target.health.current
  }
  const near = harm(coverSoldier.falloff.near), far = harm(coverSoldier.falloff.far), beyond = harm(300)
  assert.ok(Math.abs(far / near - coverSoldier.falloff.least) < .01, `${near} ${far}`)
  assert.ok(Math.abs(beyond - far) < 1e-9)
  assert.ok(harm(70) < near && harm(70) > far)
})

test('he stops firing at a dead target, and a dead soldier fires at no one', () => {
  const soldier = new CoverSoldier(), target = new Body({ health: 1 })
  soldier.fireAt(target)
  run(soldier, trench.aimTime + .5)
  assert.equal(target.dead, true)
  assert.equal(soldier.state, 'idle')
  soldier.takeHit(soldier.health.maximum)
  soldier.fireAt(new Body())
  assert.equal(soldier.state, 'dead')
})
