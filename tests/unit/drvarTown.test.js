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
import buildTown, { overlap, river, roads } from '/scenes/drvar/town.js'
import placeWarTraces from '/scenes/drvar/warTraces.js'
import { openingPost, placeRuins, placeTrees, ridgeTrees, treeModels } from '/scenes/drvar/scenery.js'
import { models as ruinModels } from '/core3d/actor/buildings/DrvarProp.js'
import Church, { models as churchModels } from '/core3d/actor/buildings/Church.js'
import { models as debrisModels } from '/core3d/actor/buildings/WarDebris.js'
import { createCave, createTerrain, createUnac, craters, groundAt, landHeight } from '/scenes/drvar/terrain.js'

/** The models load from disk, their pictures as blank ones. */
function modelFiles(t) {
  const OriginalImage = globalThis.Image
  globalThis.Image = class extends OriginalImage {
    set src(value) {
      if (value.startsWith('data:image/webp')) {
        this.height = 1
        queueMicrotask(() => this.onload?.())
        return
      }
      super.src = value
      queueMicrotask(() => this.onload?.())
    }
  }
  t.after(() => {
    globalThis.Image = OriginalImage
  })
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
    if (url.endsWith('.glb')) {
      const bytes = await readFile(url.slice(1))
      return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
    }
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
  assert.ok(meshes.length >= 30)
  assert.ok(footprints.length >= 4, `${footprints.length} wrecks`)
  assert.deepEqual(placeWarTraces(taken).footprints, footprints)
  footprints.forEach((wreck, i) => {
    assert.ok(!taken.some(block => overlap(block, wreck)), 'off the yard, the river and the houses')
    assert.ok(!footprints.slice(i + 1).some(other => overlap(other, wreck)), 'apart')
  })
})

test('separate ruins and real oaks frame the west approach without blocking the road', async t => {
  modelFiles(t)
  await requestModels([...models, ...ruinModels, ...treeModels, ...churchModels])
  const ruins = placeRuins()
  const ruinFootprints = ruins.map(({ footprint }) => footprint)
  const town = buildTown(undefined, ruinFootprints)
  const westRoad = { min: { x: -52, z: -3 }, max: { x: -13, z: 3 } }
  assert.equal(ruins.length, 5)
  for (const { mesh, footprint } of ruins) {
    assert.ok(Math.abs(footprint.min.y - groundAt(mesh.position.x, mesh.position.z)) < .001 && footprint.height > 2 && footprint.height < 6)
    assert.ok(![westRoad, ...town.footprints].some(plot => overlap(plot, footprint)))
    let mapped = false
    mesh.traverse(part => {
      if (part.material?.map) mapped = true
    })
    assert.ok(mapped, 'the ruin keeps its embedded texture')
  }

  const church = new Church().mesh
  church.rotation.y = Math.PI / 2
  const churchBox = new THREE.Box3().setFromObject(church, true)
  const taken = [westRoad, river, ...roads, ...town.footprints, ...ruinFootprints]
  const trees = placeTrees(taken, churchBox)
  assert.equal(trees.filter(tree => tree.inside).length, 2)
  assert.ok(trees.filter(tree => !tree.inside).length >= 4)
  for (const { mesh, footprint, inside } of trees) {
    assert.ok(!(inside ? [churchBox] : taken).some(plot => overlap(plot, footprint)))
    const box = new THREE.Box3().setFromObject(mesh, true)
    assert.ok(Math.abs(box.min.y - footprint.base) < .001 && Math.abs(box.max.y - box.min.y - (inside ? 10 : 7)) < .001)
    if (inside) {
      let leaves
      mesh.traverse(part => {
        if (part.isMesh && part.material.alphaTest > 0) leaves = part.material
      })
      assert.ok(leaves?.map && leaves.depthWrite && !leaves.transparent)
    }
  }
  const camera = new THREE.Vector3(-10, 5.2, 6.5)
  const scenery = [...ruins, ...trees].map(({ mesh }) => mesh)
  for (const x of [-18, -24, -30, -36]) {
    const direction = new THREE.Vector3(x, 1.45, 0).sub(camera)
    const ray = new THREE.Raycaster(camera, direction.clone().normalize(), 0, direction.length())
    assert.equal(ray.intersectObjects(scenery).length, 0, `visible relief ranks at x=${x}`)
  }

  const opening = new THREE.PerspectiveCamera(75, 4 / 3, .1, 1000)
  opening.position.set(openingPost.x * 11.45, 1.78 * .82, openingPost.z * 9.45)
  opening.rotation.set(openingPost.pitch, openingPost.yaw - Math.PI / 2, 0, 'YXZ')
  opening.updateMatrixWorld(true)
  assert.ok(!churchBox.clone().expandByScalar(.2).containsPoint(opening.position), 'the player starts clear of the church')
  const gable = new THREE.Vector3(37.2, 3.9, -10.8)
  const gunner = new THREE.Vector3(10.7, 1.2, -3.48)
  for (const point of [gable, gunner]) {
    const screen = point.clone().project(opening)
    assert.ok(Math.abs(screen.x) < .9 && Math.abs(screen.y) < .9, 'the gunner and gable fit the opening view')
  }
  const towardGable = gable.clone().sub(opening.position)
  const gableView = new THREE.Raycaster(opening.position, towardGable.clone().normalize(), 0, towardGable.length())
  const visibleScenery = [church, ...scenery]
  visibleScenery.forEach(mesh => mesh.updateMatrixWorld(true))
  assert.equal(gableView.intersectObjects(visibleScenery.filter(mesh => mesh !== ruins[3].mesh)).length, 0, 'open view to the gable')

  const caveEye = new THREE.Vector3(11, 1.6, -5)
  const caveFace = new THREE.Vector3(129, landHeight(129, -132) + 3.1, -132)
  const towardCave = caveFace.sub(caveEye)
  const line = new THREE.Raycaster(caveEye, towardCave.clone().normalize(), 0, towardCave.length())
  town.houses.forEach(({ mesh }) => mesh.updateMatrixWorld(true))
  assert.equal(line.intersectObjects(town.houses.map(house => house.mesh)).length, 0, 'the cave is visible from the east wall')
  const distantTrees = ridgeTrees()
  t.after(() => distantTrees.forEach(mesh => mesh.dispose()))
  assert.equal(distantTrees.length, 2)
  assert.ok(distantTrees.every(mesh => mesh.count >= 20 && !mesh.castShadow), 'distant oaks share two batches')
})

test('the Unac runs below the crossing, craters cut into the rendered ground, and the landmarks sit above it', async t => {
  modelFiles(t)
  const terrain = createTerrain()
  const [water, deck] = createUnac()
  const cave = createCave()
  const downAt = (x, z, mesh) => new THREE.Raycaster(new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0),
    0, 80).intersectObject(mesh)[0]?.point.y
  assert.ok(downAt(101, 0, terrain) < downAt(101, 0, water))
  assert.ok(downAt(101, -150, deck) > 0)
  assert.ok(Math.abs(downAt(101, -150, deck) - groundAt(101, -150) - .04) < .001)
  assert.ok(downAt(-147, 28, terrain) > 20)
  for (const { x, z, depth } of craters) assert.ok(Math.abs(downAt(x, z, terrain) + depth) < .001)
  const caveBox = new THREE.Box3().setFromObject(cave)
  assert.ok(caveBox.max.y > landHeight(129, -132) + 5)
  assert.equal(cave.geometry.groups.length, 2)
})
