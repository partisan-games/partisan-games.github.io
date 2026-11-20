import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let Flak, flak, GameSession, GameObject2D

before(async() => {
  createPageElements()
  ;({ default: Flak, flak } = await import('/core/actor/artillery/Flak.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

const planeHealth = 100

/** A gun alone with a plane that only counts the damage it takes; nothing of a game around them. */
function gunAlone(t, { camera = { cameraX: 0, cameraY: 0 }, groundY = 700, x = 1000 } = {}) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const plane = new GameObject2D(null, { x: 0, y: 0, width: 200, height: 60 })
  plane.health = planeHealth
  plane.takeHit = damage => {
    plane.health -= damage
  }
  const gun = new Flak({ targets: [plane], session, camera, groundY, x })
  gun.y = groundY - 30 // the image does not load in tests
  return { gun, plane, session }
}

/** Starts a shot at once at the plane and returns whether it left the gun, once the barrel has turned there. */
function fires(gun, plane) {
  gun.aimPoint = null
  gun.aimAt(plane)
  gun.cooldown.start(0)
  gun.trainBarrel(10)
  gun.fire()
  const fired = gun.shell.visible
  gun.shell.reset()
  return fired
}

test('the flak bursts its shell where it aims, and the burst hurts a target only close by', t => {
  const { gun, plane } = gunAlone(t)
  plane.setPosition(gun.x - 300, gun.y - 500)
  const aim = { x: gun.x - 100, y: gun.y - 600 }
  assert.equal(gun.aimAt(aim), true)
  gun.cooldown.start(0)
  gun.trainBarrel(10) // the barrel turns onto the point first
  gun.fire()
  assert.equal(gun.shell.visible, true)
  const { breech } = gun
  assert.ok(Math.abs(gun.shell.fuse - Math.hypot(aim.x - breech.x, aim.y - breech.y) / flak.shellSpeed) < 1e-9, 'the fuse bursts it there')
  gun.burst({ x: plane.x, y: plane.y })
  assert.equal(plane.health, planeHealth - flak.damage)
  gun.burst({ x: plane.x + flak.burstRadius * 2, y: plane.y })
  assert.equal(plane.health, planeHealth - flak.damage, 'a far burst does no harm')
})

test('the flak cannot aim out of range or below itself, and holds fire after the result', t => {
  const { gun, plane, session } = gunAlone(t)
  plane.setPosition(gun.x, gun.y - 500)
  assert.equal(fires(gun, plane), true)
  plane.setPosition(gun.x + flak.range * 2, gun.y - 500)
  assert.equal(gun.aimAt(plane), false, 'out of range')
  assert.equal(fires(gun, plane), false)
  plane.setPosition(gun.x + 100, gun.y + 10)
  assert.equal(gun.aimAt(plane), false, 'below the gun')
  assert.equal(fires(gun, plane), false)
  plane.setPosition(gun.x, gun.y - 500)
  session.finish()
  assert.equal(fires(gun, plane), false, 'after the result')
})

test('the flak barrel turns towards the plane at its own pace and fires only once it points there', t => {
  const { gun, plane } = gunAlone(t)
  gun.setState('fire')
  plane.setPosition(gun.x + 400, gun.y - 400)
  gun.aimAt(plane)
  gun.cooldown.start(0)
  const wanted = gun.aimAngle
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
  gun.aimAt(plane)
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

test('the PVO flash belongs to an actual shot, follows its muzzle and expires', t => {
  const { gun, plane } = gunAlone(t, { groundY: 500, x: 200 })
  gun.y = 400
  plane.setPosition(100, 100)
  gun.aimAt(plane)
  gun.cooldown.start(0)
  gun.fire()
  assert.equal(gun.muzzleFlash.visible, false, 'no flash before the barrel is on target')
  gun.trainBarrel(10)
  gun.fire()
  assert.equal(gun.muzzleFlash.visible, true)
  assert.equal(gun.muzzleFlash.x, gun.muzzle.x)
  assert.equal(gun.muzzleFlash.y, gun.muzzle.y)
  gun.elevation -= .1
  gun.placeBarrel()
  assert.equal(gun.muzzleFlash.x, gun.muzzle.x)
  assert.equal(gun.muzzleFlash.y, gun.muzzle.y)
  assert.ok(Math.abs(Math.sin(gun.muzzleFlash.angle - gun.elevation)) < 1e-10)
  gun.muzzleFlash.update(1)
  assert.equal(gun.muzzleFlash.visible, false)
})

test('the barrel stays visible in a distant world viewport', t => {
  const view = { cameraX: 5000, cameraY: 1000 }
  const { gun } = gunAlone(t, { camera: view, x: 5300, groundY: 1500 })
  loadAtlas(gun, 204, 122)
  gun.barrel.width = 80
  gun.barrel.height = 60
  assert.equal(gun.barrel.x, gun.breech.x, 'placed as soon as the parent image loads')
  assert.equal(gun.barrel.y, gun.breech.y)
  assert.equal(gun.barrel.shown, true)
  view.cameraX = 8000
  assert.equal(gun.barrel.shown, false)
})
