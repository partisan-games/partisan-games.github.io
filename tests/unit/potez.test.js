import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Potez, settings, airspeed, gun, GameSession

before(async() => {
  createPageElements()
  ;({ default: Potez, plane: settings, airspeed, gun } = await import('/scenes/franjo-kluz/Potez.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** The plane alone, with a fixed camera and the given session; nothing of a level around it. */
function createPlane(t, { session = new GameSession(), groundY = 10_000 } = {}) {
  const plane = new Potez({ groundY, camera: { cameraX: 0, cameraY: 0 }, session })
  t.after(() => plane.end())
  return plane
}

test('Space fires the machine gun as often at 30 as at 60 frames per second, and not after the result', t => {
  const shots = fps => {
    const session = new GameSession()
    session.start()
    const plane = createPlane(t, { session })
    key('keydown', 'Space')
    for (let i = 0; i < fps; i++) {
      session.update(1 / fps)
      plane.handleInput(1 / fps)
    }
    key('keyup', 'Space')
    const fired = plane.bullets.projectiles.length
    session.finish()
    plane.shoot()
    session.update(1)
    plane.shoot()
    assert.equal(plane.bullets.projectiles.length, fired, 'no shot after the result')
    return fired
  }
  // shots start on whole frames, so a second may hold one shot less
  for (const fps of [30, 60]) {
    const fired = shots(fps)
    assert.ok(Math.abs(fired - 1 / gun.reload) <= 1, `${fired} shots in a second at ${fps} fps`)
  }
})

test('bullets fly where the nose points, with the plane speed', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session })
  plane.dx = 300
  plane.dy = 0
  plane.angle = .3
  plane.shoot()
  const [bullet] = plane.bullets.projectiles
  assert.ok(Math.abs(bullet.dx - (gun.speed * Math.cos(.3) + 300)) < 1e-9)
  assert.ok(Math.abs(bullet.dy - gun.speed * Math.sin(.3)) < 1e-9)
})

test('hits wear the plane down: it smokes when damaged and falls at the last hit', t => {
  const plane = createPlane(t)
  plane.flame = {} // the flame module loads later in tests
  plane.takeHit(settings.health / 4)
  assert.equal(plane.burning, false)
  plane.takeHit(settings.health / 2)
  assert.equal(plane.burning, true, 'smoke')
  assert.equal(plane.alive, true)
  plane.takeHit(settings.health / 4)
  assert.equal(plane.dead, true)
})

test('Enter drops one bomb per press, no faster than one per interval, and only as many as the plane carries', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session })
  const dropped = () => plane.bombBay.filter(bomb => bomb.visible).length
  key('keydown', 'Enter')
  plane.handleInput(1 / 30)
  plane.handleInput(1 / 30)
  key('keyup', 'Enter')
  plane.handleInput(1 / 30)
  assert.equal(dropped(), 1, 'holding the key drops one bomb')
  plane.dropBomb()
  assert.equal(dropped(), 1, 'the next bomb waits for its interval')
  session.update(settings.bombInterval / 2)
  plane.dropBomb()
  assert.equal(dropped(), 1, 'half the interval is not enough')
  for (let i = 0; i < settings.bombs + 2; i++) {
    session.update(settings.bombInterval)
    plane.dropBomb()
  }
  assert.equal(dropped(), settings.bombs)
  assert.equal(plane.bombs, 0)
})

test('no bomb falls before the start or after the result', t => {
  const session = new GameSession()
  const plane = createPlane(t, { session })
  plane.dropBomb()
  session.start()
  session.finish()
  plane.dropBomb()
  assert.equal(plane.bombs, settings.bombs)
})

/** Drops a bomb 300 px above the ground at `speed`, plays it at `fps`, and returns where it hit the ground. */
function bombImpact(t, { speed, fps = 30 }) {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session, groundY: 1000 })
  plane.setPosition(0, 700)
  plane.dx = speed
  plane.dy = 0
  plane.dropBomb()
  const [bomb] = plane.bombBay
  const impacts = []
  bomb.onImpact = ({ x, y }) => impacts.push({ x, y })
  for (let i = 0; i < fps * 10 && bomb.visible; i++) bomb.update(1 / fps)
  return impacts[0]
}

test('a bomb keeps the plane speed and falls on a path that the speed decides, at any frame rate', t => {
  const slow = bombImpact(t, { speed: 300 })
  const fast = bombImpact(t, { speed: 900 })
  const at60 = bombImpact(t, { speed: 300, fps: 60 })
  assert.equal(slow.y, 1000)
  assert.ok(fast.x > slow.x * 2.5, `${slow.x} → ${fast.x}`)
  assert.ok(Math.abs(at60.x - slow.x) < 15, `30 fps ${slow.x}, 60 fps ${at60.x}`)
})

test('a bomb destroys a target in its blast and spares one it misses', t => {
  const plane = createPlane(t)
  const target = x => ({
    x, y: 1000, width: 60, height: 30, alive: true,
    die() {
      this.alive = false
    },
  })
  const near = target(settings.blastRadius)
  const far = target(settings.blastRadius + 200)
  plane.targets.push(near, far)
  plane.blast({ x: 0, y: 1000 })
  assert.equal(near.alive, false)
  assert.equal(far.alive, true)
  assert.equal(plane.bombBursts.some(burst => burst.visible), true, 'a burst where it fell')
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

test('the gun stops when its rounds are spent', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session })
  assert.equal(plane.ammo, settings.ammo)
  plane.ammo = 1
  plane.shoot()
  session.update(1)
  plane.shoot()
  assert.equal(plane.ammo, 0)
  assert.equal(plane.bullets.projectiles.length, 1)
})

test('a shot down plane blows up, tumbles as it falls and blows up again on the ground', t => {
  const session = new GameSession()
  session.start()
  const plane = createPlane(t, { session, groundY: 1000 })
  plane.width = 100 // the image does not load in tests
  plane.height = 40
  plane.setPosition(500, 200)
  plane.die()
  const [hit, ground] = plane.bursts
  assert.equal(hit.visible, true, 'a burst where it was hit')
  const fallAngle = plane.angle
  let frames = 0
  while (!plane.wrecked && frames < 300) {
    session.update(1 / 30)
    plane.update(1 / 30, frames++ / 30)
  }
  assert.equal(plane.wrecked, true, 'it reached the ground')
  assert.ok(frames > 10, 'it fell for a while, not at once')
  assert.notEqual(plane.angle, fallAngle, 'it tumbled')
  assert.equal(ground.visible, true, 'a second burst on the ground')
})
