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

for (const [cover, kind] of [[{ cover: coverSoldier.crouch - .1 }, 'lower than the crouching man'], [{ cover: 1.2, overlooked: true }, 'the enemy looks over']])
  test(`a cover ${kind} does not hide him`, () => {
    const soldier = new CoverSoldier()
    soldier.moveTo({ x: 1, z: 0, ...cover })
    run(soldier, 1)
    assert.equal(soldier.inCover, true)
    assert.equal(soldier.exposed, true)
  })

test('he runs by the points of his route before he goes into cover at his goal', () => {
  const soldier = new CoverSoldier()
  soldier.moveTo({ x: 4, z: 4, cover: 1.2 }, [{ x: 4, z: 0 }])
  let offRoute = 0
  for (let t = 0; t < 8 / coverSoldier.speed + .2; t += 1 / 30) {
    soldier.update(1 / 30)
    // the first leg runs along z = 0, the second along x = 4
    offRoute = Math.max(offRoute, Math.min(Math.abs(soldier.z), Math.abs(soldier.x - 4)))
  }
  assert.ok(offRoute < 1e-9, `${offRoute} m off his route`)
  assert.deepEqual([soldier.x, soldier.z], [4, 4])
  assert.equal(soldier.inCover, true)
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

test('a soldier set to move leaves his cover at once, however he is sent on', () => {
  const soldier = new CoverSoldier()
  soldier.moveTo({ x: 1, z: 0, cover: 1.2 })
  for (let i = 0; i < 30 && soldier.state === 'move'; i++) soldier.update(.1)
  assert.equal(soldier.inCover, true)
  soldier.goal = { x: 0, z: 0 }
  soldier.setState('move')
  assert.equal(soldier.inCover, false)
})
