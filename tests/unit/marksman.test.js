import { test } from 'node:test'
import assert from 'node:assert/strict'
import Marksman from '/core/gameplay/controllers/Marksman.js'

/** A body that records the state it is set to and the points it aims at; it can aim only at points left of it. */
function fakeBody({ alive = true } = {}) {
  const body = {
    x: 100, alive, state: 'idle', aimed: [],
    aimAt(point) {
      body.aimed.push(point)
      return point.x < body.x
    },
    setState(name) {
      body.state = name
    },
  }
  return body
}

const target = ({ x = 0, alive = true, shown = true } = {}) => ({ x, y: 0, alive, shown })
/** The body sees what is shown. */
const sees = target => target.shown

test('a marksman fires at a living target in sight that the body can aim at', () => {
  const body = fakeBody()
  const aim = target()
  new Marksman(body, aim, { sees }).update()
  assert.equal(body.state, 'fire')
  assert.deepEqual(body.aimed, [aim])
})

test('a marksman aims where its aim gives, such as ahead of a moving target', () => {
  const body = fakeBody()
  const ahead = { x: 20, y: 0 }
  new Marksman(body, target(), { sees, aim: () => ahead }).update()
  assert.deepEqual(body.aimed, [ahead])
  assert.equal(body.state, 'fire')
})

test('a marksman keeps aiming but holds fire at a target out of aim, dead or out of sight', () => {
  for (const [name, aim] of [
    ['out of aim', target({ x: 200 })],
    ['dead', target({ alive: false })],
    ['out of sight', target({ shown: false })],
  ]) {
    const body = fakeBody()
    body.state = 'fire'
    new Marksman(body, aim, { sees }).update()
    assert.equal(body.state, 'idle', name)
    assert.deepEqual(body.aimed, [aim], `${name}: the body still aims`)
  }
})

test('a marksman holds fire in the rest state it is given, and leaves a dead body alone', () => {
  const body = fakeBody()
  new Marksman(body, target({ alive: false }), { rest: 'drive', sees }).update()
  assert.equal(body.state, 'drive')
  const dead = fakeBody({ alive: false })
  dead.state = 'dead'
  new Marksman(dead, target(), { sees }).update()
  assert.equal(dead.state, 'dead')
  assert.deepEqual(dead.aimed, [])
})
