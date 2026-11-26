import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import { props } from '/catalog/stories/props3d.js'
import { buildKraljevo, kraljevo, models } from '/scenes/3d-tank/kraljevo.js'

test('Milutin loads with its embedded textures and stands on a solid base at the centre of the square; lindens line the road', async t => {
  const file = '/assets/models/building/monument/milutin.glb'
  const bytes = await readFile('.' + file)
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
  assert.ok(gltf.images.length > 0)
  assert.ok(gltf.images.every(image => typeof image.bufferView === 'number' && image.uri === undefined))
  const placeholder = () => new THREE.Mesh(new THREE.BoxGeometry())
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 16, height: 16 }))
    return {}
  })
  t.mock.method(FBXLoader.prototype, 'loadAsync', async() => placeholder())
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    if (url !== file) return { scene: placeholder(), animations: [] }
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const scene = new THREE.Scene(), bodies = new Map()
  await buildKraljevo({ scene, add(mesh, mass) {
    bodies.set(mesh, mass)
    scene.add(mesh)
  } })

  const monument = scene.getObjectByName('Milutin')
  const bounds = new THREE.Box3().setFromObject(monument, true)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  assert.deepEqual(monument.position.toArray(), [0, 0, kraljevo.square.z])
  assert.ok(Math.abs(bounds.min.y) < .001 && size.y > 14 && size.y < 16)
  assert.ok(Math.abs(center.x) < .001 && Math.abs(center.z - kraljevo.square.z) < .001)
  const base = [...bodies.keys()].find(mesh => mesh.position.z === kraljevo.square.z && !mesh.visible)
  assert.equal(bodies.get(base), 0)
  assert.ok(Math.abs(base.geometry.parameters.width - size.x) < .001)
  assert.ok(Math.abs(base.geometry.parameters.depth - size.z) < .001)

  const entry = props.find(({ id }) => id === 'kraljevo-milutin')
  const catalogObjects = []
  const preview = await entry.create({ add: block => catalogObjects.push(block) })
  assert.equal(catalogObjects[0], preview)
  assert.notEqual(preview.mesh, monument)

  // a linden's model stands in as a box of its height; its unseen trunk beside it stops the tank
  const lindens = scene.children.filter(child => child.visible && Math.abs(Math.abs(child.position.x) - kraljevo.avenue.aside) < .001)
  assert.ok(lindens.length >= 20, `${lindens.length} lindens`)
  for (const linden of lindens) {
    assert.ok(linden.position.z < kraljevo.wire.z, 'the avenue ends before the wire')
    const height = new THREE.Box3().setFromObject(linden).getSize(new THREE.Vector3()).y
    assert.ok(height > 10 && height < 14, `a linden ${height} m tall`)
  }
})
