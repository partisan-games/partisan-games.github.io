import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import { models } from '/core3d/actor/buildings/TownHouse.js'
import buildTown, { river, roads } from '/scenes/drvar/town.js'
import placeWarTraces from '/scenes/drvar/warTraces.js'
import { models as debrisModels } from '/core3d/actor/buildings/WarDebris.js'

/** The models load from disk, their pictures as blank ones. */
function modelFiles(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  t.mock.method(OBJLoader.prototype, 'loadAsync', async url => new OBJLoader().parse(await readFile(url.slice(1), 'utf8')))
  t.mock.method(MTLLoader.prototype, 'loadAsync', async url => new MTLLoader().parse(await readFile(url.slice(1), 'utf8'), ''))
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 64, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const text = await readFile(url.slice(1), 'utf8')
    const folder = url.slice(1, url.lastIndexOf('/') + 1)
    const gltf = JSON.parse(text)
    // the buffers beside the file, read from disk
    for (const buffer of gltf.buffers ?? []) {
      const bytes = await readFile(folder + buffer.uri)
      buffer.uri = `data:application/octet-stream;base64,${bytes.toString('base64')}`
    }
    return new GLTFLoader().parseAsync(JSON.stringify(gltf), '')
  })
}

test('the town of Drvar stands the same each game, its houses apart and off the open ground round the churchyard', async t => {
  modelFiles(t)
  await requestModels(models)
  const { houses, footprints } = buildTown()
  assert.ok(houses.length > 40, `${houses.length} houses`)
  assert.deepEqual(buildTown().footprints, footprints)
  const overlap = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z
  footprints.forEach((a, i) => footprints.slice(i + 1).forEach(b => assert.ok(!overlap(a, b), 'houses apart')))
  // the yard is 24 by 20 m; the defenders need open ground before every wall
  const open = { min: { x: -22, z: -20 }, max: { x: 22, z: 20 } }
  footprints.forEach(house => assert.ok(!overlap(house, open), 'open ground round the yard'))
  footprints.forEach(house => [river, ...roads].forEach(way => assert.ok(!overlap(house, way), 'off the roads and the river')))
  // whole houses stand back from the fight, ruins round it
  const nearest = footprints.map(({ min, max }) => Math.hypot(Math.max(0, min.x, -max.x), Math.max(0, min.z, -max.z)))
  const ruinsNear = houses.filter((house, i) => nearest[i] < 50)
  assert.ok(ruinsNear.filter(house => house.kind.startsWith('ruin')).length / ruinsNear.length > .6, 'mostly ruins near the yard')
})

test('the wrecks of the bombing lie round the churchyard, the same each game, off the houses and apart', async t => {
  modelFiles(t)
  await requestModels([...models, ...debrisModels])
  const yard = { min: { x: -12.3, z: -10.3 }, max: { x: 12.3, z: 10.3 } }
  const { footprints: houses } = buildTown()
  const taken = [yard, river, ...houses]
  const { meshes, footprints } = placeWarTraces(taken)
  assert.ok(meshes.length > 30)
  assert.ok(footprints.length >= 4, `${footprints.length} wrecks`)
  assert.deepEqual(placeWarTraces(taken).footprints, footprints)
  const overlap = (a, b) => a.min.x < b.max.x && b.min.x < a.max.x && a.min.z < b.max.z && b.min.z < a.max.z
  footprints.forEach((wreck, i) => {
    assert.ok(!taken.some(block => overlap(block, wreck)), 'off the yard, the river and the houses')
    assert.ok(!footprints.slice(i + 1).some(other => overlap(other, wreck)), 'apart')
  })
})
