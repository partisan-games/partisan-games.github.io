import { test } from 'node:test'
import assert from 'node:assert/strict'
import Gunner from '/core/gameplay/Gunner.js'

/** A body that only records the state it is set to and the points it is asked to aim at. */
function fakeBody({ reach = 100, aimable = true, alive = true } = {}) {
  const body = {
    x: 0, y: 0, reach, alive, aimable, state: 'idle', aimed: [],
    aimAt(point) {
      body.aimed.push(point)
      return body.aimable
    },
    setState(name) {
      body.state = name
    },
  }
  return body
}

const target = (x, y, alive = true) => ({ x, y, alive })

test('a gunner sets the body to fire while the target lives, is in reach and can be aimed at', () => {
  const body = fakeBody()
  const aim = target(60, 80)
  new Gunner(body, aim).update()
  assert.equal(body.state, 'fire')
  assert.deepEqual(body.aimed, [aim], 'the body aims at the target')
})

test('a gunner holds fire when the target is out of reach, cannot be aimed at, or is dead', () => {
  for (const [name, body, aim] of [
    ['out of reach', fakeBody(), target(100, 1)],
    ['not aimable', fakeBody({ aimable: false }), target(10, 10)],
    ['dead', fakeBody(), target(10, 10, false)],
  ]) {
    body.setState('fire')
    new Gunner(body, aim).update()
    assert.equal(body.state, 'idle', name)
  }
})

test('a gunner follows the target in and out of reach', () => {
  const body = fakeBody()
  const aim = target(50, 0)
  const gunner = new Gunner(body, aim)
  gunner.update()
  assert.equal(body.state, 'fire')
  aim.x = 101
  gunner.update()
  assert.equal(body.state, 'idle')
  aim.x = 100
  gunner.update()
  assert.equal(body.state, 'fire', 'the edge of the reach is in reach')
})

test('a gunner leaves a dead body alone', () => {
  const body = fakeBody({ alive: false })
  body.state = 'dead'
  new Gunner(body, target(10, 10)).update()
  assert.equal(body.state, 'dead')
  assert.deepEqual(body.aimed, [])
})

test('a gunner does not ask a body to aim at a target out of reach', () => {
  const body = fakeBody()
  new Gunner(body, target(500, 0)).update()
  assert.deepEqual(body.aimed, [])
})
