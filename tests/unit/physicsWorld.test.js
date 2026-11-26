import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import * as THREE from 'three'
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
