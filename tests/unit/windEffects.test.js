import { test } from 'node:test'
import assert from 'node:assert/strict'
import Wind from '/scenes/ustanak/Wind.js'
import WindEffects from '/scenes/ustanak/WindEffects.js'

test('wind carries smoke and fire particles once, preserves their sources, and stops when disabled', () => {
  const wind = new Wind({ random: () => .75 })
  const effects = new WindEffects(wind)
  const particle = { x: 100, y: 200, dx: 3, vreme: .5 }
  const source = { x: 100, y: 200, burning: true, flame: { sparks: [particle] } }
  effects.update([source, { children: [source] }], .5)
  assert.equal(particle.x, 100 + wind.drift * .5)
  assert.equal(source.x, 100)
  assert.equal(particle.y, 200)
  assert.equal(particle.dx, 3)
  assert.equal(particle.vreme, .5)
  wind.strength *= -1
  effects.update([source], .5)
  assert.equal(particle.x, 100)
  wind.enabled = false
  effects.update([source], 1)
  assert.equal(particle.x, 100)
})
