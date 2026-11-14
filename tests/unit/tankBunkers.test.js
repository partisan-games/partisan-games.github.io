import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Bunker, GameClock, TenkLevo, platno

before(async() => {
  createPageElements()
  Bunker = (await import('/scenes/2d-tank/Bunker.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  platno = (await import('/core/io/platno.js')).default
})

function battle() {
  const clock = new GameClock()
  const target = new TenkLevo({ clock, src: null, cevSlika: null, sirina: 50, visina: 50, x: 100, y: 200 })
  const bunker = new Bunker({ clock, target, src: null, sirina: 50, visina: 50, x: 400, y: 200 })
  return { clock, target, bunker }
}

test('bunkers wait before aiming at the tank, reload and reuse spent projectiles', () => {
  const { clock, target, bunker } = battle()
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  clock.advance(1.5)
  bunker.update(0)
  const [shot] = bunker.projectiles.projectiles
  assert.ok(shot.dx < 0)
  assert.ok(Math.abs(shot.dy) < .001)
  assert.ok(shot.x > target.x)
  shot.reset()
  clock.advance(2)
  bunker.update(0)
  assert.equal(shot.vidljiv, false)
  clock.advance(.5)
  bunker.update(0)
  assert.equal(shot.vidljiv, true)
  assert.equal(bunker.projectiles.projectiles.length, 1)
})

test('offscreen and destroyed bunkers do not fire, but fired shots can still damage the tank', () => {
  const { clock, target, bunker } = battle()
  bunker.x = platno.width + 100
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  bunker.x = 400
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  clock.advance(1.5)
  bunker.update(0)
  const [shot] = bunker.projectiles.projectiles
  bunker.umri()
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 1)
  shot.sirina = shot.visina = 10
  shot.postavi(target.x, target.y)
  const health = target.energija
  bunker.projectiles.checkHits([target])
  assert.equal(target.energija, health - shot.steta)
  assert.equal(shot.vidljiv, false)
  bunker.projectiles.checkHits([target])
  assert.equal(target.energija, health - shot.steta)
})

test('a new bunker life waits again and a destroyed tank is no longer targeted', () => {
  const { clock, target, bunker } = battle()
  clock.advance(10)
  bunker.umri()
  bunker.reset()
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  target.reagujNaPogodak(100)
  clock.advance(2)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
})
