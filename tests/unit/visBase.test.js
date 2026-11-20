import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let canvas2d

before(async() => {
  createPageElements()
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

test('the base comes down from above the screen at its speed and stops before its top shows', async() => {
  const { default: Baza } = await import('/scenes/vis/Baza.js')
  const base = new Baza({ speed: 100 })
  assert.equal(base.y, -canvas2d.height)
  assert.equal(base.width, canvas2d.width)
  base.update(1)
  assert.equal(base.y, 100 - canvas2d.height)
  for (let i = 0; i < canvas2d.height; i++) base.update(1)
  assert.ok(base.y < 0 && base.y + 100 >= 0)
})
