import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import WireFence, { models } from '/core3d/actor/buildings/WireFence.js'

test('the drawn wire fills the box the tank knocks over, standing on the ground', async t => {
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 64, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const { mesh } = new WireFence()
  mesh.updateMatrixWorld(true)
  const { width, height, depth } = mesh.geometry.parameters
  const fence = new THREE.Box3().setFromObject(mesh.children[0])
  assert.equal(mesh.position.y - height / 2, 0, 'the box stands on the ground')
  assert.ok(Math.abs(fence.min.x + width / 2) < .1 && Math.abs(fence.max.x - width / 2) < .1, 'the wire runs the length of the box')
  assert.ok(fence.max.z - fence.min.z <= depth, 'and fits its depth')
  assert.ok(Math.abs(fence.max.y - height) < .05 && Math.abs(fence.min.y) < .05, 'its posts from the ground to the top of the box')
  assert.ok(WireFence.mass > 0, 'a body the tank can move')
})
