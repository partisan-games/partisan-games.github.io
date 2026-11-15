import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Encounter, CombatTarget, BoatCombat, platno
before(async() => {
  createPageElements()
  Encounter = (await import('/scenes/camac/SBoatEncounter.js')).default
  CombatTarget = (await import('/scenes/camac/CombatTarget.js')).default
  BoatCombat = (await import('/scenes/camac/BoatCombat.js')).default
  platno = (await import('/core/io/platno.js')).default
})

function setup(t) {
  const session = new GameSession()
  t.after(() => session.dispose())
  session.start()
  const target = new CombatTarget({ session, viewLeft: () => 0, src: null,
    sirina: 60, visina: 24, x: 100, y: platno.height / 2, maximum: 100 })
  const encounter = new Encounter({ session, viewLeft: () => 0, target })
  return { session, target, encounter, boat: encounter.boat }
}

test('S-boat encounters use gameplay time, retain a visible wreck and reuse a fresh life after a quiet interval', t => {
  const { session, encounter, boat } = setup(t)
  encounter.update()
  assert.equal(boat.active, false)
  session.pause()
  session.update(20)
  encounter.update()
  assert.equal(boat.active, false)
  session.resume()
  session.update(10)
  encounter.update()
  assert.equal(boat.active, true)
  assert.ok(boat.x > platno.width)
  const lifeId = boat.lifeId
  boat.reagujNaPogodak(60)
  boat.update(1)
  assert.equal(boat.dead, true)
  assert.equal(boat.brzina, 0)
  assert.equal(boat.vidljiv, true)
  session.update(4.9)
  encounter.update()
  assert.equal(boat.vidljiv, true)
  session.update(.2)
  encounter.update()
  assert.equal(boat.active, false)
  assert.equal(boat.vidljiv, false)
  session.update(27.9)
  encounter.update()
  assert.equal(boat.active, false)
  session.update(.2)
  encounter.update()
  assert.equal(boat.lifeId, lifeId + 1)
  assert.equal(boat.energija, 60)
  assert.equal(boat.side, -1)
})

test('a deferred encounter waits for a clear approach without interrupting an active boat', t => {
  const { session, encounter, boat } = setup(t)
  session.update(10)
  encounter.update({ allowSpawn: false })
  assert.equal(boat.active, false)
  session.update(3)
  encounter.update({ allowSpawn: true })
  assert.equal(boat.active, true)
  encounter.update({ allowSpawn: false })
  assert.equal(boat.active, true)
  session.update(19)
  encounter.update({ allowSpawn: false })
  assert.equal(boat.active, false)
})

test('deck fire follows the visible barrel and stops on pause, death or a close pass', t => {
  const { session, target, boat } = setup(t)
  boat.launch(1)
  boat.postavi(450, target.y)
  boat.update(0)
  assert.equal(boat.bullets.projectiles.filter(p => p.vidljiv).length, 0)
  session.update(2)
  const muzzle = boat.muzzle
  boat.update(0)
  const shot = boat.bullets.projectiles.find(p => p.vidljiv)
  assert.ok(shot)
  assert.equal(shot.x, muzzle.x)
  assert.equal(shot.y, muzzle.y)
  assert.equal(shot.ugao, boat.gunAngle)
  assert.equal(shot.steta, 5)
  const fired = boat.bullets.projectiles.filter(p => p.vidljiv).length
  session.pause()
  session.update(5)
  boat.update(1)
  assert.equal(boat.bullets.projectiles.filter(p => p.vidljiv).length, fired)
  session.resume()
  session.update(.3)
  boat.postavi(target.x + 30, target.y)
  boat.update(0)
  assert.equal(boat.bullets.projectiles.filter(p => p.vidljiv).length, fired)
  boat.reagujNaPogodak(60)
  session.update(5)
  boat.update(1)
  assert.equal(boat.bullets.projectiles.filter(p => p.vidljiv).length, fired)
})

test('S-boat rounds use the shared local combat phase and leave existing shots in flight after destruction', t => {
  const { session, target, boat } = setup(t)
  const combat = new BoatCombat(session)
  combat.add(boat, 'axis')
  combat.add(target, 'partisan')
  boat.launch(1)
  boat.postavi(450, target.y)
  session.update(2)
  boat.update(0)
  const shot = boat.bullets.projectiles.find(p => p.vidljiv)
  assert.ok(shot)
  boat.reagujNaPogodak(60)
  combat.beginFrame()
  shot.update(.8)
  combat.resolve()
  assert.equal(target.energija, 95)
  assert.equal(shot.vidljiv, false)
})
