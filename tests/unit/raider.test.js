import { test } from 'node:test'
import assert from 'node:assert/strict'
import Raider, { raid } from '/core/gameplay/controllers/Raider.js'

/** A boat that records its state and the points it aims at. */
function fakeBoat() {
  const boat = {
    x: 90, z: 30, lane: 50, born: 0, bursts: 0, alive: true, course: Math.PI, state: 'idle', aimed: [], withdrawing: false,
    aimAt(point) {
      boat.aimed.push(point)
      return true
    },
    setState(name) {
      boat.state = name
    },
    withdraw() {
      boat.withdrawing = true
      boat.state = 'move'
    },
  }
  return boat
}

const viewWidth = () => 100

function raider(target = { x: 10, z: 30, alive: true, shown: true }) {
  const clock = { now: 0 }
  const boat = fakeBoat()
  return { clock, boat, target, raider: new Raider(boat, target, { clock, viewWidth, sees: seen => seen.shown }) }
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

test('a raider withdraws for good after its bursts or its time, still training the guns', () => {
  const byBursts = raider()
  byBursts.boat.bursts = raid.bursts
  byBursts.raider.update()
  assert.equal(byBursts.boat.withdrawing, true)
  byBursts.boat.bursts = 0
  byBursts.raider.update()
  assert.equal(byBursts.boat.withdrawing, true, 'a withdrawal is not taken back')
  assert.equal(byBursts.boat.aimed.length, 2)
  const byTime = raider()
  byTime.raider.update()
  assert.equal(byTime.boat.state, 'attack')
  byTime.clock.now = raid.seconds + .1
  byTime.raider.update()
  assert.equal(byTime.boat.withdrawing, true)
})
