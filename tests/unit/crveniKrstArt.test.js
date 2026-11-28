import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createCampProp, createCampStudy, campModels } from '/core3d/actor/buildings/CampProp.js'
import campLayout from '/scenes/crveni-krst/campLayout.js'
import { createCampGround, createCampHorizon } from '/scenes/crveni-krst/campTerrain.js'
import { createPageElements } from './helpers/dom.js'

const directory = 'assets/models/building/crveni-krst/'
const bufferOf = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)

test('snow compaction follows open camp links and foundations on the existing flat ground', () => {
  const layout = campLayout(() => .5)
  const { maze, rooms, storehouse } = layout
  const ground = createCampGround(layout)
  const { data, width } = ground.material.map.image
  const centre = cell => maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1)
  const tone = (x, z) => data[(Math.floor((.5 - z / 130) * width) * width + Math.floor((.5 + x / 130) * width)) * 4 + 1]
  const passes = rooms.flatMap(room => [room.east, room.south].filter(Boolean).map(next => ({ room, next })))
  const toneBetween = ({ room, next }) => {
    const a = centre(room), b = centre(next)
    return tone((a.x + b.x) / 2, (a.z + b.z) / 2)
  }
  const open = passes.find(({ room, next }) => room.linked(next))
  const closed = passes.find(({ room, next }) => rooms.includes(next) && !room.linked(next))
  assert.ok(toneBetween(open) < toneBetween(closed) - 8)
  assert.ok(tone(storehouse.x, storehouse.z - storehouse.depth / 2 - .1) < tone(storehouse.x, storehouse.z - 8) - 12)
  assert.equal(ground.geometry.index.count, 6)
  assert.ok(ground.receiveShadow)
  const horizon = createCampHorizon()
  assert.equal(horizon.mapping, THREE.EquirectangularReflectionMapping)
  assert.equal(horizon.image.data.length, 512 * 256 * 4)
})

function textures(t) {
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    assert.ok(url.endsWith('/materials.png'), 'every bitmap uses the same real atlas')
    queueMicrotask(() => onLoad({ width: 1254, height: 1254 }))
    return {}
  })
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    assert.ok(url.endsWith('/materials.png'), 'every asset uses the same real atlas')
    const texture = new THREE.Texture()
    texture.image = { width: 1254, height: 1254 }
    queueMicrotask(() => onLoad(texture))
    return texture
  })
}

function modelLoading(t) {
  textures(t)
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bufferOf(bytes), '/assets/models/building/crveni-krst/')
  })
}

test('all seven camp models have real triangles, bounded geometry and the shared texture', async t => {
  textures(t)
  const files = Object.values(campModels).map(({ file }) => file.split('/').pop())
  assert.equal(files.length, 7)
  for (const file of files) {
    const bytes = await readFile(directory + file)
    const document = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)))
    assert.equal(bytes.readUInt32LE(8), bytes.length)
    for (const image of document.images ?? []) assert.equal(image.uri, 'materials.png')
    assert.equal(document.animations, undefined)
    assert.equal(document.skins, undefined)
    const { scene } = await new GLTFLoader().parseAsync(bufferOf(bytes), '/assets/models/building/crveni-krst/')
    scene.updateMatrixWorld(true)
    let triangles = 0, meshes = 0
    scene.traverse(part => {
      if (!part.isMesh) return
      meshes++
      if (['plaster', 'roof', 'wood', 'steel'].includes(part.material.name))
        assert.ok(part.material.map, file + ': texture was assigned')
      triangles += (part.geometry.index?.count ?? part.geometry.attributes.position.count) / 3
      for (const name of ['position', 'normal', 'uv']) {
        assert.ok(part.geometry.attributes[name], file + ': ' + name)
        assert.ok(part.geometry.attributes[name].array.every(Number.isFinite))
      }
    })
    const box = new THREE.Box3().setFromObject(scene)
    assert.ok(box.min.y > -.03 && box.min.y < .03, file + ': grounded')
    assert.ok(box.max.y < 10 && box.max.y > 2, file + ': estimated human scale')
    assert.ok(triangles > 0 && triangles < 6500 && meshes <= 8, file + ': real geometry within the web budget')
  }
})

test('porous wire really has ray gaps, while a full timber screen hides the same line of sight', async t => {
  modelLoading(t)
  const wire = await createCampProp('fence-straight')
  const cover = await createCampProp('timber-screen')
  wire.mesh.updateMatrixWorld(true)
  cover.mesh.updateMatrixWorld(true)
  const ray = new THREE.Raycaster(new THREE.Vector3(1.25, 1, 2), new THREE.Vector3(0, 0, -1), 0, 4)
  assert.equal(ray.intersectObject(wire.mesh, true).length, 0)
  assert.ok(ray.intersectObject(cover.mesh, true).length > 0)
  assert.equal(campModels['fence-straight'].scale, 1, 'module spacing is never fitted to model height')
  assert.equal(campModels['fence-straight'].castShadow, false)
})

test('gates pivot horizontally and reflector copies keep an independent target and light appearance', async t => {
  modelLoading(t)
  const gate = await createCampProp('gate')
  const secondGate = await createCampProp('gate')
  assert.deepEqual(gate.states, ['closed', 'open'])
  gate.setState('open')
  gate.update(1)
  assert.ok(gate.mesh.getObjectByName('GateLeft').rotation.y > 1.5)
  assert.ok(gate.mesh.getObjectByName('GateRight').rotation.y < -1.5)
  assert.equal(secondGate.mesh.getObjectByName('GateLeft').rotation.y, 0)
  const box = new THREE.Box3().setFromObject(gate.mesh)
  assert.ok(box.max.y < 2.81 && box.min.y > -.03)
  gate.setState('closed')
  gate.update(1)
  assert.equal(gate.gateFraction, 0)
  const tower = await createCampProp('watchtower')
  const second = await createCampProp('watchtower')
  assert.equal(tower.lights.length, 1)
  assert.equal(tower.lights[0].target.parent, tower.lights[0])
  assert.notEqual(tower.lights[0].target, second.lights[0].target)
  tower.mesh.updateMatrixWorld(true)
  const targetBefore = tower.lights[0].target.getWorldPosition(new THREE.Vector3()).clone()
  assert.deepEqual(tower.states, ['on', 'off', 'sweeping'])
  tower.setState('sweeping')
  tower.update(1)
  tower.mesh.updateMatrixWorld(true)
  assert.ok(tower.lights[0].target.getWorldPosition(new THREE.Vector3()).distanceTo(targetBefore) > .1)
  tower.setState('off')
  assert.equal(tower.lights[0].visible, false)
  assert.equal(second.lights[0].visible, true)
  assert.equal(tower.lenses[0].emissiveIntensity, 0)
  assert.equal(second.lenses[0].emissiveIntensity, 1)
  assert.equal(tower.lights[0].castShadow, false)
  const study = await createCampStudy()
  assert.equal(study.mesh.children.length, 8)
  assert.equal(study.gates.length, 2)
  assert.equal(study.lights.length, 1)
  study.setState('open')
  study.setState('sweeping')
  assert.equal(study.gateOpen, true, 'the searchlight state leaves the gate as it is')
})

test('each camp catalog entry creates its real prop and every state it offers runs', async t => {
  createPageElements()
  modelLoading(t)
  const campModule = await import('/core3d/actor/buildings/CampProp.js')
  const props = (await import('/catalog/stories/props3d.js')).props.filter(story => story.block === campModule)
  assert.equal(props.length, 8)
  assert.equal(new Set(props.map(story => story.id)).size, 8)
  for (const story of props) {
    const stage = { children: [], add(block) {
      this.children.push(block)
    } }
    const block = await story.create(stage)
    assert.ok(stage.children.includes(block), story.id)
    assert.ok(new THREE.Box3().setFromObject(block.mesh).max.y > 2)
    for (const state of block.states) block.setState(state)
    block.update(.1)
    assert.ok(block.mesh.children.length, story.id)
  }
})
