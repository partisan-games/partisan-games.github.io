import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let GroundEnemy, profiles, groundEnemyArt, GameClock

before(async() => {
  createPageElements()
  ;({ GroundEnemy, profiles } = await import('/scenes/to-trieste/GroundEnemies.js'))
  ;({ groundEnemyArt } = await import('/scenes/to-trieste/enemyArt.js'))
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

/** A ground enemy alone, with no controller, on a road that scrolls at -160. */
function enemy(kind, options = {}) {
  const clock = new GameClock()
  const target = { x: 100, y: 300, alive: true, shown: true, visible: true, width: 50, height: 50 }
  const block = new GroundEnemy({ clock, target, groundY: 300, scrollSpeed: -160, ...profiles.find(p => p.kind === kind),
    art: groundEnemyArt[kind], x: 500, nextSpawnX: () => 2000, ...options })
  block.y = 300
  return { clock, block }
}

const shots = block => block.projectiles.projectiles.length

test('each ground enemy has only the states it can, and rests with the scenery', () => {
  assert.deepEqual(enemy('germanTank').block.states, ['idle', 'drive', 'fire', 'dead'])
  assert.deepEqual(enemy('truck').block.states, ['idle', 'drive', 'dead'])
  assert.deepEqual(enemy('antiTankGun').block.states, ['idle', 'fire', 'dead'])
  const { clock, block } = enemy('germanTank')
  assert.equal(block.state, 'idle')
  assert.equal(block.dx, -160)
  clock.advance(10)
  block.update(0)
  assert.equal(shots(block), 0)
})

test('a vehicle drives, fires without changing how it moves, and its wreck goes with the scenery', () => {
  const { clock, block } = enemy('germanTank')
  block.setState('drive')
  assert.equal(block.dx, -160 - block.driveSpeed)
  assert.equal(block.aimAt({ x: 100, y: 300 }), true)
  block.setState('fire')
  assert.equal(block.dx, -160 - block.driveSpeed)
  clock.advance(1.5)
  block.update(0)
  assert.equal(shots(block), 1)
  block.setState('dead')
  assert.equal(block.dead, true)
  assert.equal(block.dx, -160)
})

test('the gun does not turn round to a point behind it, and fires only in fire', () => {
  const { clock, block } = enemy('antiTankGun')
  assert.equal(block.aimAt({ x: 900, y: 300 }), false)
  assert.equal(block.barrel.angle, Math.PI)
  assert.equal(block.aimAt({ x: 100, y: 300 }), true)
  assert.notEqual(block.barrel.angle, Math.PI)
  clock.advance(10)
  block.update(0)
  assert.equal(shots(block), 0)
  block.setState('fire')
  clock.advance(1.5)
  block.update(0)
  assert.equal(shots(block), 1)
})

test('a new life starts in the state the enemy was made in', () => {
  const { block } = enemy('truck', { state: 'drive' })
  assert.equal(block.dx, -160 - block.driveSpeed)
  block.setState('dead')
  block.reset()
  assert.equal(block.state, 'drive')
  assert.equal(block.dx, -160 - block.driveSpeed)
})
