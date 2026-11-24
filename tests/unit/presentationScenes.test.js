import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Texture, TextureLoader } from 'three'
import GameSession from '/core/runtime/GameSession.js'

test('late drvar textures are freed without adding sprites to the disposed scene', async t => {
  const { default: Drvar } = await import('/scenes/drvar/Main.js')
  let loaded
  const texture = new Texture()
  let freed = 0
  texture.addEventListener('dispose', () => freed++)
  t.mock.method(TextureLoader.prototype, 'load', (src, onLoad) => {
    loaded = onLoad
    return texture
  })
  const session = new GameSession()
  let added = 0
  const scene = { session, avioni: [], addMesh: () => added++ }
  Drvar.prototype.dodajSprite.call(scene, { urls: ['sprite.png'], type: 'avioni' }, 0)
  session.dispose()
  loaded(texture)
  assert.equal(freed, 1)
  assert.equal(added, 0)
  assert.equal(scene.avioni.length, 0)
})

test('drvar sprite animation consumes elapsed frames equally at 30 and 60 Hz and after a long frame', async t => {
  const { default: Sprite } = await import('/scenes/drvar/Sprite.js')
  t.mock.method(TextureLoader.prototype, 'load', () => new Texture())
  const make = () => {
    const sprite = new Sprite('sprite.png', 8, 4)
    t.after(() => {
      sprite.texture.dispose()
      sprite.material.dispose()
    })
    return sprite
  }
  const a = make()
  const b = make()
  const long = make()
  for (let i = 0; i < 30; i++) a.update(1 / 30)
  for (let i = 0; i < 60; i++) b.update(1 / 60)
  long.update(1)
  assert.equal(a.currentFrame, 4)
  assert.equal(b.currentFrame, 4)
  assert.equal(long.currentFrame, 4)
})

test('presentation scene modules import without starting model fetches', async t => {
  const { createPageElements } = await import('./helpers/dom.js')
  createPageElements()
  let requests = 0
  t.mock.method(globalThis, 'fetch', () => {
    requests++
    return Promise.reject(new Error('Scene import must not start a model request'))
  })
  for (const name of ['drvar', 'locomotive'])
    await import(`/scenes/${name}/Main.js`)
  assert.equal(requests, 0)
})
