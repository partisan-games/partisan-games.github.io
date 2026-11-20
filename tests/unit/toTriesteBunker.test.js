import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Bunker, GameClock

before(async() => {
  createPageElements()
  Bunker = (await import('/scenes/to-trieste/Bunker.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

/** A bunker alone, with no controller: its shots would hit a stand-in target. */
function bunker() {
  const clock = new GameClock()
  const target = { x: 100, y: 200, alive: true, shown: true, visible: true, width: 50, height: 50 }
  return { clock, block: new Bunker({ clock, target, src: null, width: 50, height: 50, x: 400, y: 200, groundY: 300 }) }
}

const shots = block => block.projectiles.projectiles.length

test('a bunker stands idle and does not fire until it is set to', () => {
  const { clock, block } = bunker()
  assert.deepEqual(block.states, ['idle', 'fire', 'dead'])
  assert.equal(block.state, 'idle')
  clock.advance(10)
  block.update(0)
  assert.equal(shots(block), 0)
})

test('a bunker fires only in fire, where it aims, after its first wait', () => {
  const { clock, block } = bunker()
  block.setState('fire')
  clock.advance(10)
  block.update(0)
  assert.equal(shots(block), 0, 'with nowhere to aim it holds fire')
  assert.equal(block.aimAt({ x: 100, y: 100 }), true)
  block.update(0)
  assert.equal(shots(block), 0, 'holding fire started the first wait over')
  clock.advance(1.5)
  block.update(0)
  const [shot] = block.projectiles.projectiles
  assert.ok(shot.dx < 0 && shot.dy < 0, 'up to the left, where it aims')
  assert.ok(shot.x < block.x, 'from the side it aims at')
})

test('a destroyed bunker holds fire and a new life stands idle again', () => {
  const { clock, block } = bunker()
  block.aimAt({ x: 100, y: 200 })
  block.setState('dead')
  assert.equal(block.dead, true)
  block.setState('fire')
  clock.advance(10)
  block.update(0)
  assert.equal(shots(block), 0)
  block.reset()
  assert.equal(block.alive, true)
  assert.equal(block.state, 'idle')
})
