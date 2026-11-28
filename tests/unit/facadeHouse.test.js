import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import FacadeHouse, { facades } from '/core3d/actor/buildings/FacadeHouse.js'
import { createRuin } from '/core3d/city.js'
import { buildKraljevo, kraljevo, models } from '/scenes/3d-tank/kraljevo.js'

test('Kraljevo uses the pixel facade maps and Warplane shares the ruined front', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', url => Object.assign(new THREE.Texture(), { name: url }))
  const files = new Set()
  for (const [facade, { file }] of Object.entries(facades)) {
    const { mesh } = new FacadeHouse({ facade })
    const front = mesh.material[4].map.name
    const back = mesh.material[5].map.name
    assert.ok(front.endsWith(file))
    assert.ok(back.endsWith('/kraljevo-pixel/building-back.webp'))
    assert.equal(mesh.material[4].map.magFilter, THREE.NearestFilter)
    assert.equal(mesh.material[5].map.minFilter, THREE.NearestMipmapLinearFilter)
    files.add(front)
    files.add(back)
    assert.equal(mesh.geometry.attributes.position.count, 24)
  }
  assert.equal(files.size, 5)
  assert.ok(createRuin().material[4].map.name.endsWith(facades.ruin.file))
  for (const file of files) assert.equal((await readFile('.' + file)).toString('ascii', 8, 12), 'WEBP')
})

test('the houses of Kraljevo stand on the ground with their facades to the street and the square', async t => {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = Object.assign(new THREE.Texture(), { name: url })
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  const placeholder = () => new THREE.Mesh(new THREE.BoxGeometry())
  t.mock.method(FBXLoader.prototype, 'loadAsync', async() => placeholder())
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async() => ({ scene: placeholder(), animations: [] }))
  t.mock.method(OBJLoader.prototype, 'loadAsync', async() => placeholder())
  t.mock.method(MTLLoader.prototype, 'loadAsync', async() => new MTLLoader().parse('', ''))
  await requestModels(models)
  const scene = new THREE.Scene()
  await buildKraljevo({ scene, add: mesh => scene.add(mesh) })

  const fronts = Object.values(facades).map(({ file }) => file)
  const houses = scene.children.filter(mesh => Array.isArray(mesh.material))
    .filter(mesh => fronts.some(file => mesh.material[4].map?.name.endsWith(file)))
  assert.ok(houses.length > 4)

  const { square } = kraljevo
  for (const house of houses) {
    assert.ok(Math.abs(new THREE.Box3().setFromObject(house).min.y) < 1e-6)
    const front = new THREE.Vector3(0, 0, 1).applyQuaternion(house.quaternion)
    const onSquare = Math.abs(house.position.z - square.z) <= square.radius + 9
    const target = onSquare ? new THREE.Vector3(0, house.position.y, square.z) : new THREE.Vector3(0, house.position.y, house.position.z)
    assert.ok(front.dot(target.sub(house.position).normalize()) > .99, `${house.position.x}, ${house.position.z}`)
  }
})
