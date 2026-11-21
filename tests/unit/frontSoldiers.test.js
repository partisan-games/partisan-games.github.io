import { test } from 'node:test'
import assert from 'node:assert/strict'
import TrenchSoldier, { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Occupier, { occupier } from '/core/gameplay/bodies/soldiers/Occupier.js'

const live = (body, seconds) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) body.update(1 / 30)
}

test('a trench soldier hides until set to rise, aims for his while, then fires until he is hit', () => {
  const soldier = new TrenchSoldier()
  assert.deepEqual(soldier.states, ['hidden', 'aim', 'fire', 'fall'])
  live(soldier, 5)
  assert.equal(soldier.state, 'hidden')
  assert.equal(soldier.standing, false, 'hidden, he cannot be hit')
  soldier.setState('aim')
  assert.equal(soldier.standing, true)
  live(soldier, trench.aimTime - .1)
  assert.equal(soldier.state, 'aim')
  live(soldier, .2)
  assert.equal(soldier.state, 'fire')
  live(soldier, 5)
  assert.equal(soldier.state, 'fire', 'he keeps firing')
})

test('a hit trench soldier falls back into his trench and hides again, out of reach while falling', () => {
  const soldier = new TrenchSoldier()
  soldier.setState('fall')
  assert.equal(soldier.standing, false)
  live(soldier, trench.fallTime + .1)
  assert.equal(soldier.state, 'hidden')
})

test('an occupier walks the way he faces, stands to fire, and stays where he falls', () => {
  const right = new Occupier({ x: 0 }), left = new Occupier({ x: 50, yaw: Math.PI })
  assert.deepEqual(right.states, ['walk', 'fire', 'dead'])
  live(right, 1); live(left, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9)
  assert.ok(Math.abs(left.x - (50 - occupier.speed)) < 1e-9)
  right.setState('fire')
  live(right, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9, 'he stands while firing')
  right.setState('dead')
  assert.equal(right.alive, false)
  live(right, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9)
})
