import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

let Airfield

before(async() => {
  createPageElements()
  ;({ default: Airfield } = await import('/scenes/franjo-kluz/Airfield.js'))
})

test('the asphalt runway keeps its start and height beside the loaded airfield building', async t => {
  loadImages(t, { '/scenery/franjo-kluz/aerodrom.webp': [780, 600] })
  const airfield = new Airfield({ camera: { cameraX: 0, cameraY: 0 }, groundY: 700, x: 1000 })
  await airfield.imageLoaded
  const [runway] = airfield.children
  assert.ok(runway.image.src.endsWith('textures/terrain/asphalt.jpg'))
  assert.deepEqual([airfield.width, airfield.height, airfield.y], [780, 600, 400])
  assert.deepEqual(airfield.runway, { left: 1390, right: 3390 })
  assert.equal(airfield.surface, 686)
})
