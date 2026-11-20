import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Wind from '/scenes/ustanak/Wind.js'

let Top

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
})

test('round wind stays constant, can be disabled and is shared by both cannons', () => {
  const wind = new Wind({ random: () => .75 })
  const left = new Top({ x: 200, y: 300, wind })
  const right = new Top({ x: 800, y: 300, wind, direction: -1 })
  const strength = wind.acceleration
  assert.ok(strength >= 8 && strength <= 16)
  for (const cannon of [left, right]) {
    const shell = cannon.granate.projectiles[0]
    shell.launch({ x: 500, y: -100 }, 0, 0)
    shell.update(.1)
    assert.equal(shell.dx, strength * .1)
    assert.equal(wind.acceleration, strength)
    wind.enabled = false
    const before = shell.dx
    shell.update(.1)
    assert.equal(shell.dx, before)
    wind.enabled = true
  }
  wind.random = () => .25
  wind.nextRound()
  assert.ok(wind.acceleration < 0, 'a new round may change direction')
})
