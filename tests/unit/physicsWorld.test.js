import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createPageElements } from './helpers/dom.js'

register('./setup/ammo-node.js', import.meta.url)
let PhysicsWorld
before(async() => {
  createPageElements()
  PhysicsWorld = (await import('/core3d/physics/PhysicsWorld.js')).default
})

test('what follows a body sees it after the step, every update, until it stops following', () => {
  const world = new PhysicsWorld()
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.5))
  ball.position.y = 10
  world.add(ball, 1)
  const seen = []
  const stop = world.afterStep(dt => seen.push([dt, ball.position.y]))
  world.update(.5)
  assert.equal(seen.length, 1)
  assert.equal(seen[0][0], .5)
  assert.ok(seen[0][1] < 10, `it sees where the step left the ball: ${seen[0][1]}`)
  stop()
  world.update(.5)
  assert.equal(seen.length, 1, 'it no longer follows')
  world.dispose()
})

test('a falling body moves smoothly at a frame rate that is not the step rate: no frame stands still', () => {
  const world = new PhysicsWorld()
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.5))
  ball.position.y = 50
  world.add(ball, 1)
  // 1/60 s steps drawn at 75 frames a second: some frames hold no whole step
  const heights = []
  for (let i = 0; i < 30; i++) {
    world.update(1 / 75)
    heights.push(ball.position.y)
  }
  for (let i = 10; i < heights.length; i++) assert.ok(heights[i] < heights[i - 1], `frame ${i} moved`)
  world.dispose()
})

test('a driven vehicle\'s mesh moves on every frame, between the fixed steps, as its wheels do', async() => {
  const { default: Vehicle } = await import('/core3d/physics/Vehicle.js')
  const world = new PhysicsWorld()
  const ground = new THREE.Mesh(new THREE.BoxGeometry(400, 1, 400))
  ground.position.y = -.5
  world.add(ground, 0)
  const vehicle = new Vehicle({ world, mesh: new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4)), pos: { x: 0, y: 1, z: 0 } })
  const along = []
  for (let i = 0; i < 150; i++) {
    vehicle.forward()
    vehicle.updatePhysics()
    world.update(1 / 75)
    along.push(vehicle.mesh.position.z)
  }
  for (let i = 75; i < along.length; i++) assert.ok(along[i] > along[i - 1], `frame ${i} moved: ${along[i - 1]} → ${along[i]}`)
  vehicle.end()
  world.dispose()
})

test('the Kraljevo Hotchkiss scrolls individual tracks after each physics step', async t => {
  t.mock.method(THREE.ImageBitmapLoader.prototype, 'load', (_url, onLoad) => {
    queueMicrotask(() => onLoad({ width: 32, height: 64 }))
    return {}
  })
  t.mock.method(GLTFLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile('.' + decodeURI(url))
    return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const { default: Tank, models } = await import('/core3d/physics/Tank.js')
  const { requestModels, loadedModel } = await import('/core3d/assets/models.js')
  await requestModels(models)
  const world = new PhysicsWorld()
  const ground = new THREE.Mesh(new THREE.BoxGeometry(400, 1, 400))
  ground.position.y = -.5
  world.add(ground, 0)
  const make = x => new Tank({ world, pos: { x, y: 1, z: 0 } })
  const tank = make(0)
  const other = make(10)
  t.after(() => {
    tank.end()
    other.end()
    world.dispose()
  })
  const maps = mesh => ['track-left', 'track-right'].map(name => mesh.getObjectByName(name).material.map)
  const phases = tank => maps(tank.mesh).map(map => map.offset.x)
  const delta = (after, before) => THREE.MathUtils.euclideanModulo(after - before + .5, 1) - .5
  const start = phases(tank)
  const nearStart = tank => phases(tank).every((phase, i) => Math.abs(delta(phase, start[i])) < .02)
  for (let i = 0; i < 90; i++) world.update(1 / 75)
  assert.ok(nearStart(tank), 'the small horizontal physics jitter is below a visible change of phase')
  const step = (tank, direction, turn = 0) => {
    const before = phases(tank)
    tank[direction]()
    tank.vehicleSteering = turn
    tank.updatePhysics()
    world.update(1 / 75)
    return phases(tank).map((after, i) => delta(after, before[i]))
  }
  let forward, backward, turning
  for (let i = 0; i < 80; i++) forward = step(tank, 'forward')
  assert.ok(forward.every(delta => delta > 0), String(forward))
  assert.ok(nearStart(other), 'another tank never shares the first tank’s phase')
  for (let i = 0; i < 45; i++) turning = step(tank, 'forward', .32)
  assert.ok(Math.abs(turning[0] - turning[1]) > .005, String(turning))
  for (let i = 0; i < 80; i++) backward = step(other, 'backward')
  assert.ok(backward.every(delta => delta < 0), String(backward))
  assert.deepEqual(maps(loadedModel(models[0])).map(map => map.offset.x), start, 'the cached model stays pristine')
})

test('a vehicle that fires on Space has a fire button for a touch screen; one that brakes on it has none', async() => {
  const { default: Vehicle } = await import('/core3d/physics/Vehicle.js')
  const world = new PhysicsWorld()
  const make = attackKey => new Vehicle({ world, mesh: new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4)), pos: { x: 0, y: 1, z: 0 }, attackKey })
  const gun = make('Space')
  const button = document.querySelector('.game-btn')
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 }))
  assert.ok(gun.input.attack)
  gun.end()
  const car = make()
  assert.equal(document.querySelector('.game-btn'), null)
  car.end()
  world.dispose()
})
