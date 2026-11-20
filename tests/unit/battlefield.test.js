import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Terrain from '/scenes/ustanak/Terrain.js'

let Battlefield
const drawn = []

/** A 2D context that keeps the images it draws; happy-dom has none. */
const context = new Proxy({ drawImage: image => drawn.push(image), createLinearGradient: () => ({ addColorStop() {} }) },
  { get: (target, name) => target[name] ?? (() => ({ setTransform() {} })), set: () => true })

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  Battlefield = (await import('/scenes/ustanak/Battlefield.js')).default
})

/** A battlefield whose pictures have loaded. */
function loaded() {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const field = new Battlefield({ canvas, groundY: 450, terrain: new Terrain({ floorY: 480 }) })
  for (const image of [field.mountains, field.village, field.city.image])
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 100 }, naturalHeight: { value: 80 } })
  return field
}

test('each round has its own background: mountains, the burning village, the ruined city', () => {
  const field = loaded()
  const pictures = { 1: field.mountains, 2: field.village, 3: field.city.image }
  for (const [round, picture] of Object.entries(pictures)) {
    field.round = Number(round)
    drawn.length = 0
    field.render()
    assert.ok(drawn.includes(picture), `round ${round}`)
    for (const other of Object.values(pictures).filter(image => image !== picture))
      assert.ok(!drawn.includes(other), `round ${round} shows only its own picture`)
  }
})

test('the fire of the village is heard only in its round, and of the city only in its', () => {
  const field = loaded()
  for (const round of [1, 2, 3]) {
    field.round = round
    field.update(0)
    assert.equal(field.villageFire.fireSound.desired, round === 2, `village, round ${round}`)
    assert.equal(field.city.fireSound.desired, round === 3, `city, round ${round}`)
  }
})
