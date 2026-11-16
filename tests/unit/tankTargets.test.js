import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let CombatTarget, Shell, GameClock, GameObject2D, canvas2d

before(async() => {
  createPageElements()
  CombatTarget = (await import('/scenes/to-trieste/CombatTarget.js')).default
  Shell = (await import('/core/actor/projectiles/Shell.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

const createTarget = callback => new CombatTarget({ src: null, width: 50, height: 50, x: 400, y: 200, callback })

function hit(target, clock) {
  const grenade = new Shell({ clock, width: 10, height: 10 })
  grenade.launch(target.position, 0, 0)
  grenade.checkHit(target)
  return grenade
}

test('a target awards its callback once per life, even when destruction is reentrant', () => {
  let points = 0
  const target = createTarget(() => {
    points++
    target.die()
  })
  const firstLife = target.lifeId
  target.die()
  target.die()
  assert.equal(points, 1)
  assert.equal(target.dead, true)
  target.reset()
  assert.notEqual(target.lifeId, firstLife)
  assert.equal(target.alive, true)
  target.die()
  assert.equal(points, 2)
})

test('returning from the left edge starts a new life without stopping the original scroll', t => {
  t.mock.method(Math, 'random', () => .5)
  const target = createTarget(() => {})
  target.dx = -160
  target.probability = 1
  target.x = -target.width - 1
  target.wrapElapsed = 1
  const firstLife = target.lifeId
  target.die()
  target.checkBounds()
  assert.equal(target.alive, true)
  assert.notEqual(target.lifeId, firstLife)
  assert.equal(target.x, canvas2d.width + target.width / 2)
  assert.equal(target.dx, -160)
})

test('a delayed grenade hit cannot destroy a target after it starts a new life', () => {
  const clock = new GameClock()
  let points = 0
  const target = createTarget(() => points++)
  const grenade = hit(target, clock)
  target.reset()
  clock.advance(.15)
  assert.equal(target.alive, true)
  assert.equal(points, 0)
  assert.equal(grenade.visible, false)
})

test('two queued grenade hits score once for the same target life', () => {
  const clock = new GameClock()
  let points = 0
  const target = createTarget(() => points++)
  const first = hit(target, clock)
  const second = hit(target, clock)
  clock.advance(.15)
  assert.equal(target.dead, true)
  assert.equal(points, 1)
  assert.equal(first.visible, false)
  assert.equal(second.visible, false)
})

test('targets without a combat-life identifier keep their existing delayed-hit behavior', () => {
  const clock = new GameClock()
  const target = new GameObject2D(null, { width: 50, height: 50, x: 400, y: 200 })
  hit(target, clock)
  clock.advance(.1)
  assert.equal(target.alive, true)
  clock.advance(.05)
  assert.equal(target.dead, true)
})

test('a confirmed impact stays still and survives ground and screen boundary checks', () => {
  const clock = new GameClock()
  let points = 0
  const target = createTarget(() => points++)
  const grenade = new Shell({ clock, width: 10, height: 10, groundLevel: 190 })
  grenade.launch(target.position, 0, 500)
  grenade.checkHit(target)
  const { x, y } = grenade
  grenade.update(.1)
  grenade.checkBounds()
  assert.equal(grenade.x, x)
  assert.equal(grenade.y, y)
  assert.equal(grenade.dx, 0)
  assert.equal(grenade.dy, 0)
  assert.equal(grenade.visible, true)
  grenade.x = -canvas2d.width - 100
  grenade.checkBounds()
  clock.advance(.15)
  assert.equal(points, 1)
  assert.equal(grenade.visible, false)
})

test('a pending impact cannot switch targets and the reused grenade retains gravity', () => {
  const clock = new GameClock()
  const first = createTarget(() => {})
  const second = createTarget(() => {})
  const grenade = hit(first, clock)
  grenade.checkHit(second)
  clock.advance(.15)
  assert.equal(first.dead, true)
  assert.equal(second.alive, true)
  grenade.launch(second.position, 0, 100)
  grenade.update(.01)
  assert.ok(grenade.x > second.x)
  assert.ok(grenade.dy > 0)
})
