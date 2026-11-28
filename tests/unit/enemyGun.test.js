import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import GameClock from '/core/runtime/GameClock.js'

let EnemyGun, enemyGun
before(async() => {
  ;({ default: EnemyGun, enemyGun } = await import('/scenes/3d-tank/EnemyGun.js'))
})

/** A tank target at `z` metres down the road from a gun at the origin, and the walls between them. */
function range(z, walls = []) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 6))
  let taken = 0
  const target = { x: 0, y: 1, z, mesh, alive: true, takeHit: damage => {
    taken += damage
  } }
  const clock = new GameClock()
  const gun = new EnemyGun({ x: 0, z: 0, target, world: { rigidBodies: [mesh, ...walls] }, clock, random: () => 0 })
  return { gun, target, clock, taken: () => taken }
}

const wait = (clock, seconds) => clock.advance(seconds)

test('a German gun turns to the tank in reach and hits it each time it has reloaded, not before its first shot', () => {
  const { gun, clock, taken } = range(40)
  gun.update()
  assert.equal(gun.shotsFired, 0, 'not before its first shot')
  wait(clock, enemyGun.firstShot)
  gun.update()
  assert.equal(taken(), enemyGun.damage)
  assert.ok(Math.abs(gun.yaw) < 1e-9, 'turned down the road to it')
  gun.update()
  assert.equal(gun.shotsFired, 1, 'once per reload')
  wait(clock, enemyGun.interval)
  gun.update()
  assert.equal(taken(), enemyGun.damage * 2)
})

test('it holds fire beyond its reach, and a wall in the way takes its shell', () => {
  const far = range(enemyGun.reach + 5)
  wait(far.clock, enemyGun.firstShot)
  far.gun.update()
  assert.equal(far.gun.shotsFired, 0)

  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 1))
  wall.position.z = 20
  const blocked = range(40, [wall])
  wait(blocked.clock, enemyGun.firstShot)
  blocked.gun.update()
  assert.equal(blocked.taken(), 0)
  assert.ok(Math.abs(blocked.gun.lastBlast.z - 19.5) < .01, 'it bursts on the wall')
})

test('a shell of the tank takes its health, and a destroyed gun fires no more', () => {
  const { gun, clock } = range(40)
  gun.takeHit(enemyGun.health)
  assert.ok(gun.dead)
  wait(clock, enemyGun.firstShot)
  gun.update()
  assert.equal(gun.shotsFired, 0)
})
