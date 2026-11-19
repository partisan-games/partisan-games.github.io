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

/** The scene with sizes the images would give, and the plane put just above the ground at `x`. */
function approach(t, x, { airspeed: speed = 250, sink = 50, tankDestroyed = true } = {}) {
  const scene = createScene(t)
  const { player, aerodrom } = scene
  aerodrom.width = 400
  player.width = 100
  player.height = 40
  if (tankDestroyed) scene.vozilo.die()
  const runwayX = x(aerodrom.runway)
  player.setPosition(runwayX, scene.height - player.height / 2 - 1)
  scene.cameraX = runwayX - 200
  player.airspeed = speed
  player.dy = sink
  return scene
}

const play = (scene, seconds) => {
  for (let i = 0; i < seconds * 30; i++) {
    scene.session.update(1 / 30)
    scene.update(1 / 30, i / 30)
  }
}

test('a slow landing on the runway after the tank is destroyed wins, and says how soft it was', t => {
  const soft = approach(t, runway => runway.left + 100)
  play(soft, 3)
  assert.match(soft.ui.outro, /Mission successfully completed! A soft landing/)

  const hard = approach(t, runway => runway.left + 100, { sink: 250 })
  play(hard, 3)
  assert.match(hard.ui.outro, /A hard landing/)
})

test('touching the ground off the runway or too fast wrecks the plane', t => {
  const short = approach(t, runway => runway.left - 300)
  play(short, 1 / 15)
  assert.equal(short.player.wrecked, true, 'before the runway')

  const fast = approach(t, runway => runway.left + 100, { airspeed: 700 })
  play(fast, 1 / 15)
  assert.equal(fast.player.wrecked, true, 'too fast')
})

test('landing while the tank still fights is no victory, and flying past the runway loses the mission', t => {
  const early = approach(t, runway => runway.left + 100, { tankDestroyed: false })
  play(early, 3)
  assert.equal(early.player.alive, true)
  assert.equal(early.ui.outro, '')

  const past = approach(t, runway => runway.right + 50)
  past.player.y -= 300
  play(past, 1 / 15)
  assert.match(past.ui.outro, /You missed the airfield/)
})

test('the ruin never comes back over the airfield or its runway', t => {
  const scene = createScene(t)
  const { aerodrom, ruina } = scene
  aerodrom.width = 400
  ruina.width = 300
  for (let i = 0; i < 200; i++) {
    scene.cameraX = aerodrom.x - 3000 + i * 20
    ruina.x = scene.cameraX - 1000
    scene.returnRuin()
    const clear = ruina.x - ruina.width / 2 > aerodrom.runway.right || ruina.x + ruina.width / 2 < aerodrom.x - aerodrom.width / 2
    assert.ok(clear, `ruin at ${ruina.x}`)
  }
})

test('the plane rolls on top of the asphalt runway, not in it', t => {
  const scene = approach(t, runway => runway.left + 100)
  play(scene, 1)
  assert.equal(scene.player.y + scene.player.height / 2, scene.aerodrom.surface)
  assert.ok(scene.aerodrom.surface < scene.height)
})

test('the asphalt runway is drawn from the airfield building to the end of the runway', t => {
  const scene = createScene(t)
  const [runway] = scene.aerodrom.children
  assert.ok(runway.image.src.endsWith('textures/terrain/asphalt.jpg'))
  assert.ok(scene.aerodrom.children.includes(runway))
})

test('a landing survives with the nose tipped down by the descent or up in a flare, and with down held, but not a plunge', t => {
  for (const angle of [.07, 2 * Math.PI - .07]) {
    const scene = approach(t, runway => runway.left + 100, { sink: 100 })
    scene.player.angle = angle
    play(scene, 3)
    assert.match(scene.ui.outro, /Mission successfully completed/, `angle ${angle}`)
  }
  const held = approach(t, runway => runway.left + 100, { airspeed: 550, sink: 306 })
  play(held, 3)
  assert.match(held.ui.outro, /A hard landing/)
  const plunge = approach(t, runway => runway.left + 100, { sink: 400 })
  play(plunge, 3)
  assert.equal(plunge.player.wrecked, true)
  assert.match(plunge.ui.outro, /You landed too hard/)
})
