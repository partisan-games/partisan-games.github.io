import { test } from 'node:test'
import assert from 'node:assert/strict'
import Bombardier, { dropLead } from '/core/gameplay/controllers/Bombardier.js'

/** A bomber that records its state and the points it sights; `ahead` is whether it can dive on them. */
function fakeBomber({ ahead = true } = {}) {
  const bomber = {
    alive: true, state: 'idle', aimed: [],
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

const sees = target => target.shown

test('a bombardier dives on a living target it sees and can dive on', () => {
  const bomber = fakeBomber()
  const target = { x: 0, y: 0, alive: true, shown: true }
  new Bombardier(bomber, target, { sees }).update()
  assert.equal(bomber.state, 'attack')
  assert.deepEqual(bomber.aimed, [target])
})

test('a bombardier dives where its aim gives, such as ahead of a moving target', () => {
  const bomber = fakeBomber()
  const ahead = { x: 9, y: 0 }
  new Bombardier(bomber, { x: 0, y: 0, alive: true, shown: true }, { sees, aim: () => ahead }).update()
  assert.deepEqual(bomber.aimed, [ahead])
})

test('a bombardier flies on past a target behind, dead or out of sight', () => {
  for (const [name, bomber, target] of [
    ['behind', fakeBomber({ ahead: false }), { alive: true, shown: true }],
    ['dead', fakeBomber(), { alive: false, shown: true }],
    ['out of sight', fakeBomber(), { alive: true, shown: false }],
  ]) {
    bomber.state = 'attack'
    new Bombardier(bomber, target, { sees }).update()
    assert.equal(bomber.state, 'idle', name)
  }
})

test('a bomb let go level is aimed as far ahead of a moving target as it goes while the bomb falls', () => {
  // from 20 m at 10 m/s² the bomb falls 2 seconds, in which the target drives 16 m
  assert.deepEqual(dropLead(10)({ x: 5, y: 0, vx: 8 }, { y: 20 }), { x: 21, y: 0 })
})
