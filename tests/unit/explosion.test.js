import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Explosion

before(async() => {
  createPageElements()
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
