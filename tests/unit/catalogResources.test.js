import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { loadModel } from '/core3d/loaders.js'
import { models as bigfootModels } from '/core3d/actor/derived/fantasy/Bigfoot.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import optimized from '/core/actor/optimizedImages.js'
import { canonicalImageSource, runtimeImageSource } from '/core/actor/imageSources.js'
import { wreckFor } from '/core/actor/wreckView.js'
import wreckArt from '/core/actor/wreckArt.js'
import { loadImages } from './helpers/images.js'

test('optimized downloads preserve canonical atlas identity, URL prefixes and query strings', () => {
  for (const [source, runtime] of Object.entries(optimized))
    for (const prefix of ['', '/assets/images/', 'https://example.org/assets/images/']) {
      const original = prefix + source + '?v=2#frame'
      const prepared = prefix + runtime + '?v=2#frame'
      assert.equal(runtimeImageSource(original), prepared)
      assert.equal(canonicalImageSource(prepared), original)
      assert.equal(runtimeImageSource(prepared), prepared)
    }
  for (const source of [undefined, '', 'unknown.png', '/assets/images/ui/loader.gif'])
    assert.equal(runtimeImageSource(source), source)
})

test('parallel catalog loading retains fitted Bigfoot death motion alongside its local animations', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const serial = await loadModel(structuredClone(bigfootModels[0]))
  const parallel = await loadModel(structuredClone(bigfootModels[0]), { parallelAnimations: true })
  const motions = mesh => mesh.userData.animations.map(clip => ({ name: clip.name, duration: clip.duration,
    tracks: clip.tracks.map(track => ({ name: track.name, values: track.values, times: track.times })) }))
  assert.deepEqual(motions(parallel), motions(serial))
  assert.equal(parallel.userData.animations.length, 4)
  const death = parallel.userData.animations.find(clip => clip.name === 'Falling Back Death')
  assert.ok(death.tracks.length > 10)
})

test('live optimized images still select and share their original wreck', t => {
  loadImages(t)
  let checked = 0
  for (const [source, descriptor] of Object.entries(wreckArt)) {
    if (!optimized[source]) continue
    const wreck = wreckFor('/assets/images/' + runtimeImageSource(source))
    assert.ok(wreck)
    assert.equal(wreck, wreckFor(source))
    assert.equal(wreck.src, '/assets/images/' + runtimeImageSource(descriptor.src))
    checked++
  }
  assert.ok(checked > 10)
})

test('other catalog FBX models keep every triangle, material, vertex attribute and skeleton after regrouping', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const candidates = [
    ['character/iron-giant/model.fbx', 286, 51],
    ['character/sorceress/model.fbx', 32, 10],
    ['character/skeleton/model.fbx', 23, 2],
    ['weapon/mg-42/model.fbx', 68, 11],
    ['weapon/rifle.fbx', 5, 2],
  ]
  const faces = geometry => geometry.groups.flatMap(group => {
    const result = []
    for (let i = group.start; i < group.start + group.count; i += 3)
      result.push([group.materialIndex, ...[0, 1, 2].map(n => geometry.index ? geometry.index.getX(i + n) : i + n)].join(':'))
    return result
  }).sort()
  for (const [file, before, after] of candidates) {
    const bytes = await readFile('assets/models/' + file)
    const model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    const meshes = []
    model.traverse(part => {
      if (part.isMesh) meshes.push(part)
    })
    const original = meshes.map(mesh => ({ geometry: mesh.geometry, groups: structuredClone(mesh.geometry.groups),
      faces: faces(mesh.geometry), material: mesh.material, skeleton: mesh.skeleton }))
    const groups = () => meshes.reduce((sum, mesh) => sum + Math.max(1, mesh.geometry.groups.length), 0)
    assert.equal(groups(), before, file)
    optimizeGeometry(model)
    assert.equal(groups(), after, file)
    meshes.forEach((mesh, i) => {
      const source = original[i]
      assert.equal(mesh.skeleton, source.skeleton)
      assert.equal(mesh.material, source.material)
      assert.deepEqual(faces(mesh.geometry), source.faces, file)
      assert.deepEqual(source.geometry.groups, source.groups, 'source geometry remains reusable')
      for (const [name, attribute] of Object.entries(source.geometry.attributes))
        assert.deepEqual(mesh.geometry.attributes[name].array, attribute.array, file + ': ' + name)
    })
  }
})
