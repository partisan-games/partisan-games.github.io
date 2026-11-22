import { test } from 'node:test'
import assert from 'node:assert/strict'
import Potez, { airspeed, flight, plane, gun } from '/core/gameplay/bodies/aircraft/Potez.js'
import PlaneKeys from '/core/gameplay/controllers/PlaneKeys.js'
import RearGunner from '/core/gameplay/controllers/RearGunner.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

const target = (x, y) => new Body({ x, y, size: { length: 10, height: 4, width: 12 }, states: { idle: {}, dead: {} } })

/** The plane 60 m up at x 10 on its own clock, with no page; `keys` are held on a fake input the keys read. */
function planeAlone({ canFire = () => true, onGround = false, ...options } = {}) {
  const clock = new GameClock()
  const body = new Potez({ x: 10, y: 60, clock, canFire, onGround, ...options })
  const input = { keyboard: { pressed: {} } }
  const keys = new PlaneKeys(body, { input, bombKey: 'Enter' })
  const live = (seconds, fps = 30) => {
    for (let i = 0; i < seconds * fps; i++) {
      clock.advance(1 / fps)
      keys.handleInput(1 / fps)
      body.update(1 / fps)
    }
  }
  return { body, input, live, clock }
}

test('the plane flies on at its airspeed, as far at 30 as at 60 frames a second', () => {
  const at = fps => {
    const { body, live } = planeAlone()
    live(2, fps)
    return body.x
  }
  assert.ok(Math.abs(at(30) - (10 + 2 * airspeed.start)) < 1e-9)
  assert.ok(Math.abs(at(30) - at(60)) < 1e-9)
})

test('throttle changes airspeed within its limits, and the plane cannot slow down on the ground', () => {
  const { body, input, live } = planeAlone()
  input.right = true
  live(10)
  assert.equal(body.airspeed, airspeed.max)
  input.right = false
  input.left = true
  live(10)
  assert.equal(body.airspeed, airspeed.min)
  const grounded = planeAlone({ onGround: true })
  grounded.body.airspeed = 10
  grounded.input.left = true
  grounded.live(1 / 30)
  assert.ok(Math.abs(grounded.body.airspeed - 10 * flight.rollOut ** (1 / 30)) < 1e-9, 'only rolling out')
})

test('holding fire fires the gun from the nose with the plane speed, as often at 30 as at 60 frames a second', () => {
  const shots = fps => {
    const { body, input, live } = planeAlone()
    input.attack = true
    live(1, fps)
    return body
  }
  assert.ok(Math.abs(shots(30).shotsFired - shots(60).shotsFired) <= 1, 'the reload ends on whichever frame comes first')
  const body = shots(30)
  assert.equal(body.ammo, plane.ammo - body.shotsFired)
  const [round] = body.bullets.projectiles
  assert.ok(round.vx > gun.speed, 'the plane speed is added')
})

test('the gun stops when its rounds are spent, and fires nothing after the result', () => {
  let running = true
  const { body, input, live } = planeAlone({ canFire: () => running })
  body.ammo = 2
  input.attack = true
  live(1)
  assert.equal(body.shotsFired, 2)
  body.ammo = 10
  running = false
  live(1)
  assert.equal(body.shotsFired, 2)
})

test('each press of the bomb key drops one bomb, no faster than its interval, and only as many as it carries', () => {
  const impacts = []
  const { body, input, live } = planeAlone({ onBombImpact: point => impacts.push(point) })
  const press = () => {
    input.keyboard.pressed.Enter = true
    live(1 / 30)
    input.keyboard.pressed.Enter = false
    live(1 / 30)
  }
  press()
  press()
  assert.equal(body.bombs, plane.bombs - 1, 'the second press came within the interval')
  for (let i = 0; i < 10; i++) {
    live(plane.bombInterval)
    press()
  }
  assert.equal(body.bombs, 0)
  assert.equal(body.bombsDropped, plane.bombs)
  live(3)
  assert.equal(impacts.length, plane.bombs)
  assert.ok(impacts[0].x > 10 + airspeed.start, 'a bomb keeps the plane speed')
})

test('a tilted plane levels out exactly once no key tilts it, also with uneven frames', () => {
  const { body, input, live } = planeAlone()
  input.up = true
  live(1)
  assert.ok(body.pitch > flight.maxTilt && body.pitch < flight.maxTilt + flight.tiltRate / 30 + 1e-9)
  input.up = false
  for (const dt of [.016, .05, .033, .1, .02, .5])
    body.update(dt)

  assert.equal(body.pitch, 0)
})

test('hits wear the plane down: it smokes when damaged, falls tumbling at the last hit and is wrecked on the ground', () => {
  const { body, live } = planeAlone()
  body.takeHit(60)
  assert.equal(body.burning, true)
  assert.equal(body.alive, true)
  body.takeHit(40)
  assert.equal(body.state, 'falling')
  assert.equal(body.dead, true, 'the shot-down plane cannot fight while falling')
  live(1 / 30)
  assert.ok(body.pitch < 0, 'nose over')
  live(5)
  assert.equal(body.wrecked, true)
  assert.equal(body.state, 'dead')
  assert.equal(body.pitch, 0)
  assert.equal(body.y, body.groundAt(body.x) + body.size.height / 2)
  assert.equal(body.vx, 0)
})

test('falling ends with ground contact and settling at 30, 60 and 144 Hz, including a raised ground', () => {
  for (const fps of [30, 60, 144]) {
    const ground = 4
    const { body } = planeAlone({ y: 14, groundAt: () => ground })
    body.setState('falling')
    assert.equal(body.dead, true)
    assert.equal(body.state, 'falling')
    body.shoot()
    assert.equal(body.shotsFired, 0)
    for (let i = 0; i < fps * 5 && !body.wrecked; i++) body.update(1 / fps)
    assert.equal(body.wrecked, true)
    assert.equal(body.state, 'falling', 'impact leaves time to lower the tail')
    assert.ok(Math.abs(body.pitch) > .1)
    assert.ok(Math.abs(body.y - body.groundClearance - ground) < 1e-9)
    const { x } = body
    const impactPitch = Math.abs(body.pitch)
    body.update(1 / fps)
    assert.ok(Math.abs(body.pitch) < impactPitch, 'the tail starts lowering after impact')
    for (let i = 0; i < fps; i++) {
      body.update(1 / fps)
      assert.ok(Math.abs(body.y - body.groundClearance - ground) < 1e-9, 'the rotated wreck stays on the ground')
    }
    assert.equal(body.state, 'dead')
    assert.equal(body.pitch, 0)
    assert.equal(body.y, ground + body.size.height / 2)
    assert.equal(body.x, x)
    assert.equal(body.vx, 0)
    assert.equal(body.vy, 0)
  }
})

test('a plane destroyed on the runway stays on the ground and ends as a stationary level wreck', () => {
  const { body, live } = planeAlone({ onGround: true })
  body.takeHit(1000)
  live(1)
  assert.equal(body.state, 'dead')
  assert.equal(body.wrecked, true)
  assert.equal(body.pitch, 0)
  assert.equal(body.y, body.size.height / 2)
  assert.equal(body.vx, 0)
})

test('a live enemy it flies into destroys it and itself; a wreck only damages it once', () => {
  const wreck = target(10, 60)
  wreck.setState('dead')
  const live = target(30, 60)
  const { body, live: fly } = planeAlone({ solids: [wreck, live] })
  fly(1 / 30)
  fly(1 / 30)
  assert.equal(body.health.current, plane.health - plane.wreckDamage)
  fly(2)
  assert.equal(body.state, 'falling')
  assert.equal(live.state, 'dead')
})

test('the observer aims at the nearest fighter behind in reach, fires from his barrel while fire is held, and swings back with none', () => {
  const near = target(0, 60), far = target(-5, 60), ahead = target(25, 60)
  const fighters = [far, ahead, near]
  const { body, input, live } = planeAlone({ fighters })
  const observer = new RearGunner(body, { fighters })
  const step = () => {
    observer.update()
    live(1 / 30)
  }
  step()
  assert.equal(body.rearTarget, near)
  assert.equal(body.shotsFired, 0, 'only while fire is held')
  input.attack = true
  body.ammo = 0
  step()
  assert.equal(body.shotsFired, 1, 'the observer fires on when the front gun is empty')
  const [round] = body.rearBullets.projectiles
  assert.ok(round.vx < body.vx, 'back towards the fighter')
  input.attack = false
  fighters.length = 0
  step()
  assert.equal(body.rearTarget, null)
  for (let i = 0; i < 30; i++) step()
  assert.ok(Math.abs(body.rearAim - (Math.PI + body.pitch)) < 1e-9, 'straight back again')
})

test('a Potez holds its height in level flight; it sinks only by the sink its game gives', () => {
  const { body: level } = planeAlone()
  const { body: sinking } = planeAlone({ sink: 2.92 })
  for (let i = 0; i < 30; i++) {
    level.update(1 / 30)
    sinking.update(1 / 30)
  }
  assert.ok(Math.abs(level.y - 60) < 1e-9, `level: ${level.y}`)
  assert.ok(sinking.y < 59.5, `sinking: ${sinking.y}`)
})

test('a bomb falls by the gravity of its world, as much stronger as its games drop bombs', async() => {
  const { default: Bomb, bomb } = await import('/core/gameplay/bodies/projectiles/Bomb.js')
  const earth = new Bomb(), moon = new Bomb({ gravity: 1.62 })
  assert.ok(Math.abs(earth.pull - 16.21) < 1e-9, 'the earth pull of the games where bombs fall')
  assert.ok(Math.abs(moon.pull - 1.62 * bomb.fall) < 1e-9)
})
