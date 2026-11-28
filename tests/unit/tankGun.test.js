import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'
import Character from '/core/gameplay/bodies/characters/Character.js'

register('./setup/ammo-node.js', import.meta.url)
let PhysicsWorld, TankGun, tankGun
before(async() => {
  createPageElements()
  PhysicsWorld = (await import('/core3d/physics/PhysicsWorld.js')).default
  ;({ default: TankGun, tankGun } = await import('/core3d/physics/TankGun.js'))
})

/** A tank facing +z at the origin, a crate of a barricade ahead, a fixed ground and a soldier, in a physics world. */
function range(soldierAt) {
  const world = new PhysicsWorld()
  const ground = new THREE.Mesh(new THREE.BoxGeometry(300, 1, 300))
  ground.position.y = -.5
  world.add(ground, 0)
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
  crate.position.set(0, 1, 20)
  world.add(crate, 20)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4))
  mesh.position.y = .75
  const tank = { mesh, height: 1.5, depth: 4, input: {} }
  const soldier = new Character({ ...soldierAt, size: { length: .5, height: 1.8, width: .5 } })
  soldier.y = .9
  const clock = new GameClock()
  const gun = new TankGun({ tank, world, targets: [soldier], clock })
  return { world, crate, tank, soldier, clock, gun }
}

test('a shell bursts on the barricade ahead, throws its crate and hurts a soldier beside it', () => {
  const { world, crate, soldier, gun } = range({ x: 1.5, z: 19 })
  assert.equal(gun.fire(), true)
  const { duration } = gun.lastShot
  gun.update(duration / 2)
  assert.equal(gun.blasts, 0)
  assert.equal(soldier.hitsTaken, 0)
  gun.update(duration / 2)
  assert.ok(gun.lastBlast.z > 15 && gun.lastBlast.z < 20, `it bursts at the crate: ${gun.lastBlast.z}`)
  assert.ok(soldier.hitsTaken > 0, 'the soldier near the burst is hurt')
  const velocity = crate.userData.body.getLinearVelocity()
  assert.ok(velocity.z() > 1 && velocity.y() > 0, 'the crate is thrown away from the burst and up')
  gun.update(1)
  assert.equal(gun.blasts, 1)
  assert.ok(gun.lastShot.age > 1, 'the muzzle smoke can keep fading after impact')
  world.dispose()
})

test('a shell that strikes the body of a gun destroys the gun, though its middle lies behind the face struck', () => {
  const { world, gun } = range({ x: 30, z: 0 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 4))
  body.position.set(0, .65, 12)
  world.add(body, 0)
  const enemyGun = { x: 0, y: 1.2, z: 12, mesh: body, alive: true, takeHit(damage) {
    this.alive = damage < 100
  } }
  gun.targets.push(enemyGun)
  gun.fire()
  gun.update(gun.lastShot.duration)
  assert.equal(enemyGun.alive, false)
  world.dispose()
})

test('a German gun the tank runs into is crushed and gives way, and nothing else crushes it', async() => {
  const { default: EnemyGun } = await import('/core3d/actor/artillery/EnemyGun.js')
  const world = new PhysicsWorld()
  const ground = new THREE.Mesh(new THREE.BoxGeometry(300, 1, 300))
  ground.position.y = -.5
  world.add(ground, 0)
  const solid = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 4))
  solid.position.set(0, .65, 6)
  world.add(solid, 0)
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1))
  crate.position.set(0, 1.9, 7)
  world.add(crate, 20)
  const tankMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4))
  tankMesh.position.set(0, .8, -2)
  world.add(tankMesh, 1000)
  const target = { x: 0, y: 1, z: 500, alive: true, takeHit() {} }
  const gun = new EnemyGun({ x: 0, z: 6, target, world, mesh: solid, clock: new GameClock() })
  gun.crushedBy(tankMesh.userData.body)
  for (let i = 0; i < 30; i++) {
    world.update(1 / 30)
    gun.update()
  }
  assert.ok(gun.alive, 'a crate falling on it does not crush it')
  const { Ammo } = await import('/core3d/physics/index.js')
  const forward = new Ammo.btVector3(0, 0, 6)
  tankMesh.userData.body.setLinearVelocity(forward)
  Ammo.destroy(forward)
  for (let i = 0; i < 60 && gun.alive; i++) {
    world.update(1 / 30)
    gun.update()
  }
  assert.equal(gun.state, 'dead')
  assert.ok(!world.rigidBodies.includes(solid), 'the tank rolls on over it')
  world.dispose()
})

test('a weak charge strikes a low wall near on the way, and a full one flies over it', () => {
  const { world, crate, tank, gun } = range({ x: 30, z: 0 })
  world.remove(crate)
  tank.muzzle = new THREE.Vector3(0, 1.65, 2)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 1.1, 1))
  wall.position.set(0, .55, 15)
  world.add(wall, 160)
  const burstAt = range => {
    gun.reload.start(0)
    gun.lastShot = null
    gun.fire(range)
    gun.update(gun.lastShot.duration)
    return gun.lastBlast.z
  }
  assert.ok(Math.abs(burstAt(20) - 14.5) < .6, 'the weak shot bursts on the wall')
  tank.input.attack = true
  gun.update(0)
  const weakLay = gun.lay
  gun.update(10)
  assert.ok(weakLay > gun.lay && gun.lay > 0, `the barrel goes down most for the weakest charge: ${weakLay}, ${gun.lay}`)
  tank.input.attack = false
  gun.update(0)
  assert.equal(gun.lay, 0, 'and up again once fired')
  assert.ok(burstAt(120) > 100, 'the full shot flies over it')
  world.dispose()
})

test('a soldier in the line of fire is hit outright, before the barricade behind him', () => {
  const { world, soldier, gun } = range({ x: 0, z: 10 })
  gun.fire()
  gun.update(gun.lastShot.duration)
  assert.ok(Math.abs(gun.lastBlast.z - 10) < 1, `it bursts on the soldier: ${gun.lastBlast.z}`)
  assert.ok(soldier.dead)
  world.dispose()
})

test('holding charges the range and releasing fires once, subject to reload', () => {
  const { world, crate, tank, clock, gun } = range({ x: 30, z: 0 })
  world.remove(crate)
  const frame = (attack, dt = 0) => {
    tank.input.attack = attack
    gun.update(dt)
  }
  const [min, max] = tankGun.range
  frame(true, .5)
  assert.equal(gun.shotsFired, 0, 'holding only charges')
  assert.equal(gun.power, min + tankGun.charge * .5)
  frame(false)
  assert.equal(gun.shotsFired, 1, 'releasing fires')
  assert.equal(gun.power, min)
  gun.update(gun.lastShot.duration)
  assert.ok(Math.abs(gun.lastBlast.z - (2 + min + tankGun.charge * .5)) < .5)
  assert.ok(Math.abs(gun.lastBlast.y) < 1e-6, 'it comes down on the ground')
  frame(true, .1)
  frame(false)
  assert.equal(gun.shotsFired, 1, 'not before it has reloaded')
  assert.equal(gun.power, min)
  clock.advance(tankGun.reload)
  frame(true, 3)
  assert.equal(gun.power, max)
  assert.equal(gun.shotsFired, 1, 'holding at full power still waits for release')
  frame(false)
  assert.equal(gun.shotsFired, 2)
  gun.update(gun.lastShot.duration)
  assert.ok(Math.abs(gun.lastBlast.z - (2 + max)) < .5)
  world.dispose()
})

test('a shell scars a fixed wall it strikes, not a loose crate', () => {
  const { world, crate, gun, clock } = range({ x: 30, z: 0 })
  gun.fire()
  gun.update(gun.lastShot.duration)
  assert.equal(gun.lastScar, null, 'a crate that flies away keeps no mark')
  world.remove(crate)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1))
  wall.position.set(0, 2.5, 30)
  world.add(wall, 0)
  clock.advance(tankGun.reload)
  gun.fire()
  gun.update(gun.lastShot.duration)
  assert.equal(gun.lastScar?.object, wall)
  assert.ok(Math.abs(gun.lastScar.point.z - 29.5) < .01)
  world.dispose()
})
