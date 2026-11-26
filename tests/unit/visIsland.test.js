import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadImages } from './helpers/images.js'

let canvas2d

before(async() => {
  createPageElements()
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

test('a moving piece of scenery comes down from above the screen and starts over once past the bottom', async t => {
  loadImages(t, { '/scenery/vis/ostrvo.webp': [62, 63] })
  const { default: Pokretno } = await import('/scenes/vis/Pokretno.js')
  const island = new Pokretno('game-ready/scenery/vis/ostrvo.webp', { thrust: 150, scale: 2 })
  await island.imageLoaded
  assert.deepEqual([island.width, island.height], [124, 126])
  assert.ok(island.y <= 0 && island.y >= -canvas2d.height * .5, 'above the screen, at most half its height')
  assert.ok(island.x >= 0 && island.x <= canvas2d.width)
  assert.deepEqual([island.dx, island.dy], [0, 150])
  island.y = canvas2d.height + island.height - 1
  island.update(1)
  assert.ok(island.y <= 0, 'past the bottom it starts over')
})
