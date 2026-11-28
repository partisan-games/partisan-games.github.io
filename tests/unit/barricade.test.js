import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import Barricade, { models } from '/core3d/actor/buildings/Barricade.js'

test('the drawn sandbags of a barricade fill the box the tank pushes, standing on the ground', async t => {
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 64, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const { mesh } = new Barricade()
  mesh.updateMatrixWorld(true)
  const { width, height, depth } = mesh.geometry.parameters
  const bags = new THREE.Box3().setFromObject(mesh.children[0])
  const size = bags.getSize(new THREE.Vector3())
  assert.equal(mesh.position.y - height / 2, 0, 'the box stands on the ground')
  assert.ok(Math.abs(size.x - width) < .05 && Math.abs(size.z - depth) < .05, `${size.x} × ${size.z}`)
  assert.ok(Math.abs(bags.max.y - height) < .02, 'the sandbags reach the top of the box')
  assert.ok(bags.min.y < 0 && bags.min.y > -.1, 'their bottom just under the ground')
})
