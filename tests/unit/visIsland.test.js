import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let canvas2d

before(async() => {
  createPageElements()
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

test('a moving piece of scenery comes down from above the screen and starts over once past the bottom', async() => {
  const { default: Pokretno } = await import('/scenes/vis/Pokretno.js')
  const island = new Pokretno('nature/ostrvo.gif', { thrust: 150, scale: 2 })
  island.height = 100
  assert.ok(island.y <= 0 && island.y >= -canvas2d.height * .5, 'above the screen, at most half its height')
  assert.ok(island.x >= 0 && island.x <= canvas2d.width)
  assert.deepEqual([island.dx, island.dy], [0, 150])
  island.y = canvas2d.height + 99
  island.update(1)
  assert.ok(island.y <= 0, 'past the bottom it starts over')
})
