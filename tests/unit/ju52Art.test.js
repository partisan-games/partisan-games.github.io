import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Transport from '/core/gameplay/bodies/aircraft/Transport.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import { createPageElements } from './helpers/dom.js'

test('the Ju 52 carries its textures and three propellers that turn about shafts inside them', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1024, height: 1024 }))
    return {}
  })
  const bytes = await readFile('assets/models/aircraft/ju52/model.glb')
  const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
  assert.ok(document.images.every(image => image.bufferView !== undefined && !image.uri), 'its textures are inside the file')
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  let propellers = 0
  scene.traverse(part => {
    if (!part.isMesh || !part.name.toLowerCase().includes('propeller')) return
    propellers++
    const axle = new THREE.Vector3(...part.userData.axle)
    part.geometry.computeBoundingBox()
    assert.ok(part.geometry.boundingBox.containsPoint(axle), 'shaft must be inside its own propeller geometry, in glTF local coordinates')
    assert.ok(axle.distanceTo(part.geometry.boundingBox.getCenter(new THREE.Vector3())) < .05,
      'the two-blade propellers are symmetric about their shafts')
  })
  assert.equal(propellers, 3)
})

test('the catalog transport rotates three shafts and shows damage without spawning other actors', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture({ width: 1024, height: 1024 })
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1024, height: 1024 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { aircraft3d } = await import('/catalog/stories/drvar.js')
  const { default: Ju52 } = await import('/core3d/actor/aircraft/Ju52.js')
  const scene = new THREE.Scene(), objects = []
  const stage = { add(...added) {
    objects.push(...added)
    added.forEach(object => object.mesh && scene.add(object.mesh))
  } }
  const body = await aircraft3d[0].create(stage)
  assert.ok(body instanceof Transport)
  assert.deepEqual(body.states, ['idle', 'move', 'dead'])
  const model = objects.find(object => object instanceof Ju52)
  assert.equal(model.propellers.length, 3)
  const shafts = model.propellers.map(pivot => pivot.getWorldPosition(new THREE.Vector3()))
  body.setState('idle')
  model.update(.1)
  assert.ok(model.propellers.every(pivot => pivot.rotation.x === 0))
  body.setState('move')
  model.update(.1)
  model.mesh.updateMatrixWorld(true)
  model.propellers.forEach((pivot, i) => {
    assert.notEqual(pivot.rotation.x, 0)
    const blade = pivot.children[0]
    const shaft = blade.localToWorld(new THREE.Vector3(...blade.userData.axle))
    assert.ok(shaft.distanceTo(shafts[i]) < .00001)
    const bladeCenter = new THREE.Box3().setFromObject(blade).getCenter(new THREE.Vector3())
    assert.ok(bladeCenter.distanceTo(shafts[i]) < .01, 'the actual blades stay centered on the engine shaft while rotating')
  })
  const other = new Ju52(body)
  assert.ok(other.propellers.every(pivot => pivot.rotation.x === 0))
  for (let i = 0; i < 120; i++) objects.forEach(object => object.update?.(1 / 30, i / 30))
  assert.equal(objects.filter(object => object instanceof Parachutist).length, 0)
  assert.equal(objects.length, 2, 'only the plane body and its view belong on this stage')
  body.takeHit(10)
  model.update(.1)
  assert.ok(model.smoke)
  assert.equal(other.smoke, undefined)
  body.setState('dead')
  const rotations = model.propellers.map(pivot => pivot.rotation.x)
  model.update(.1)
  assert.deepEqual(model.propellers.map(pivot => pivot.rotation.x), rotations)
})
