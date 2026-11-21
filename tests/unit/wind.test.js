import { test } from 'node:test'
import assert from 'node:assert/strict'
import Wind, { wind as settings } from '/scenes/ustanak/Wind.js'
import FieldGun from '/core/gameplay/bodies/artillery/FieldGun.js'

test('the wind of a round stays the same, can be switched off and carries the shots of both guns alike', () => {
  const wind = new Wind({ random: () => .75 })
  const guns = [new FieldGun({ x: 20, wind }), new FieldGun({ x: 80, yaw: Math.PI, wind })]
  const strength = wind.acceleration
  assert.ok(strength >= settings.min && strength <= settings.max)
  for (const gun of guns) {
    const ball = gun.shells.fire({ x: 50, y: 30, z: 0 }, 0, 0, 0)
    ball.update(.1)
    assert.ok(Math.abs(ball.vx - strength * .1) < 1e-12)
    wind.enabled = false
    const before = ball.vx
    ball.update(.1)
    assert.equal(ball.vx, before)
    wind.enabled = true
  }
  assert.equal(wind.acceleration, strength)
  wind.random = () => .25
  wind.nextRound()
  assert.ok(wind.acceleration < 0, 'a new round may change its way')
})
