import { test } from 'node:test'
import assert from 'node:assert/strict'
import Bombardier from '/core/gameplay/controllers/Bombardier.js'

/** A bomber that records its state and the points it sights; `ahead` is whether it can bomb them. */
function fakeBomber({ ahead = true } = {}) {
  const bomber = {
    alive: true, state: 'fly', aimed: [],
    aimAt(point) {
      bomber.aimed.push(point)
      return ahead
    },
    setState(name) {
      bomber.state = name
    },
  }
  return bomber
}

test('a bombardier sights a living target in sight and sets the bomber to fire', () => {
  const bomber = fakeBomber()
  const target = { x: 0, y: 0, alive: true, shown: true }
  new Bombardier(bomber, target).update()
  assert.equal(bomber.state, 'fire')
  assert.deepEqual(bomber.aimed, [target])
})

test('a bombardier flies on past a target behind, dead or out of sight', () => {
  for (const [name, bomber, target] of [
    ['behind', fakeBomber({ ahead: false }), { alive: true, shown: true }],
    ['dead', fakeBomber(), { alive: false, shown: true }],
    ['out of sight', fakeBomber(), { alive: true, shown: false }],
  ]) {
    bomber.state = 'fire'
    new Bombardier(bomber, target).update()
    assert.equal(bomber.state, 'fly', name)
  }
})
