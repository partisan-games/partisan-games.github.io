import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Explosion, explosion

before(async() => {
  createPageElements()
  ;({ default: Explosion, explosion } = await import('/scenes/vis/Explosion.js'))
})

test('a burst shows where it starts, hides after its duration even without its image, and plays again', () => {
  const burst = new Explosion()
  assert.equal(burst.visible, false, 'hidden until it starts')
  burst.start(300, 200)
  assert.deepEqual([burst.x, burst.y, burst.visible], [300, 200, true])
  burst.update(explosion.duration - .1)
  assert.equal(burst.visible, true)
  burst.update(.1)
  assert.equal(burst.visible, false)
  burst.start(10, 20)
  assert.equal(burst.visible, true, 'once more')
})

test('a burst is as big as its scale, and its fire reaches half its size', t => {
  t.after(() => {
    explosion.scale = 1.8
  })
  assert.equal(new Explosion().scaleX, explosion.scale)
  assert.equal(Explosion.reach, 128 * explosion.scale / 2)
  explosion.scale = 1
  assert.equal(Explosion.reach, 64, 'a changed scale changes the reach')
})
