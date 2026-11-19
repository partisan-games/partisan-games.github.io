import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Potez, airspeed, GameSession, FranjoKluzScene

before(async() => {
  createPageElements()
  ;({ default: Potez, airspeed } = await import('/scenes/franjo-kluz/Potez.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  FranjoKluzScene = (await import('/scenes/franjo-kluz/Main.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

function createPlane(t, { session = new GameSession(), groundY = 10_000 } = {}) {
  const plane = new Potez({ groundY, camera: { cameraX: 0, cameraY: 0 }, session })
  t.after(() => plane.end())
  return plane
}

function createScene(t) {
  const scene = new FranjoKluzScene({})
  scene.init()
  scene.clear = () => {}
  scene.session.start()
  t.after(() => scene.end())
  return scene
}

test('the plane shoots on Space, not on Enter', t => {
  const plane = createPlane(t)
  const attacksOn = code => {
    key('keydown', code)
    const { attack } = plane.input
    key('keyup', code)
    return Boolean(attack)
  }

  assert.equal(attacksOn('Space'), true)
  assert.equal(attacksOn('Enter'), false)
})

test('the plane rockets reload only on their game clock and cannot fire after the result', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session })
  plane.shoot()
  assert.equal(plane.bullets.projectiles.length, 1)
  session.update(1)
  session.pause()
  session.update(100)
  plane.shoot()
  assert.equal(plane.bullets.projectiles.length, 1)
  session.resume()
  session.update(.5)
  plane.shoot()
  assert.equal(plane.bullets.projectiles.length, 2)
  session.finish()
  session.update(100)
  plane.shoot()
  assert.equal(plane.bullets.projectiles.length, 2)
})

test('a fired rocket keeps the plane\'s own speed', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session })
  plane.update(1 / 30)
  plane.shoot()
  const [rocket] = plane.bullets.projectiles
  const angle = plane.angle + Math.PI / 16
  assert.ok(Math.abs(rocket.dx - (500 * Math.cos(angle) + plane.dx)) < 1e-9)
})

test('a tilted plane levels out exactly, also when frame lengths vary', t => {
  const plane = createPlane(t)
  plane.angle = .05

  for (let i = 0; i < 120; i++) plane.update(i % 2 ? 1 / 50 : 1 / 70)
  assert.equal(plane.angle, 0)
  plane.update(1 / 60)
  assert.equal(plane.angle, 0)
})

test('the plane flies forward at its airspeed, the same at 30 and at 60 frames per second', t => {
  const flown = fps => {
    const plane = createPlane(t)
    const startX = plane.x
    for (let i = 0; i < fps; i++) plane.update(1 / fps)
    return plane.x - startX
  }

  assert.ok(Math.abs(flown(30) - airspeed.start) < 1e-6)
  assert.ok(Math.abs(flown(60) - airspeed.start) < 1e-6)
})

test('throttle changes airspeed within its limits, and the plane cannot slow down on the ground', t => {
  const plane = createPlane(t)
  for (let i = 0; i < 300; i++) plane.moveRight(1 / 30)
  assert.equal(plane.airspeed, airspeed.max)
  for (let i = 0; i < 300; i++) plane.moveLeft(1 / 30)
  assert.equal(plane.airspeed, airspeed.min)

  const grounded = createPlane(t, { groundY: 200 })
  grounded.height = 20 // the image does not load in tests
  grounded.moveLeft(1 / 30)
  assert.equal(grounded.airspeed, airspeed.start)
})

test('the camera keeps the plane in view at every height and never shows below the ground', t => {
  const scene = createScene(t)
  scene.player.width = 100 // the image does not load in tests
  const fly = (seconds, steer) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer?.()
      scene.update(1 / 30, i / 30)
      assert.equal(scene.player.offScreen, false, `plane at ${scene.player.x}, ${scene.player.y}`)
      assert.ok(scene.cameraY <= 0)
    }
  }
  fly(5, () => scene.player.moveRight(1 / 30))
  fly(5, () => scene.player.moveLeft(1 / 30))
  scene.player.y = -3000
  fly(1)
  scene.player.y = scene.height - 30
  fly(1 / 30)
  assert.equal(scene.cameraY, 0, 'near the ground the view rests on it')
})

test('the airfield stays at its place in the world while the plane flies on', t => {
  const scene = createScene(t)
  const airfieldX = scene.aerodrom.x
  for (let i = 0; i < 60 * 30; i++) {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
  assert.equal(scene.aerodrom.x, airfieldX)
  assert.ok(scene.cameraX > airfieldX, 'the plane has flown past it')
})

test('right moves the plane forward across the screen and speeds the flight up; left moves it back and slows it', t => {
  const scene = createScene(t)
  scene.player.width = 100 // the image does not load in tests
  const screenX = () => scene.player.x - scene.cameraX
  const hold = (steer, seconds) => {
    for (let i = 0; i < seconds * 30; i++) {
      steer(1 / 30)
      scene.update(1 / 30, i / 30)
    }
  }
  const startX = screenX()
  hold(dt => scene.player.moveRight(dt), 1)
  assert.ok(screenX() > startX + 100, `forward: ${startX} → ${screenX()}`)
  assert.ok(scene.player.airspeed > airspeed.start + 100, 'faster')
  const forwardX = screenX(), fastSpeed = scene.player.airspeed
  hold(dt => scene.player.moveLeft(dt), 1)
  assert.ok(screenX() < forwardX - 100, `back: ${forwardX} → ${screenX()}`)
  assert.ok(scene.player.airspeed < fastSpeed - 100, 'slower')
})

test('the plane is drawn in front of the buildings and the vehicle it can crash into', t => {
  // Objects of the same depth are drawn in the order of the scene's children (happy-dom has no 2D canvas).
  const scene = createScene(t)
  const order = scene.children
  for (const body of [scene.aerodrom, scene.ruina, scene.vozilo]) {
    assert.equal(body.position.z, scene.player.position.z)
    assert.ok(order.indexOf(body) < order.indexOf(scene.player))
  }
})

test('a shot down plane blows up, tumbles as it falls, blows up again on the ground, and only then the game is lost', t => {
  const scene = createScene(t)
  const plane = scene.player
  plane.width = 100 // the image does not load in tests
  plane.height = 40
  plane.die()
  const [hit, ground] = plane.bursts
  assert.equal(hit.visible, true, 'a burst where it was hit')
  const fallAngle = plane.angle
  const frame = i => {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
  let i = 0
  while (!plane.wrecked && i < 300) frame(i++)
  assert.equal(plane.wrecked, true, 'it reached the ground')
  assert.ok(i > 10, 'it fell for a while, not at once')
  assert.notEqual(plane.angle, fallAngle, 'it tumbled')
  assert.equal(ground.visible, true, 'a second burst on the ground')
  assert.equal(scene.ui.outro, '', 'the crash is seen before the defeat screen')
  for (let j = 0; j < 60; j++) frame(i + j)
  assert.match(scene.ui.outro, /Game over/)
})
