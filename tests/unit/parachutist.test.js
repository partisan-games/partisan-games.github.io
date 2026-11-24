import { test } from 'node:test'
import assert from 'node:assert/strict'
import Parachutist, { parachutist } from '/core/gameplay/bodies/characters/Parachutist.js'
import Character from '/core/gameplay/bodies/characters/Character.js'

const fall = (body, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) body.update(dt)
}

test('a parachutist sinks at his descent speed, drifting with the wind, and lands on the ground', () => {
  const body = new Parachutist({ y: 50, drift: { x: 1, z: -.5 }, groundAt: () => 2 })
  fall(body, 2)
  assert.ok(Math.abs(body.y - (50 - 2 * parachutist.descent)) < .2, `${body.y}`)
  assert.ok(body.x > 1.9 && body.z < -.9)
  assert.equal(body.landed, false)
  fall(body, 10)
  assert.equal(body.landed, true)
  assert.equal(body.feet, 2)
  const { x } = body
  fall(body, 1)
  assert.equal(body.x, x, 'once down he no longer drifts')
})

test('shot dead in the air he still sinks under his canopy and lies where he lands, never landed', () => {
  const body = new Parachutist({ y: 30 })
  body.takeHit(body.health.maximum)
  fall(body, 10)
  assert.equal(body.dead, true)
  assert.equal(body.landed, false)
  assert.equal(body.feet, 0)
})

test('a rifleman on the ground hits a parachutist above him', () => {
  const body = new Parachutist({ x: 20, y: 20 })
  const rifleman = new Character({ reach: 100, damage: [200, 200], targets: [body], aimable: true,
    pitchRange: { min: -Math.PI / 2, max: Math.PI / 2 } })
  rifleman.y = rifleman.size.height / 2
  rifleman.yaw = 0
  rifleman.pitch = Math.atan2(body.y - rifleman.eye.y, body.x)
  rifleman.land({ kind: 'attack', time: 0, length: .3, landed: false })
  assert.equal(body.dead, true)
})
