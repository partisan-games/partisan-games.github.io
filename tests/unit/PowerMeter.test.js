import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { setUiStyle } from '/ui/styles.js'
import { createPageElements } from './helpers/dom.js'

let PowerMeter

before(async() => {
  createPageElements()
  PowerMeter = (await import('/ui/PowerMeter.js')).default
})

const charge = (meter, seconds) => {
  for (let i = 0; i < seconds * 60; i++) meter.charge(1 / 60)
}

test('the cannon power rises from 10 to 25 while held and drops back to 10 after a shot', () => {
  const meter = new PowerMeter({ min: 10, max: 25, chargePerSecond: 12 })
  assert.equal(meter.value, 10)
  assert.equal(meter.element.value, 0)

  charge(meter, .5)
  assert.ok(Math.abs(meter.value - 16) < 1e-9, `after half a second: ${meter.value}`)

  charge(meter, 5)
  assert.equal(meter.value, 25)
  assert.equal(meter.element.value, 1)

  meter.reset()
  assert.equal(meter.value, 10)
  meter.end()
})

test('the power meter looks like the health bar of the scene style and leaves with the game', () => {
  setUiStyle('rpg')
  const meter = new PowerMeter({ min: 10, max: 25, chargePerSecond: 12 })
  assert.equal(meter.element.className, 'progress top-right rpgui-progress')

  meter.end()
  assert.equal(document.querySelector('progress'), null)
  setUiStyle()
})
