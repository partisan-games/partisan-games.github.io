import { test } from 'node:test'
import assert from 'node:assert/strict'
import Shell from '/core/gameplay/bodies/projectiles/Shell.js'
import ProjectilePool from '/core/gameplay/bodies/projectiles/ProjectilePool.js'
import Body from '/core/gameplay/bodies/Body.js'

const target = () => new Body({ x: 10, y: 0, size: { length: 4, height: 2, width: 3 }, states: { idle: {}, dead: {} } })

test('a shell that crosses a target in one step bursts there, and the damage follows the burst', () => {
  const pool = new ProjectilePool(() => new Shell({ gravity: 0, random: () => .5 }))
  const tank = target()
  const shell = pool.fire({ x: 0, y: 0, z: 0 }, 0, 0, 100)
  pool.update(.2, [tank])
  assert.equal(shell.state, 'burst')
  assert.ok(Math.abs(shell.x - 8) < 1e-9, 'it stops where it entered, not past the target')
  assert.equal(tank.health.current, 100)
  pool.update(.2, [tank])
  assert.equal(tank.health.current, 85)
  assert.equal(shell.active, false)
  assert.equal(pool.fire({ x: 0, y: 0, z: 0 }, 0, 0, 1), shell, 'a shell out of play is reused')
})

test('a shell leaves play under the ground without a burst, and a dead target takes no burst damage', () => {
  const pool = new ProjectilePool(() => new Shell({ gravity: 10 }))
  const shell = pool.fire({ x: 0, y: 1, z: 0 }, 0, 0, 1)
  pool.update(1, [])
  assert.equal(shell.active, true, 'it falls first')
  pool.update(1, [])
  assert.equal(shell.active, false)
  const tank = target()
  pool.fire({ x: 0, y: 0, z: 0 }, 0, 0, 100)
  const hit = pool.projectiles.find(projectile => projectile.active)
  hit.gravity = 0
  pool.update(.2, [tank])
  tank.takeHit(100)
  pool.update(.2, [tank])
  assert.equal(tank.hitsTaken, 1)
})
