import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { register } from 'node:module'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { requestModels } from '/core3d/assets/models.js'
import { createPageElements } from './helpers/dom.js'

register('./setup/ammo-node.js', import.meta.url)

test('the distant ridges face up and the rivers stop the tank at their banks', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  const { kraljevo } = await import('/scenes/3d-tank/kraljevo.js')
  const { valley, hillHeight, groundHeight, buildValley, models } = await import('/scenes/3d-tank/valley.js')
  const OriginalImage = globalThis.Image
  globalThis.Image = class extends OriginalImage {
    set src(value) {
      if (value.startsWith('data:image/webp')) this.height = 1
      else super.src = value
      queueMicrotask(() => this.onload?.())
    }
  }
  t.after(() => {
    globalThis.Image = OriginalImage
  })
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 64, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(url.slice(1))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  await requestModels(models)
  const { road, square, trench } = kraljevo
  // The distant ring stays away from the fighting.
  for (let z = road.from; z <= square.z + square.radius + 20; z += 5)
    for (let x = -trench.half - 10; x <= trench.half + 10; x += 5) assert.equal(hillHeight(x, z), 0, `${x}, ${z}`)
  assert.ok(hillHeight(-valley.hills.to, 0) > hillHeight(valley.hills.to, 0), 'the Stolovi in the south rise above the Kotlenik')
  assert.ok(hillHeight(valley.ruzica.x, valley.ruzica.z) > 30, 'the Ružić hill stands behind the tank')
  // both rivers lie off the fighting
  assert.ok(valley.morava.x[0] > trench.half + 20)
  assert.ok(valley.ibar.z[0] > square.z + square.radius + 20)

  const solids = [], scene = new THREE.Scene()
  buildValley({ scene, add: (mesh, mass) => solids.push({ mesh, mass }) })
  const ridges = scene.children[0]
  const { normal } = ridges.geometry.attributes
  for (let i = 0; i < normal.count; i++) assert.ok(normal.getY(i) > 0)
  const willows = scene.getObjectByName('Riverbank willows').children
  assert.ok(willows.length >= 18, `${willows.length} willows`)
  for (const { position: { x, z } } of willows)
    assert.ok(x > valley.morava.x[1] || z > valley.ibar.z[1], 'willows stand on the far banks, off the way of the tank')
  const oaks = scene.getObjectByName('Terrace oaks').children
  assert.ok(oaks.length >= 10)
  for (const { position: { x, y, z } } of oaks) {
    assert.ok(Math.abs(x) > trench.half - 12 && y > 0)
    assert.equal(y, groundHeight(x, z))
    assert.ok(solids.some(({ mesh }) => mesh.position.x === x && mesh.position.z === z && !mesh.visible))
  }
  const walls = solids.map(({ mesh }) => new THREE.Box3().setFromObject(mesh))
  const blocked = (x, z) => walls.some(box => box.containsPoint(new THREE.Vector3(x, 1, z)))
  assert.ok(solids.every(({ mass }) => mass === 0))
  assert.ok(blocked(valley.morava.x[0] - 1, 0), 'the Morava bank by the road')
  assert.ok(blocked(0, valley.ibar.z[0] - 1), 'the Ibar bank beyond the square')
  assert.ok(!blocked(0, square.z), 'the square stays open')
})

test('the approach has raised ground on both sides and matching wheel collision', async t => {
  createPageElements()
  t.mock.method(THREE.TextureLoader.prototype, 'load', () => new THREE.Texture())
  const { buildValleyFloor, groundHeight } = await import('/scenes/3d-tank/valley.js')
  const { default: PhysicsWorld } = await import('/core3d/physics/PhysicsWorld.js')
  const { Ammo } = await import('/core3d/physics/index.js')
  const physics = new PhysicsWorld({ scene: new THREE.Scene() })
  t.after(() => physics.dispose())
  const { ground, trackGround } = buildValleyFloor(physics)
  for (const [x, z, minHeight] of [[0, -40, 0], [-48, -24, 5], [44, -28, 4], [-64, 124, 4], [0, 232, 0]]) {
    const from = physics.own(new Ammo.btVector3(x, 30, z))
    const to = physics.own(new Ammo.btVector3(x, -2, z))
    const callback = physics.own(new Ammo.ClosestRayResultCallback(from, to))
    physics.physicsWorld.rayTest(from, to, callback)
    assert.ok(callback.hasHit())
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 30, z), new THREE.Vector3(0, -1, 0))
    const [{ point }] = ray.intersectObject(ground)
    const patch = trackGround({ x, z })
    assert.ok(patch.geometry.index.count < 150, 'track decals only process nearby triangles')
    assert.equal(ray.intersectObject(patch)[0].point.y, point.y)
    assert.ok(Math.abs(point.y - callback.get_m_hitPointWorld().y()) < .001)
    assert.ok(Math.abs(point.y - groundHeight(x, z)) < .001)
    if (minHeight) assert.ok(point.y > minHeight)
    else assert.equal(point.y, 0)
  }
})
