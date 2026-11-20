import { test } from 'node:test'
import assert from 'node:assert/strict'
import Raider, { raid } from '/core/gameplay/controllers/Raider.js'

/** A boat that records its state and the points it aims at. */
function fakeBoat() {
  const boat = {
    x: 900, y: 300, lane: 500, born: 0, bursts: 0, alive: true, course: Math.PI, state: 'idle', aimed: [],
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

const view = { width: 1000, height: 600 }

function raider(target = { x: 100, y: 300, alive: true, shown: true }) {
  const clock = { now: 0 }
  const boat = fakeBoat()
  return { clock, boat, target, raider: new Raider(boat, target, { clock, view }) }
}

test('a raider heads along its lane for a point ahead of the target and fires at it', () => {
  const { boat, target, raider: ai } = raider()
  ai.update()
  assert.equal(boat.state, 'fire')
  assert.equal(boat.course, Math.atan2(boat.lane - boat.y, target.x + view.width * raid.ahead - boat.x))
  assert.deepEqual(boat.aimed, [target])
})

test('a raider sails without firing at a target out of sight', () => {
  const { boat, raider: ai } = raider({ x: 100, y: 300, alive: true, shown: false })
  ai.update()
  assert.equal(boat.state, 'sail')
})

test('a raider withdraws for good after its bursts or its time, still training the guns', () => {
  const byBursts = raider()
  byBursts.boat.bursts = raid.bursts
  byBursts.raider.update()
  assert.equal(byBursts.boat.state, 'withdraw')
  byBursts.boat.bursts = 0
  byBursts.raider.update()
  assert.equal(byBursts.boat.state, 'withdraw', 'a withdrawal is not taken back')
  assert.equal(byBursts.boat.aimed.length, 2)
  const byTime = raider()
  byTime.raider.update()
  assert.equal(byTime.boat.state, 'fire')
  byTime.clock.now = raid.seconds + .1
  byTime.raider.update()
  assert.equal(byTime.boat.state, 'withdraw')
})
