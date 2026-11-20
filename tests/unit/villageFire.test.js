import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let VillageFire

before(async() => {
  createPageElements()
  // happy-dom has no 2D canvas
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({}))
  VillageFire = (await import('/scenes/ustanak/VillageFire.js')).default
})

test('smoke in the village follows the signed wind', () => {
  const positions = []
  const ctx = { beginPath() {}, moveTo() {}, arc(x) {
    positions.push(x)
  }, fill() {} }
  const village = new VillageFire()
  village.ctx = ctx
  const source = { x: .5, y: .5, phase: 1, life: 10, scale: 1, spread: 2, drift: 1, rise: 10, tone: 50 }
  village.smoke(2, source, 12)
  const right = [...positions]
  positions.length = 0
  village.smoke(2, source, -12)
  assert.equal(positions.length, right.length)
  // Smoke born at this moment has not drifted yet.
  assert.ok(right.every((x, i) => x >= positions[i]))
  assert.ok(right.filter((x, i) => x > positions[i]).length > right.length / 2)
})
