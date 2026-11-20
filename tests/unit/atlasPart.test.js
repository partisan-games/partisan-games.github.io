import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let AtlasPart
const drawn = []

/** A 2D context that keeps what it draws; happy-dom has none. */
const context = new Proxy({ drawImage: (...args) => drawn.push(args) }, { get: (target, name) => target[name] ?? (() => {}), set: () => true })

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  AtlasPart = (await import('/core/actor/AtlasPart.js')).default
})

test('an atlas part is one frame in size and draws only the frame its owner picked', () => {
  const part = new AtlasPart('strip.png', { camera: { cameraX: 0, cameraY: 0 }, scale: .5, frames: 4, x: 100, y: 100 })
  loadAtlas(part, 80, 128)
  assert.deepEqual([part.width, part.height], [10, 64])

  part.frame = 2
  drawn.length = 0
  part.render()
  const [, sourceX, sourceY, sourceWidth, sourceHeight, , , width, height] = drawn[0]
  assert.deepEqual([sourceX, sourceY, sourceWidth, sourceHeight], [40, 0, 20, 128])
  assert.deepEqual([width, height], [10, 64])
})
