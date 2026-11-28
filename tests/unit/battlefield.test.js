import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Terrain from '/scenes/ustanak/Terrain.js'

let Battlefield, placeOrder
const drawn = []

/** A 2D context that keeps the images it draws; happy-dom has none. */
const context = new Proxy({ drawImage: image => drawn.push(image), createLinearGradient: () => ({ addColorStop() {} }) },
  { get: (target, name) => target[name] ?? (() => ({ setTransform() {} })), set: () => true })

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ default: Battlefield, placeOrder } = await import('/scenes/ustanak/Battlefield.js'))
})

/** A battlefield whose pictures have loaded. */
function loaded() {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const field = new Battlefield({ canvas, groundY: 450, terrain: new Terrain({ floorY: 480 }) })
  for (const { image } of field.places)
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 1536 }, naturalHeight: { value: 1024 } })
  return field
}

test('each round is fought on the next place of the uprising, and the next match goes on from there', () => {
  const shown = []
  for (const match of [loaded(), loaded()])
    for (let round = 0; round < 2; round++) {
      match.startRound()
      shown.push(placeOrder[match.places.indexOf(match.place)])
    }
  const first = placeOrder.indexOf(shown[0])
  assert.deepEqual(shown, shown.map((_, i) => placeOrder[(first + i) % placeOrder.length]))
})

test('only the place being fought on is heard burning', () => {
  const field = loaded()
  field.startRound()
  for (const place of field.places) assert.equal(place.fireSound.desired, place === field.place)
})
