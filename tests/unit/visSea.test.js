import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

before(() => {
  createPageElements()
})

test('the sea scrolls down without end, from the top of the screen', async() => {
  const { default: PokretnaPozadina } = await import('/scenes/vis/PokretnaPozadina.js')
  const sea = new PokretnaPozadina(10, 800)
  sea.height = 400
  sea.onload()
  assert.deepEqual([sea.x, sea.y], [400, 0])
  sea.update(19)
  assert.equal(sea.y, 190)
  sea.update(2)
  assert.equal(sea.y, 10, 'past half its height it goes back up by that half')
})
