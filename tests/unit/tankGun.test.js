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
  const ground = new THREE.Mesh(new THREE.BoxGeometry(200, 1, 200))
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
  assert.ok(gun.lastBlast.z > 15 && gun.lastBlast.z < 20, `it bursts at the crate: ${gun.lastBlast.z}`)
  assert.ok(soldier.hitsTaken > 0, 'the soldier near the burst is hurt')
  const velocity = crate.userData.body.getLinearVelocity()
  assert.ok(velocity.z() > 1 && velocity.y() > 0, 'the crate is thrown away from the burst and up')
  world.dispose()
})

test('a soldier in the line of fire is hit outright, before the barricade behind him', () => {
  const { world, soldier, gun } = range({ x: 0, z: 10 })
  gun.fire()
  assert.ok(Math.abs(gun.lastBlast.z - 10) < 1, `it bursts on the soldier: ${gun.lastBlast.z}`)
  assert.ok(soldier.dead)
  world.dispose()
})

test('held, the trigger charges the shot; let go, the gun fires as far as charged, once per reload of game time', () => {
  const { world, crate, tank, clock, gun } = range({ x: 30, z: 0 })
  world.remove(crate)
  /** Holds the trigger `seconds` at 30 frames a second, then lets it go. */
  const press = seconds => {
    tank.input.attack = true
    for (let i = 0; i < Math.round(seconds * 30); i++) gun.update(1 / 30)
    tank.input.attack = false
    gun.update(1 / 30)
  }
  tank.input.attack = true
  for (let i = 0; i < 30; i++) gun.update(1 / 30)
  assert.equal(gun.shotsFired, 0, 'holding does not fire')
  const [least, most] = tankGun.range
  assert.ok(Math.abs(gun.power - (least + tankGun.charge)) < 1e-6, `a second charges it: ${gun.power}`)
  tank.input.attack = false
  gun.update(1 / 30)
  assert.equal(gun.shotsFired, 1, 'letting go fires')
  assert.ok(Math.abs(gun.lastBlast.z - (2 + least + tankGun.charge)) < .5, `it lands as far as charged: ${gun.lastBlast.z}`)
  assert.ok(Math.abs(gun.lastBlast.y) < 1e-6, 'spent, it comes down on the ground')
  assert.equal(gun.power, least, 'the charge starts over')
  press(.2)
  assert.equal(gun.shotsFired, 1, 'not before it has reloaded')
  clock.advance(tankGun.reload)
  press(10)
  assert.equal(gun.shotsFired, 2)
  assert.ok(gun.lastBlast.z <= 2 + most + .5, 'never past its most')
  world.dispose()
})

test('a shell scars a fixed wall it strikes, not a loose crate', () => {
  const { world, crate, gun, clock } = range({ x: 30, z: 0 })
  gun.fire()
  assert.equal(gun.lastScar, null, 'a crate that flies away keeps no mark')
  world.remove(crate)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1))
  wall.position.set(0, 2.5, 30)
  world.add(wall, 0)
  clock.advance(tankGun.reload)
  gun.fire(tankGun.range[1])
  assert.equal(gun.lastScar?.object, wall)
  assert.ok(Math.abs(gun.lastScar.point.z - 29.5) < .01)
  world.dispose()
})
