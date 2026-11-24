import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Transport from '/core/gameplay/bodies/aircraft/Transport.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import { createPageElements } from './helpers/dom.js'

test('optimized Ju 52 preserves world geometry and UVs while batching materials and keeping propellers', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad(texture))
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 1024, height: 1024 }))
    return {}
  })
  const load = async name => {
    const bytes = await readFile('assets/models/aircraft/ju52/' + name + '.glb')
    const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
    assert.ok(document.images.every(image => image.bufferView !== undefined && !image.uri))
    const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    scene.updateMatrixWorld(true)
    const triangles = [], point = new THREE.Vector3()
    let propellers = 0
    scene.traverse(part => {
      if (!part.isMesh) return
      if (part.name.toLowerCase().includes('propeller')) propellers++
      if (name === 'model' && part.name.toLowerCase().includes('propeller')) {
        const axle = new THREE.Vector3(...part.userData.axle)
        part.geometry.computeBoundingBox()
        assert.ok(part.geometry.boundingBox.containsPoint(axle), 'shaft must be inside its own propeller geometry, in glTF local coordinates')
        assert.ok(axle.distanceTo(part.geometry.boundingBox.getCenter(new THREE.Vector3())) < .05,
          'the original two-blade propellers are symmetric about their shafts')
      }
      const { position, uv } = part.geometry.attributes
      const count = part.geometry.index?.count ?? position.count
      for (let i = 0; i < count; i += 3) {
        const corners = []
        for (let j = 0; j < 3; j++) {
          const index = part.geometry.index?.getX(i + j) ?? i + j
          point.fromBufferAttribute(position, index).applyMatrix4(part.matrixWorld)
          corners.push({ position: point.toArray(), uv: [uv.getX(index), uv.getY(index)] })
        }
        triangles.push(corners)
      }
    })
    return { document, triangles, propellers }
  }
  const source = await load('source'), optimized = await load('model')
  assert.equal(optimized.triangles.length, 9061)
  // Batching bakes transforms through float32. Compare by distance, rather than
  // rounding positions: two equivalent points can straddle a rounding boundary.
  const key = triangle => triangle.map(corner => corner.uv.map(n => n.toFixed(4)).join(',')).sort().join('|')
  const pending = new Map()
  for (const triangle of source.triangles) {
    const id = key(triangle)
    if (!pending.has(id)) pending.set(id, [])
    pending.get(id).push(triangle)
  }
  const close = (a, b, tolerance) => a.every((n, i) => Math.abs(n - b[i]) < tolerance)
  for (const triangle of optimized.triangles) {
    const candidates = pending.get(key(triangle)) ?? []
    const index = candidates.findIndex(candidate => triangle.every(corner =>
      candidate.some(other => close(corner.position, other.position, .001) && close(corner.uv, other.uv, .000001))))
    assert.ok(index >= 0, 'every optimized triangle retains its original positions and UV mapping')
    candidates.splice(index, 1)
  }
  assert.ok([...pending.values()].every(candidates => !candidates.length))
  assert.equal(optimized.propellers, 3)
  assert.equal(optimized.document.materials.length, 5)
  assert.equal(optimized.document.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0), 12)
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
