import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { createPageElements } from './helpers/dom.js'

test('a prisoner in the catalog crouches, rests and peers as in his level, and gets up before he swings', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { ww2 } = await import('/catalog/stories/characters3d.js')
  const stories = ww2.filter(({ id }) => id.startsWith('logoras-'))
  assert.deepEqual(stories.map(({ name }) => name), ['Logoraš Ilija', 'Logoraš Petar', 'Logoraš Jovan'])

  const objects = [], controllers = []
  const stage = { add: (...items) => objects.push(...items), controllers }
  const body = await stories[0].create(stage, 1)
  const [, view] = objects
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      for (const controller of controllers) controller.update(1 / 30)
      body.update(1 / 30)
      view.update(1 / 30)
    }
  }
  assert.deepEqual(body.acts, ['crouch', 'rest', 'peek', 'wounded', 'attack'])

  body.act('rest')
  live(.1)
  assert.equal(view.clip, 'crouchDown')
  live(2)
  assert.equal(view.clip, 'crouchRest')
  body.act('peek')
  live(.1)
  assert.equal(view.clip, 'crouchPeek')

  body.act('attack')
  live(.1)
  assert.equal(view.clip, 'crouchUp')
  assert.equal(body.swing, null)
  live(2)
  assert.ok(body.swing, 'standing, he swings')

  live(2)
  body.act('wounded')
  live(.1)
  assert.equal(view.clip, 'injuredIdle', 'wounded, he stands bent over his wound')
  body.act('wounded')
  live(.1)
  assert.equal(view.clip, 'idle', 'healed, he stands as before')
})
