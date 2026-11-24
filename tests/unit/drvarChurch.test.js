import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import Church, { models } from '/core3d/actor/buildings/Church.js'

test('Drvar church embeds its texture, fits the yard and keeps the entrance toward the west gate', async t => {
  const bytes = await readFile('assets/models/building/drvar-church/church.glb')
  const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  assert.ok(document.images.length > 0)
  for (const image of document.images) {
    assert.equal(image.uri, undefined, 'no remote or loose texture dependency')
    assert.equal(typeof image.bufferView, 'number')
  }
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1024, height: 1024 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    assert.equal(url, '/assets/models/building/drvar-church/church.glb')
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const church = new Church()
  church.mesh.rotation.y = Math.PI / 2
  const bounds = new THREE.Box3().setFromObject(church.mesh, true)
  const size = bounds.getSize(new THREE.Vector3())
  assert.ok(Math.abs(bounds.min.y) < .001)
  assert.ok(Math.abs(size.y - 11) < .001)
  assert.ok(bounds.min.x > -11 && bounds.max.x < 11 && bounds.min.z > -9 && bounds.max.z < 9)
  let triangles = 0
  let entrance
  church.mesh.traverse(part => {
    if (!part.isMesh) return
    triangles += (part.geometry.index?.count ?? part.geometry.attributes.position.count) / 3
    assert.ok(part.geometry.attributes.position.array.every(Number.isFinite))
    if (part.material.name === 'stone') assert.ok(part.material.map)
    if (part.material.name === 'wood') entrance = new THREE.Box3().setFromObject(part, true).getCenter(new THREE.Vector3())
  })
  assert.ok(triangles < 5000)
  assert.ok(entrance.x < -4 && Math.abs(entrance.z) < 1, 'actual entry geometry faces the west gate')
  assert.notEqual(new Church().mesh, church.mesh, 'catalog and level get separate scene instances')
})
