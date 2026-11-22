import { test } from 'node:test'
import assert from 'node:assert/strict'
import Raider, { raid } from '/core/gameplay/controllers/Raider.js'

/** A boat that records its state and the points it aims at. */
function fakeBoat() {
  const boat = {
    x: 90, z: 30, lane: 50, alive: true, course: Math.PI, state: 'idle', aimed: [],
    aimAt(point) {
      boat.aimed.push(point)
      return true
    },
    setState(name) {
      boat.state = name
    },
  }
  return boat
}

const viewWidth = () => 100

function raider(target = { x: 10, z: 30, alive: true, shown: true }) {
  const boat = fakeBoat()
  return { boat, target, raider: new Raider(boat, target, { viewWidth, sees: seen => seen.shown }) }
}

test('a raider heads along its lane for a point ahead of the target and fires at it', () => {
  const { boat, target, raider: ai } = raider()
  ai.update()
  assert.equal(boat.state, 'attack')
  assert.equal(boat.course, Math.atan2(-(boat.lane - boat.z), target.x + viewWidth() * raid.ahead - boat.x))
  assert.deepEqual(boat.aimed, [target])
})

test('a raider sails without firing at a target out of sight', () => {
  const { boat, raider: ai } = raider({ x: 10, z: 30, alive: true, shown: false })
  ai.update()
  assert.equal(boat.state, 'move')
})

test('a raider the target has run past keeps heading up the river in its lane, never back after it', () => {
  const { boat, raider: ai } = raider({ x: 200, z: 30, alive: true, shown: true })
  ai.update()
  assert.ok(Math.cos(boat.course) < 0, 'up the river')
  assert.equal(boat.course, Math.atan2(-(boat.lane - boat.z), -raid.onward))
})
