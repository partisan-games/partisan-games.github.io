import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Airfield

before(async() => {
  createPageElements()
  ;({ default: Airfield } = await import('/scenes/franjo-kluz/Airfield.js'))
})

test('the asphalt runway is drawn from the airfield building to the end of the runway', () => {
  const airfield = new Airfield({ camera: { cameraX: 0, cameraY: 0 }, groundY: 700, x: 1000 })
  const [runway] = airfield.children
  assert.ok(runway.image.src.endsWith('textures/terrain/asphalt.jpg'))
  assert.ok(airfield.children.includes(runway))
})
