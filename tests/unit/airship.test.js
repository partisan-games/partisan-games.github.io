import { test } from 'node:test'
import assert from 'node:assert/strict'
import Airship, { airship } from '/core/gameplay/bodies/aircraft/Airship.js'
import AirshipKeys from '/core/gameplay/controllers/AirshipKeys.js'

/** Flies an airship high in the air for a second, steered `steering`, at `fps`, and gives what `measure` reads from it. */
function flyFor(fps, steering, measure) {
  const body = new Airship({ y: 50 })
  body.steer(steering)
  for (let i = 0; i < fps; i++) body.update(1 / fps)
  return measure(body)
}

const sameAt30And60 = (steering, measure, what) => {
  const at30 = flyFor(30, steering, measure), at60 = flyFor(60, steering, measure)
  assert.ok(Math.abs(at30 - at60) < 1e-6, `${what}: ${at30} at 30, ${at60} at 60`)
  return at60
}

test('an airship turns, speeds up and noses up as much at 30 as at 60 frames a second', () => {
  assert.ok(Math.abs(sameAt30And60({ turn: 1 }, body => body.yaw, 'turn') - airship.turn) < 1e-9)
  assert.ok(Math.abs(sameAt30And60({ throttle: 1 }, body => body.speed, 'speed') - (1 + airship.throttle)) < 1e-9)
  assert.ok(sameAt30And60({ climb: 1 }, body => body.pitch, 'pitch') > 0)
})

test('an airship flies the way it heads, keeps above the ground and levels out when let go', () => {
  const body = new Airship({ y: 1, groundAt: () => 0 })
  for (let i = 0; i < 90; i++) body.update(1 / 30)
  assert.ok(body.x > 2, 'on ahead along +x')
  assert.ok(body.clearance >= airship.clearance * 2 - .1, `it rose clear of the ground: ${body.clearance}`)
  body.steer({ climb: 1 })
  body.update(1)
  const pitched = body.pitch
  body.steer()
  for (let i = 0; i < 300; i++) body.update(1 / 30)
  assert.ok(body.pitch < pitched * .1, `it levels out over seconds: ${body.pitch}`)
})

test('keys steer an airship: arrows turn and climb, PageUp and PageDown change its speed', () => {
  const body = new Airship({ y: 50 })
  const input = { left: true, up: true, pressed: { PageUp: true } }
  new AirshipKeys(body, input).update()
  assert.deepEqual(body.steering, { turn: 1, climb: 1, throttle: 1 })
})

test('a destroyed airship stops at the height of the ground supplied by the scene', () => {
  const body = new Airship({ y: 8, groundAt: () => 3, gravity: 5 })
  body.setState('dead')
  body.setState('move')
  body.update(.2)
  assert.ok(body.y < 8 && body.clearance > 0)
  for (let i = 0; i < 120; i++) body.update(1 / 30)
  assert.deepEqual([body.state, body.feet, body.speed, body.vy], ['dead', 3, 0, 0])
})
