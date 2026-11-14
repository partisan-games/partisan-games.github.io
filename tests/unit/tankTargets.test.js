import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let CombatTarget, Granata, GameClock, Predmet, platno

before(async() => {
  createPageElements()
  CombatTarget = (await import('/scenes/2d-tank/CombatTarget.js')).default
  Granata = (await import('/core/actor/projektili/Granata.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  Predmet = (await import('/core/actor/Predmet.js')).default
  platno = (await import('/core/io/platno.js')).default
})

const createTarget = callback => new CombatTarget({ src: null, sirina: 50, visina: 50, x: 400, y: 200, callback })

function hit(target, clock) {
  const grenade = new Granata({ clock, sirina: 10, visina: 10 })
  grenade.pali(target.polozaj, 0, 0)
  grenade.proveriPogodak(target)
  return grenade
}

test('a target awards its callback once per life, even when destruction is reentrant', () => {
  let points = 0
  const target = createTarget(() => {
    points++
    target.umri()
  })
  const firstLife = target.lifeId
  target.umri()
  target.umri()
  assert.equal(points, 1)
  assert.equal(target.dead, true)
  target.reset()
  assert.notEqual(target.lifeId, firstLife)
  assert.equal(target.alive, true)
  target.umri()
  assert.equal(points, 2)
})

test('returning from the left edge starts a new life without stopping the original scroll', t => {
  t.mock.method(Math, 'random', () => .5)
  const target = createTarget(() => {})
  target.dx = -160
  target.procenat = 1
  target.x = -target.sirina - 1
  target.wrapElapsed = 1
  const firstLife = target.lifeId
  target.umri()
  target.proveriGranice()
  assert.equal(target.alive, true)
  assert.notEqual(target.lifeId, firstLife)
  assert.equal(target.x, platno.width + target.sirina / 2)
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
  assert.equal(grenade.vidljiv, false)
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
  assert.equal(first.vidljiv, false)
  assert.equal(second.vidljiv, false)
})

test('targets without a combat-life identifier keep their existing delayed-hit behavior', () => {
  const clock = new GameClock()
  const target = new Predmet(null, { sirina: 50, visina: 50, x: 400, y: 200 })
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
  const grenade = new Granata({ clock, sirina: 10, visina: 10, nivoTla: 190 })
  grenade.pali(target.polozaj, 0, 500)
  grenade.proveriPogodak(target)
  const { x, y } = grenade
  grenade.update(.1)
  grenade.proveriGranice()
  assert.equal(grenade.x, x)
  assert.equal(grenade.y, y)
  assert.equal(grenade.dx, 0)
  assert.equal(grenade.dy, 0)
  assert.equal(grenade.vidljiv, true)
  grenade.x = -platno.width - 100
  grenade.proveriGranice()
  clock.advance(.15)
  assert.equal(points, 1)
  assert.equal(grenade.vidljiv, false)
})

test('a pending impact cannot switch targets and the reused grenade retains gravity', () => {
  const clock = new GameClock()
  const first = createTarget(() => {})
  const second = createTarget(() => {})
  const grenade = hit(first, clock)
  grenade.proveriPogodak(second)
  clock.advance(.15)
  assert.equal(first.dead, true)
  assert.equal(second.alive, true)
  grenade.pali(second.polozaj, 0, 100)
  grenade.update(.01)
  assert.ok(grenade.x > second.x)
  assert.ok(grenade.dy > 0)
})
