import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Bunker, GameClock, TenkLevo, CombatTarget, createCannon, shellAngle, firstHit, shellGravity, shellSpeed, platno

before(async() => {
  createPageElements()
  Bunker = (await import('/scenes/2d-tank/Bunker.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  CombatTarget = (await import('/scenes/2d-tank/CombatTarget.js')).default
  ;({ createCannon, shellAngle } = await import('/scenes/2d-tank/BunkerWeapons.js'))
  ;({ firstHit } = await import('/scenes/2d-tank/lineOfFire.js'))
  ;({ shellGravity, shellSpeed } = await import('/scenes/tenkici/shellPhysics.js'))
  platno = (await import('/core/io/platno.js')).default
})

function battle(options = {}) {
  const clock = new GameClock()
  const target = new TenkLevo({ clock, src: null, cevSlika: null, sirina: 50, visina: 50, x: 100, y: 200 })
  const bunker = new Bunker({ clock, target, src: null, sirina: 50, visina: 50, x: 400, y: 200, groundY: 300, ...options })
  return { clock, target, bunker }
}

test('machine guns wait, aim at the tank and reuse spent bullets within a burst', () => {
  const { clock, target, bunker } = battle()
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
  clock.advance(1.5)
  bunker.update(0)
  const [shot] = bunker.projectiles.projectiles
  assert.ok(shot.dx < 0)
  assert.equal(shot.gravitacija, 0)
  assert.equal(shot.steta, 3)
  assert.ok(shot.dy < 0)
  assert.ok(shot.x > target.x)
  shot.reset()
  clock.advance(.1)
  bunker.update(0)
  assert.equal(shot.vidljiv, false)
  clock.advance(.04)
  bunker.update(0)
  assert.equal(shot.vidljiv, true)
  assert.equal(bunker.projectiles.projectiles.length, 1)
})

test('machine guns fire five spaced shots and then leave a reload gap', t => {
  const { clock, bunker } = battle()
  let shots = 0
  t.mock.method(bunker.projectiles, 'fire', () => shots++)
  clock.advance(1.5)
  bunker.update(0)
  assert.equal(shots, 1)
  for (let i = 0; i < 4; i++) {
    clock.advance(.14)
    bunker.update(0)
  }
  assert.equal(shots, 5)
  clock.advance(2.9)
  bunker.update(0)
  assert.equal(shots, 5)
  clock.advance(.2)
  bunker.update(0)
  assert.equal(shots, 6)
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
  bunker.checkHits()
  assert.equal(target.energija, health - shot.steta)
  assert.equal(shot.vidljiv, false)
  bunker.checkHits()
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

test('partly visible bunkers wait until their firing opening is on screen', () => {
  const { clock, bunker } = battle()
  bunker.x = platno.width + 20
  assert.equal(bunker.prikazan, true)
  clock.advance(10)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 0)
})

test('cannons use the same shell physics as the tank, with an upward launch and gravity', () => {
  const { clock, target, bunker } = battle({ createWeapon: createCannon })
  clock.advance(1.5)
  bunker.update(0)
  const [shell] = bunker.projectiles.projectiles
  target.pucaj(target.polozaj, 0)
  const [tankShell] = target.granate.projectiles
  assert.equal(shell.gravitacija, tankShell.gravitacija)
  assert.ok(Math.abs(shell.brzina - tankShell.brzina) < 1e-6)
  assert.equal(shell.nivoTla, 300)
  assert.equal(shell.steta, 20)
  assert.ok(shell.dy < 0)
  shell.sirina = shell.visina = 10
  const initialY = shell.y
  const initialVelocity = shell.dy
  shell.update(.1)
  assert.ok(shell.y < initialY)
  assert.ok(shell.dy > initialVelocity)
})

test('ballistic aim reaches the requested height on either side and rejects unreachable targets', () => {
  const origin = { x: 400, y: 180 }
  for (const target of [{ x: 100, y: 200 }, { x: 700, y: 150 }]) {
    const angle = shellAngle(origin, target)
    assert.notEqual(angle, null)
    const time = (target.x - origin.x) / (shellSpeed * Math.cos(angle))
    const y = origin.y + shellSpeed * Math.sin(angle) * time + shellGravity * time * time / 2
    assert.ok(time > 0)
    assert.ok(Math.abs(y - target.y) < 1e-6)
  }
  assert.equal(shellAngle(origin, { x: 10000, y: 180 }), null)
  assert.equal(shellAngle(origin, origin), null)
})

test('tank-like ballistic aim is almost horizontal nearby and rises into a larger arc at distance', () => {
  const origin = { x: 0, y: 200 }
  const near = shellAngle(origin, { x: 80, y: 200 })
  const far = shellAngle(origin, { x: 1000, y: 200 })
  assert.ok(Math.abs(near) < .02)
  assert.ok(Math.abs(far) > Math.abs(near))
  const peak = angle => (shellSpeed * Math.sin(angle)) ** 2 / (2 * shellGravity)
  assert.ok(peak(near) < 1)
  assert.ok(peak(far) > 40)
})

test('bunkers keep firing through a civilian obstruction and reach the tank after destroying it', () => {
  const { clock, bunker } = battle()
  const cover = new CombatTarget({ src: null, sirina: 80, visina: 120, x: 250, y: 200 })
  bunker.obstacles.push(cover)
  clock.advance(1.5)
  bunker.update(0)
  assert.equal(bunker.projectiles.projectiles.length, 1)
  const [shot] = bunker.projectiles.projectiles
  shot.update(.3)
  bunker.checkHits()
  assert.equal(cover.dead, true)
  assert.equal(bunker.target.energija, 100)
  clock.advance(.14)
  bunker.update(0)
  assert.equal(shot.vidljiv, true)
  shot.update(.6)
  bunker.checkHits()
  assert.equal(bunker.target.energija, 97)
})

test('cover intercepts an already fired bullet crossing an entire building in one frame', () => {
  const { clock, target, bunker } = battle()
  const sources = []
  const cover = new CombatTarget({ src: null, sirina: 50, visina: 120, x: 250, y: 200, callback: source => sources.push(source) })
  clock.advance(1.5)
  bunker.update(0)
  bunker.obstacles.push(cover)
  const [shot] = bunker.projectiles.projectiles
  shot.update(.6)
  bunker.checkHits()
  assert.equal(target.energija, 100)
  assert.equal(shot.vidljiv, false)
  assert.equal(cover.dead, true)
  assert.deepEqual(sources, ['enemy'])
})

test('enemy shells destroy the first building after their impact delay and identify the attacker', () => {
  const { clock, target, bunker } = battle({ createWeapon: createCannon })
  const sources = []
  const cover = new CombatTarget({ src: null, sirina: 80, visina: 120, x: 250, y: 200, callback: source => sources.push(source) })
  bunker.obstacles.push(cover)
  clock.advance(1.5)
  bunker.update(0)
  const [shell] = bunker.projectiles.projectiles
  shell.sirina = shell.visina = 10
  shell.update(.4)
  bunker.checkHits()
  assert.equal(cover.alive, true)
  clock.advance(.15)
  assert.equal(cover.dead, true)
  assert.deepEqual(sources, ['enemy'])
  assert.equal(target.energija, 100)
  assert.equal(shell.vidljiv, false)
})

test('a building behind the tank cannot intercept a hit that reaches the tank first', () => {
  const { clock, target, bunker } = battle()
  clock.advance(1.5)
  bunker.update(0)
  bunker.obstacles.push(new CombatTarget({ src: null, sirina: 30, visina: 120, x: 40, y: 200 }))
  const [shot] = bunker.projectiles.projectiles
  shot.update(.6)
  bunker.checkHits()
  assert.equal(target.energija, 97)
  assert.equal(shot.vidljiv, false)
})

test('cover remains vulnerable to the player and retains its destruction penalty', () => {
  const { clock, target } = battle()
  let penalties = 0
  const cover = new CombatTarget({ src: null, sirina: 50, visina: 120, x: 250, y: 200, callback: () => penalties++ })
  target.granate.fire(cover.polozaj, 0, 0)
  const [shell] = target.granate.projectiles
  shell.sirina = shell.visina = 10
  target.granate.checkHits([cover])
  clock.advance(.15)
  assert.equal(cover.dead, true)
  assert.equal(penalties, 1)
})

test('line-of-fire intersection ignores gaps and destroyed cover, and chooses the nearest hit', () => {
  const near = new CombatTarget({ src: null, sirina: 20, visina: 40, x: 200, y: 200 })
  const far = new CombatTarget({ src: null, sirina: 20, visina: 40, x: 100, y: 200 })
  assert.equal(firstHit({ x: 400, y: 200 }, { x: 0, y: 200 }, [far, near]).target, near)
  assert.equal(firstHit({ x: 400, y: 150 }, { x: 0, y: 150 }, [near]), null)
  near.umri()
  assert.equal(firstHit({ x: 400, y: 200 }, { x: 0, y: 200 }, [near]), null)
})
