import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Explosion
const context = { save() {}, restore() {}, translate() {}, scale() {}, drawImage() {} }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ default: Explosion } = await import('/core/actor/effects/Explosion.js'))
})

test('a burst shows where it starts, hides after a second even without its image, and plays again', () => {
  const burst = new Explosion()
  assert.equal(burst.visible, false, 'hidden until it starts')
  burst.start(300, 200)
  assert.deepEqual([burst.x, burst.y, burst.visible], [300, 200, true])
  burst.update(.9)
  assert.equal(burst.visible, true)
  burst.update(.1)
  assert.equal(burst.visible, false)
  burst.start(10, 20)
  assert.equal(burst.visible, true, 'once more')
})

test('a burst is as big as its scale, and its fire reaches half its size', () => {
  assert.equal(new Explosion(null, { scale: 1.8 }).scaleX, 1.8)
  assert.equal(new Explosion(null, { scale: 1.8 }).reach, 128 * 1.8 / 2)
  assert.equal(new Explosion(null, { scale: 1 }).reach, 64)
})

test('a burst draws all eight frames past the transparent gutter around each centered cell', t => {
  const burst = new Explosion()
  Object.defineProperty(burst.image, 'naturalWidth', { value: 1088 })
  const draw = t.mock.method(context, 'drawImage', () => {})
  burst.start(300, 200)
  for (let frame = 0; frame < 8; frame++) {
    burst.render()
    assert.deepEqual(draw.mock.calls[frame].arguments,
      [burst.image, 4 + 136 * frame, 4, 128, 128, -64, -64, 128, 128])
    burst.update(1 / 8)
  }
  burst.render()
  assert.equal(draw.mock.callCount(), 8)
})

test('a burst on the screen is judged by the screen, one in the world by its camera', () => {
  const onScreen = new Explosion(null, { z: -1 })
  onScreen.width = onScreen.height = 100
  onScreen.start(-500, 100)
  assert.equal(onScreen.offScreen, true)
  assert.equal(onScreen.position.z, -1)
  const inWorld = new Explosion({ cameraX: -1000, cameraY: 0 })
  inWorld.width = inWorld.height = 100
  inWorld.start(-500, 100)
  assert.equal(inWorld.offScreen, false, 'the camera looks there')
})
