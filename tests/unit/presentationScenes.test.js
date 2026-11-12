import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Object3D, Texture, TextureLoader } from 'three'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import CityMorph from '/scenes/dark-city/CityMorph.js'
import GameSession from '/core/runtime/GameSession.js'

test('each city morph owns its tweens and game time, waits in pause and stops on disposal', t => {
  t.mock.method(Math, 'random', () => .5)
  const first = new GameSession()
  const second = new GameSession()
  first.start()
  second.start()
  const a = new Object3D()
  const b = new Object3D()
  const morphA = new CityMorph({ buildings: [a], clock: first.presentationClock })
  const morphB = new CityMorph({ buildings: [b], clock: second.presentationClock })
  first.scope.add(() => morphA.end())
  second.scope.add(() => morphB.end())
  morphA.grow(400)
  morphB.grow(400)
  first.update(.5)
  morphA.update()
  morphB.update()
  assert.equal(a.scale.y, 6)
  assert.equal(b.scale.y, 1)
  TWEEN.update(1e9)
  assert.equal(a.scale.y, 6)
  assert.equal(b.scale.y, 1)
  first.pause()
  first.update(100)
  morphA.update()
  assert.equal(a.scale.y, 6)
  first.dispose()
  first.presentationClock.advance(100)
  morphA.update()
  assert.equal(a.scale.y, 6)
  second.dispose()
})

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

test('all six presentation scene modules import without starting model fetches', async t => {
  const { createPageElements } = await import('./helpers/dom.js')
  createPageElements()
  let requests = 0
  t.mock.method(globalThis, 'fetch', () => {
    requests++
    return Promise.reject(new Error('Scene import must not start a model request'))
  })
  for (const name of ['city-colorful', 'dark-city', 'drvar', 'flying-through-space', 'locomotive', 'lookat-cursor'])
    await import(`/scenes/${name}/Main.js`)
  assert.equal(requests, 0)
})
