import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Aircraft, flight, enemyAircraftArt, GameClock

before(async() => {
  createPageElements()
  ;({ default: Aircraft, flight } = await import('/scenes/to-trieste/Aircraft.js'))
  ;({ enemyAircraftArt } = await import('/scenes/to-trieste/enemyArt.js'))
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

/** A plane alone, with no controller, launched and flying over the middle of the view. */
function plane(kind) {
  const clock = new GameClock()
  const target = { x: 100, y: 400, alive: true, shown: true, visible: true, width: 50, height: 40 }
  const block = new Aircraft({ clock, target, groundY: 400, kind, art: enemyAircraftArt[kind] })
  block.launch()
  block.x = 600
  return { clock, block }
}

const shots = block => block.projectiles.projectiles.length

test('a launched plane flies level and does not fire until it is set to', () => {
  assert.deepEqual(plane('fighter').block.states, ['fly', 'dive', 'fire', 'crash'])
  assert.deepEqual(plane('diveBomber').block.states, ['fly', 'fire', 'crash'])
  for (const kind of ['fighter', 'diveBomber']) {
    const { clock, block } = plane(kind)
    assert.equal(block.state, 'fly')
    clock.advance(10)
    for (let i = 0; i < 10; i++) block.update(.1)
    assert.equal(block.dy, 0, kind)
    assert.equal(shots(block), 0, kind)
  }
})

test('a fighter dives as steep as it aims, at most its steepest, and fires along its nose only in fire', () => {
  const { clock, block } = plane('fighter')
  assert.equal(block.aimAt({ x: block.x - 100, y: block.y + 1000 }), true)
  assert.equal(block.divePitch, flight.maxDive)
  assert.equal(block.aimAt({ x: block.x + 100, y: block.y }), false, 'it cannot aim behind')
  block.aimAt({ x: block.x - 300, y: block.y + 30 })
  block.setState('dive')
  clock.advance(1)
  block.update(.1)
  assert.ok(block.dy > 0)
  assert.equal(shots(block), 0)
  block.setState('fire')
  block.update(.1)
  assert.equal(shots(block), 0, 'holding fire started the first wait over')
  clock.advance(.4)
  block.update(.1)
  const [bullet] = block.projectiles.projectiles
  assert.ok(Math.abs(Math.sin(bullet.angle - (block.angle + Math.PI))) < 1e-8)
})

test('a dive bomber drops its one bomb as it passes over the point it aims at', () => {
  const { clock, block } = plane('diveBomber')
  const { x, y } = block.shots.down
  block.aimAt({ x: block.x - x, y: block.y + y })
  block.setState('fire')
  clock.advance(1)
  for (let i = 0; i < 60 && !shots(block); i++) block.update(1 / 30)
  assert.equal(shots(block), 1)
  for (let i = 0; i < 60; i++) block.update(1 / 30)
  assert.equal(shots(block), 1)
})

test('a crashing plane is shot down, falls and slides to rest as a wreck', () => {
  const { block } = plane('fighter')
  block.setState('crash')
  assert.equal(block.dead, true)
  const { y } = block
  block.update(.1)
  assert.ok(block.y > y)
  block.launch()
  assert.equal(block.state, 'fly')
  assert.equal(block.alive, true)
})
