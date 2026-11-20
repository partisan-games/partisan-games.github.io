import { test } from 'node:test'
import assert from 'node:assert/strict'
import Strafer, { strafe } from '/core/gameplay/controllers/Strafer.js'

/** A plane that records its state and the points it aims at. */
function fakePlane({ x = 600, y = 100 } = {}) {
  const plane = {
    x, y, alive: true, lifeId: 1, pullUpY: 300, state: 'fly', aimed: [],
    aimAt(point) {
      plane.aimed.push(point)
      return true
    },
    setState(name) {
      plane.state = name
    },
  }
  return plane
}

const target = { x: 100, y: 350, alive: true, shown: true }
const viewWidth = () => 1000

test('a strafer flies level until the target is ahead within reach, then dives at it once, firing', () => {
  const plane = fakePlane({ x: target.x + 950 })
  const strafer = new Strafer(plane, target, { viewWidth })
  strafer.update()
  assert.equal(plane.state, 'fly', 'too far ahead')
  plane.x = target.x + 400
  strafer.update()
  assert.equal(plane.state, 'fire')
  assert.deepEqual(plane.aimed, [target])
  plane.x -= 50
  strafer.update()
  assert.equal(plane.aimed.length, 1, 'the dive is chosen once')
})

test('a strafer dives without firing at a target out of sight', () => {
  const plane = fakePlane()
  new Strafer(plane, { ...target, shown: false }, { viewWidth }).update()
  assert.equal(plane.state, 'dive')
})

test('a strafer pulls up near the target or at its lowest, and dives again only on a new life', () => {
  const nearTarget = plane => {
    plane.x = target.x + strafe.pullUp
  }
  const lowest = plane => {
    plane.y = plane.pullUpY
  }
  for (const pullUp of [nearTarget, lowest]) {
    const plane = fakePlane()
    const strafer = new Strafer(plane, target, { viewWidth })
    strafer.update()
    assert.equal(plane.state, 'fire')
    pullUp(plane)
    strafer.update()
    assert.equal(plane.state, 'fly')
    plane.x = 600
    plane.y = 100
    strafer.update()
    assert.equal(plane.state, 'fly', 'one dive a pass')
    plane.lifeId++
    strafer.update()
    assert.equal(plane.state, 'fire')
  }
})
