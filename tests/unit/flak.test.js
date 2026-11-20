import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Flak, flak, GameSession, GameObject2D

before(async() => {
  createPageElements()
  ;({ default: Flak, flak } = await import('/scenes/franjo-kluz/Flak.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

const planeHealth = 100

/** A gun alone with a plane that only counts the damage it takes; nothing of a game around them. */
function gunAlone(t) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const plane = new GameObject2D(null, { x: 0, y: 0, width: 200, height: 60 })
  plane.health = planeHealth
  plane.takeHit = damage => {
    plane.health -= damage
  }
  const groundY = 700
  const gun = new Flak({ plane, session, camera: { cameraX: 0, cameraY: 0 }, groundY, x: 1000 })
  gun.y = groundY - 30 // the image does not load in tests
  return { gun, plane, session }
}

/** Starts a shot at once and returns whether it left the gun, once the barrel has turned onto the plane. */
function fires(gun) {
  gun.cooldown.start(0)
  gun.trainBarrel(10)
  gun.fire()
  const fired = gun.shell.visible
  gun.shell.reset()
  return fired
}

test('the flak leads the plane, and its burst hurts the plane only close by', t => {
  const { gun, plane } = gunAlone(t)
  plane.setPosition(gun.x - 300, gun.y - 500)
  plane.dx = 300
  plane.dy = 0
  const target = gun.aim()
  assert.ok(target.x > plane.x, 'it aims ahead of the plane')
  gun.cooldown.start(0)
  gun.trainBarrel(10) // the barrel turns onto the plane first
  gun.fire()
  assert.equal(gun.shell.visible, true)
  gun.burst({ x: plane.x, y: plane.y })
  assert.equal(plane.health, planeHealth - flak.damage)
  gun.burst({ x: plane.x + flak.burstRadius * 2, y: plane.y })
  assert.equal(plane.health, planeHealth - flak.damage, 'a far burst does no harm')
})

test('the flak holds fire out of range, at a plane below it, and after the result', t => {
  const { gun, plane, session } = gunAlone(t)
  plane.setPosition(gun.x, gun.y - 500)
  assert.equal(fires(gun), true)
  plane.setPosition(gun.x + flak.range * 2, gun.y - 500)
  assert.equal(fires(gun), false, 'out of range')
  plane.setPosition(gun.x + 100, gun.y + 10)
  assert.equal(fires(gun), false, 'below the gun')
  plane.setPosition(gun.x, gun.y - 500)
  session.finish()
  assert.equal(fires(gun), false, 'after the result')
})

test('the flak barrel turns towards the plane at its own pace and fires only once it points there', t => {
  const { gun, plane } = gunAlone(t)
  gun.setState('fire')
  plane.setPosition(gun.x + 400, gun.y - 400)
  gun.cooldown.start(0)
  const wanted = gun.aim().angle
  const start = gun.elevation
  gun.update(1 / 30)
  assert.ok(Math.abs(gun.elevation - start) <= 1.5 / 30 + 1e-9, 'one step at a time')
  assert.equal(gun.shell.visible, false, 'not yet on target')
  for (let i = 0; i < 90; i++) gun.update(1 / 30)
  assert.ok(Math.abs(gun.elevation - wanted) < .01, 'on target')
  assert.equal(gun.shell.visible, true, 'and firing')
  const { x, y } = gun.breech
  assert.equal(gun.barrel.x, x, 'the barrel turns about the breech')
  assert.equal(gun.barrel.y, y)
})

test('a flak at ease neither trains its barrel nor fires, until set to fire', t => {
  const { gun, plane } = gunAlone(t)
  assert.deepEqual(gun.states, ['idle', 'fire', 'dead'])
  assert.equal(gun.state, 'idle')
  plane.setPosition(gun.x + 400, gun.y - 400)
  gun.cooldown.start(0)
  const start = gun.elevation
  for (let i = 0; i < 90; i++) gun.update(1 / 30)
  assert.equal(gun.elevation, start, 'the barrel stays')
  assert.equal(gun.shell.visible, false, 'no shot')

  gun.setState('fire')
  for (let i = 0; i < 90; i++) gun.update(1 / 30)
  assert.notEqual(gun.elevation, start, 'the barrel turns')
  assert.equal(gun.shell.visible, true, 'and it fires')
})
