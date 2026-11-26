import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

before(() => {
  createPageElements()
})

test('the sea reaches the bottom of the screen, also one taller than wide, wherever it has scrolled', async() => {
  const { default: PokretnaPozadina } = await import('/scenes/vis/PokretnaPozadina.js')
  for (const [width, height] of [[390, 844], [1200, 800]]) {
    const sea = new PokretnaPozadina(10, width, height)
    loadAtlas(sea, 640, 1440)
    await sea.imageLoaded
    assert.ok(sea.width >= width)
    assert.ok(sea.height / 2 >= height, `${width}×${height}: one tile ${sea.height / 2} px high`)
  }
})
