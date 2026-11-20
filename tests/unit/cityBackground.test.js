import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let PozadinaGrada

before(async() => {
  createPageElements()
  // happy-dom has no 2D canvas
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({}))
  PozadinaGrada = (await import('/scenes/tenkici/PozadinaGrada.js')).default
})

test('smoke over the ruined city follows the signed wind', () => {
  const positions = []
  const ctx = { beginPath() {}, moveTo() {}, arc(x) {
    positions.push(x)
  }, fill() {} }
  const city = new PozadinaGrada({ getContext: () => ctx })
  city.crtez = ctx
  const profile = { izvor: 1, broj: 4, trajanje: 16, speed: 18, vetar: 2, sirenje: 4, vijuganje: 5, seme: 1, nijansa: 36 }
  city.gustiDim(2, profile, 12)
  const right = [...positions]
  positions.length = 0
  city.gustiDim(2, profile, -12)
  assert.equal(positions.length, right.length)
  // Smoke born at this moment has not drifted yet.
  assert.ok(right.every((x, i) => x >= positions[i]))
  assert.ok(right.filter((x, i) => x > positions[i]).length > right.length / 2)
})

test('the city burns on its own time, and its fire is heard only while it is shown', () => {
  const city = new PozadinaGrada({ width: 800, height: 600, getContext: () => ({}) })
  const playing = []
  city.fireSound.setPlaying = value => playing.push(value)
  city.update(.5)
  city.active = false
  city.update(.25)
  assert.equal(city.vreme, .75)
  assert.deepEqual(playing, [true, false])
})

test('the city draws nothing until its picture has loaded', () => {
  const drawn = []
  const city = new PozadinaGrada({ width: 800, height: 600, getContext: () => ({ drawImage: () => drawn.push(1) }) })
  city.render()
  assert.equal(drawn.length, 0)
})
