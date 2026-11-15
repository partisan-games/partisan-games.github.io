import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'

let AirRaids, TenkLevo, Granata, platno, shellGravity

before(async() => {
  createPageElements()
  AirRaids = (await import('/scenes/to-trieste/AirRaids.js')).default
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  Granata = (await import('/core/actor/projektili/Granata.js')).default
  platno = (await import('/core/io/platno.js')).default
  ;({ shellGravity } = await import('/scenes/tenkici/shellPhysics.js'))
})

function encounter(callback = () => {}) {
  const clock = new GameClock()
  const target = new TenkLevo({ clock, src: null, cevSlika: null, sirina: 50, visina: 40, x: 100, y: 400 })
  const raids = new AirRaids({ clock, target, groundY: 400, crashY: () => 470, scrollSpeed: -160, callback })
  for (const plane of raids.planes) { plane.sirina = 180; plane.visina = 50 }
  return { clock, target, raids }
}

test('aircraft wait for the gameplay clock and alternate without overlapping passes', () => {
  const { clock, raids } = encounter()
  raids.update()
  assert.ok(raids.planes.every(p => !p.active && !p.vidljiv))
  clock.advance(28)
  raids.update()
  const [fighter, bomber] = raids.planes
  assert.equal(fighter.active, true)
  assert.equal(bomber.active, false)
  clock.advance(40)
  raids.update()
  assert.equal(bomber.active, false, 'an ongoing pass is never interrupted by the next aircraft')
  fighter.x = -fighter.sirina
  fighter.proveriGranice()
  raids.update()
  assert.equal(bomber.active, true)
  assert.equal(fighter.active, false)
})

test('a shot-down aircraft scores once, falls, and its next pass invalidates an old delayed hit', () => {
  let points = 0
  const { clock, raids } = encounter(() => points++)
  const plane = raids.planes[0]
  plane.launch()
  plane.postavi(400, 200)
  const oldLife = plane.lifeId
  const shell = new Granata({ clock, src: null, sirina: 10, visina: 10, nivoTla: 400 })
  shell.pali(plane, 0, 0)
  shell.proveriPogodak(plane)
  plane.umri()
  plane.umri()
  assert.equal(points, 1)
  const y = plane.y
  plane.update(.1)
  assert.ok(plane.y > y)
  assert.equal(plane.dx, -plane.flightSpeed)
  plane.y = 440
  plane.proveriGranice()
  assert.equal(plane.active, true, 'crossing the road does not remove the falling plane')
  plane.y = 475
  plane.update(0)
  assert.equal(plane.y, 470)
  assert.equal(plane.dy, 0)
  assert.equal(plane.crashed, true)
  assert.equal(plane.vidljiv, true)
  assert.equal(plane.dead, true, 'the visible wreck remains burning')
  const wreckX = plane.x
  const landingSpeed = plane.dx
  plane.update(.1)
  assert.ok(Math.abs(plane.dx - plane.scrollSpeed) <= Math.abs(landingSpeed - plane.scrollSpeed))
  assert.ok(Math.abs(plane.x - (wreckX + plane.dx * .1)) < 1e-8)
  clock.advance(6)
  plane.update(0)
  assert.equal(plane.active, false)
  plane.launch()
  assert.equal(plane.crashed, false)
  clock.advance(.2)
  assert.equal(plane.lifeId, oldLife + 1)
  assert.equal(plane.alive, true)
  assert.equal(points, 1, 'the delayed old-life hit cannot down the reused plane')
})

test('wrecks slide after touching down and friction brings them to rest relative to the terrain', () => {
  const { raids } = encounter()
  for (const plane of raids.planes) {
    plane.launch()
    plane.postavi(600, 470)
    plane.dx = -320
    plane.umri()
    plane.update(0)
    assert.equal(plane.crashed, true)
    assert.equal(plane.dx, -320, 'touchdown preserves horizontal momentum')
    plane.update(.1)
    assert.ok(plane.dx > -320 && plane.dx < plane.scrollSpeed)
    assert.ok(plane.x < 600 + plane.scrollSpeed * .1, 'wreck slides across the moving terrain')
    assert.equal(plane.y, 470)
    for (let i = 0; i < 14; i++) plane.update(.1)
    assert.equal(plane.dx, plane.scrollSpeed, 'friction stops sliding without reversing it')
    const x = plane.x
    plane.update(.1)
    assert.ok(Math.abs(plane.x - (x + plane.scrollSpeed * .1)) < 1e-8)
  }
})

test('both aircraft preserve velocity at impact and keep horizontal momentum while falling', () => {
  const { raids } = encounter()
  for (const plane of raids.planes) {
    plane.launch()
    plane.postavi(500, 180)
    plane.dy = 12
    const dx = plane.dx
    const dy = plane.dy
    plane.umri()
    assert.equal(plane.dx, dx, 'being hit does not abruptly remove horizontal velocity')
    assert.equal(plane.dy, dy, 'being hit does not abruptly change vertical velocity')
    plane.update(.2)
    assert.equal(plane.dx, dx)
    assert.ok(Math.abs(plane.x - (500 + dx * .2)) < 1e-8)
    assert.ok(plane.dy > dy, 'gravity increases descent after impact')
    assert.ok(plane.y > 180)
    assert.equal(plane.crashed, false)
  }
})

test('a fighter strafes along its visible nose, then levels out and stops firing', () => {
  const { clock, raids } = encounter()
  const plane = raids.planes[0]
  plane.launch()
  plane.postavi(500, 200)
  plane.update(.1)
  assert.ok(plane.dy > 0 && plane.dy < plane.flightSpeed * Math.tan(Math.PI / 10), 'entry into the dive is gradual')
  clock.advance(.36)
  plane.update(.1)
  const [bullet] = plane.fire.projectiles.projectiles
  assert.ok(bullet)
  assert.ok(bullet.dx < 0 && bullet.dy > 0)
  assert.ok(Math.abs(Math.sin(bullet.ugao - (plane.ugao + Math.PI))) < 1e-8)
  assert.equal(bullet.x, plane.muzzle.x)
  assert.equal(bullet.y, plane.muzzle.y)
  plane.y = plane.groundY - 80
  clock.advance(10)
  const descent = plane.dy
  plane.update(.1)
  assert.ok(plane.dy > 0 && plane.dy < descent, 'pull-up reduces descent gradually')
  for (let i = 0; i < 10; i++) plane.update(.1)
  assert.equal(plane.dy, 0)
  assert.equal(plane.fire.projectiles.projectiles.length, 1)
  assert.equal(bullet.vidljiv, true, 'leveling out leaves existing shots in flight')
})

test('a bomber releases one unguided falling bomb and never fires while hidden', () => {
  const { clock, target, raids } = encounter()
  const bomber = raids.planes[1]
  bomber.launch()
  bomber.y = 250
  const fall = Math.sqrt(2 * (target.y - bomber.muzzle.y) / shellGravity)
  bomber.x = target.x + bomber.flightSpeed * fall
  assert.ok(bomber.x < platno.width)
  bomber.update(0)
  const [bomb] = bomber.fire.projectiles.projectiles
  assert.ok(bomb)
  assert.ok(Math.abs(bomb.dx + bomber.flightSpeed) < 1e-8)
  assert.ok(bomb.oznake.has('air-bomb'))
  bomb.update(.1)
  assert.ok(bomb.dy > 0)
  clock.advance(20)
  bomber.update(0)
  assert.equal(bomber.fire.projectiles.projectiles.length, 1)
  bomber.active = false
  bomber.nestani()
  bomber.update(.1)
  assert.equal(bomber.fire.projectiles.projectiles.length, 1)
})
