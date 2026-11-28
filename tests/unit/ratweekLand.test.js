import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import GameSession from '/core/runtime/GameSession.js'
import { trackModel } from '/scenes/ratweek/landscape.js'
import { groundPaint, heightAt, landmarks, towns } from '/scenes/ratweek/route.js'
import { createPageElements } from './helpers/dom.js'

/** The Warplane scene's own steps on a stand-in of the scene, without a renderer. */
async function standIn(t, fields = {}) {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = Object.assign(new THREE.Texture(), { name: url })
    onLoad?.(texture)
    return texture
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 64, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels([trackModel])
  const { default: WarplaneScene } = await import('/scenes/ratweek/Main.js')
  const meshes = new Set()
  return Object.assign(Object.create(WarplaneScene.prototype), {
    travelled: 0, landPieces: [], grounds: [], landEnd: -260, buildings: [], score: 0,
    session: new GameSession(), player: { targets: [] }, ui: { showMessage() {} },
    addMesh: mesh => meshes.add(mesh), scene: { remove: mesh => meshes.delete(mesh) }, add() {},
    meshes, ...fields,
  })
}

test('the land of the route comes at the bomber in pieces, made ahead of it and taken away behind it', async t => {
  const scene = await standIn(t)
  scene.extendLand()
  assert.equal(scene.landPieces[0].group.position.z, 260, 'the first piece begins behind the plane')
  assert.ok(scene.landEnd >= 460)
  const [first] = scene.landPieces
  const { position, uv } = first.ground.geometry.attributes
  const { width, from, to } = groundPaint
  for (const i of [0, 333, position.count - 1]) {
    const x = position.getX(i), u = -260 - position.getZ(i)
    assert.ok(Math.abs(position.getY(i) - heightAt(x, u)) < 1e-4, 'its ground at its height')
    assert.ok(Math.abs(uv.getX(i) - (.5 + x / width)) < 1e-6)
    assert.ok(Math.abs(uv.getY(i) - (1 - (u - from) / (to - from))) < 1e-6)
  }
  const [, second] = scene.landPieces
  assert.equal(uv.getY(0), second.ground.geometry.attributes.uv.getY(position.count - 1), 'adjacent pieces sample the same line')
  const { map } = first.ground.material
  assert.equal(second.ground.material.map, map)
  assert.equal(map.magFilter, THREE.NearestFilter)
  assert.equal(map.minFilter, THREE.LinearMipmapNearestFilter)
  assert.equal(map.anisotropy, 1)
  assert.match(map.name, /terrain\/ratweek-dolina\.webp$/)
  assert.equal((await readFile('.' + map.name)).toString('ascii', 8, 16), 'WEBPVP8L')
  let disposed = 0
  first.dispose = () => disposed++
  for (let step = 0; step < 100; step++) {
    scene.travelled += 10
    scene.moveLand(10)
  }
  assert.equal(disposed, 1, 'a piece left behind is taken away')
  assert.ok(!scene.meshes.has(first.group))
  assert.ok(scene.landPieces.every(piece => piece.to > scene.travelled - 260))
  assert.ok(scene.landEnd >= scene.travelled + 460, 'and the land goes on ahead')
  assert.deepEqual(scene.grounds, scene.landPieces.map(piece => piece.ground))
  assert.ok(scene.landPieces.length <= 9)
})

test('fir trees draw in four batches per piece and keep their shared resources when a piece is removed', async t => {
  const scene = await standIn(t)
  scene.extendLand()
  const [first, second] = scene.landPieces
  const firstFirs = first.group.children.at(-1).children
  const secondFirs = second.group.children.at(-1).children
  assert.equal(firstFirs.length, 4)
  const { count } = firstFirs[0]
  assert.ok(count > 1)
  firstFirs.forEach((mesh, i) => {
    assert.ok(mesh.isInstancedMesh && mesh.castShadow)
    assert.equal(mesh.count, count)
    assert.equal(mesh.instanceColor.count, count)
    assert.equal(mesh.geometry, secondFirs[i].geometry)
    assert.equal(mesh.material, secondFirs[i].material)
  })
  const disposeBatch = t.mock.method(firstFirs[0], 'dispose')
  const disposeGeometry = t.mock.method(firstFirs[0].geometry, 'dispose')
  const disposeMaterial = t.mock.method(firstFirs[0].material, 'dispose')
  first.dispose()
  assert.equal(disposeBatch.mock.callCount(), 1)
  assert.equal(disposeGeometry.mock.callCount(), 0)
  assert.equal(disposeMaterial.mock.callCount(), 0)
})

test('reading the height on the grid matches a vertical ray against the terrain', async t => {
  const scene = await standIn(t)
  scene.extendLand()
  const [piece] = scene.landPieces
  piece.group.position.z -= 37.5
  piece.group.updateMatrixWorld(true)
  const { groundAt } = worldQueries([piece.ground])
  for (const x of [-449, -271.3, -23.64, 0, 46.95, 277.19, 449])
    for (const depth of [.2, 2, 4, 5.7, 13.6, 41.9, 59.9, 99.8]) {
      const z = piece.group.position.z - depth
      assert.ok(Math.abs(piece.heightAt(x, z) - groundAt(x, z, 1000)) < 1e-4, `height at ${x}, ${z}`)
    }
  assert.equal(piece.heightAt(451, piece.group.position.z - 12), undefined)
  assert.equal(piece.heightAt(0, piece.group.position.z - 101), undefined)
})

test('what stands on the route comes into being in its order, once it nears the bomber, where it stands', async t => {
  const house = u => ({ kind: 'house', u, x: 50, width: 9, depth: 9, height: 8, turn: 0, facade: 0 })
  const scene = await standIn(t, { landmarks: [house(100), house(500)], nextLandmark: 0 })
  scene.addLandmarks()
  assert.equal(scene.buildings.length, 1, 'only what is near')
  assert.deepEqual([scene.buildings[0].body.x, scene.buildings[0].body.z], [50, -100])
  assert.equal(scene.player.targets[0], scene.buildings[0].body)
  scene.travelled = 200
  scene.addLandmarks()
  assert.equal(scene.buildings[1].body.z, -300)
})

test('the painted streets use the seeded lanes left between the houses', () => {
  const streetsByTown = new Map()
  const reported = landmarks(streetsByTown)
  assert.deepEqual(reported, landmarks())
  for (const town of towns) {
    const { streets, width } = streetsByTown.get(town.name)
    assert.ok(streets.length > 0)
    const houses = reported.filter(({ kind, u }) => kind === 'house' && u >= town.from && u <= town.to)
    for (const house of houses)
      assert.ok(streets.every(u => Math.abs(house.u - u) >= width / 2 + house.radius))
  }
})

test('a destroyed factory, bridge or train scores, a destroyed house costs a point, and a station neither', async t => {
  const scene = await standIn(t)
  scene.buildings = ['factory', 'bridge', 'train', 'civil', 'building'].map(kind => ({ body: { kind, alive: false } }))
  scene.countDestroyed()
  assert.equal(scene.score, 2)
  scene.countDestroyed()
  assert.equal(scene.score, 2, 'each counts once')
})
