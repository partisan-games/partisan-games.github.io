import { test } from 'node:test'
import assert from 'node:assert/strict'
import RunwayLanding from '/core/gameplay/controllers/RunwayLanding.js'

const runway = { start: { x: 50, z: 40 }, stop: { x: 50, z: 20 } }

function landing(rest = 4) {
  const body = { x: 30, z: 70, vx: 3, vz: -2, lift: 1 }
  const events = []
  const controller = new RunwayLanding(body, { runway, rest, onLanded: () => events.push('landed'),
    onRested: () => events.push('rested'), onAirborne: () => events.push('airborne') })
  const fly = seconds => {
    for (let i = 0; i < seconds * 30; i++) controller.update(1 / 30)
  }
  return { body, controller, events, fly }
}

test('a plane flies to the near end of the runway, sinks as it rolls up it, and stands at the stop on the ground', () => {
  const { body, controller, events, fly } = landing()
  fly(1 / 30)
  assert.deepEqual([body.vx, body.vz], [0, 0], 'out of the steering')
  assert.equal(body.lift, 1, 'at its height while it flies to the runway')
  while (controller.phase === 'approach') fly(1 / 30)
  assert.deepEqual([body.x, body.z], [runway.start.x, runway.start.z])
  fly(1)
  assert.ok(body.lift > 0 && body.lift < 1, 'sinking as it rolls')
  assert.ok(body.z < runway.start.z && body.z > runway.stop.z)
  fly(5)
  assert.deepEqual([body.x, body.z, body.lift], [runway.stop.x, runway.stop.z, 0])
  assert.deepEqual(events, ['landed'])
})

test('a landed plane rests its while, then climbs away up the runway and is airborne at its height', () => {
  const { body, controller, events, fly } = landing(4)
  while (controller.phase !== 'rest') fly(1 / 30)
  fly(3.9)
  assert.deepEqual(events, ['landed'], 'still resting')
  assert.equal(body.z, runway.stop.z)
  fly(.2)
  assert.deepEqual(events, ['landed', 'rested'])
  fly(3)
  assert.deepEqual(events, ['landed', 'rested', 'airborne'])
  assert.equal(body.lift, 1)
  assert.ok(body.z < runway.stop.z, 'it took off up the runway')
})
