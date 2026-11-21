import { test } from 'node:test'
import assert from 'node:assert/strict'
import MachineGunner, { machineGun } from '/core/gameplay/bodies/soldiers/MachineGunner.js'
import Grenadier, { grenadier } from '/core/gameplay/bodies/soldiers/Grenadier.js'
import Patrol, { patrol } from '/core/gameplay/bodies/soldiers/Patrol.js'
import WoundedSoldier from '/core/gameplay/bodies/soldiers/WoundedSoldier.js'
import Wander, { wander } from '/core/gameplay/controllers/Wander.js'
import GameClock from '/core/runtime/GameClock.js'

const live = (clock, bodies, seconds, fps = 30) => {
  for (let i = 0; i < seconds * fps; i++) {
    clock.advance(1 / fps)
    for (const body of bodies) body.update(1 / fps)
  }
}

test('a machine gunner turns his gun where he aims and fires bursts of five after his wait, which kill', () => {
  const clock = new GameClock()
  const target = new Grenadier({ x: 2.5, z: 12.5 })
  const gunner = new MachineGunner({ x: 12.5, z: 12.5, clock, targets: [target] })
  assert.deepEqual(gunner.states, ['idle', 'fire', 'dead'])
  gunner.aimAt(target)
  assert.equal(gunner.forward, -1)
  gunner.setState('fire')
  live(clock, [gunner], machineGun.pause - .1)
  assert.equal(gunner.shotsFired, 0, 'not before his wait')
  live(clock, [gunner], 1)
  assert.equal(gunner.shotsFired, machineGun.burst)
  assert.equal(target.dead, true)
  live(clock, [gunner], machineGun.pause - 1)
  assert.equal(gunner.shotsFired, machineGun.burst, 'then rests')
})

test('a grenadier walks where he is pushed, as far at 30 as at 60 frames a second, and stops when let go', () => {
  const at = fps => {
    const clock = new GameClock()
    const body = new Grenadier({ x: 0, z: 0 })
    for (let i = 0; i < fps / 2; i++) {
      body.steer(1, 0, 1 / fps)
      live(clock, [body], 1 / fps, fps)
    }
    return body
  }
  const [x30, x60] = [at(30).x, at(60).x]
  assert.ok(Math.abs(x30 - x60) < x60 * .15, `${x30} and ${x60}`)
  const clock = new GameClock()
  const body = at(30)
  live(clock, [body], 2)
  assert.ok(body.speed < .1)
  body.setState('dead')
  const { vx } = body
  body.steer(1, 0, 1)
  assert.equal(body.vx, vx, 'the dead do not walk')
})

test('a grenadier throws his grenade the way he last walked, 5 m from him, where it bursts once', () => {
  const clock = new GameClock()
  const bursts = []
  const body = new Grenadier({ x: 50, z: 50, onBurst: point => bursts.push(point) })
  body.steer(1, 0, .1)
  live(clock, [body], 1)
  assert.equal(body.facing, 1)
  const { x } = body
  assert.equal(body.shoot(), true)
  assert.equal(body.shoot(), false, 'not while he throws')
  body.steer(-1, 0, .1)
  assert.equal(body.facing, 1, 'he stands while he throws')
  live(clock, [body], grenadier.throw.release - .05)
  assert.equal(body.grenade.active, false, 'still in his hand')
  live(clock, [body], 2)
  assert.equal(bursts.length, 1)
  assert.ok(Math.abs(bursts[0].x - (x + grenadier.throw.ahead)) < 1e-9, '5 m from where he stands')
  assert.equal(bursts[0].y, 0, 'on the ground')
  assert.ok(Math.abs(bursts[0].z - (50 + grenadier.throw.feet)) < 1e-9, 'level with his boots, not below them')
  assert.equal(body.state, 'idle')
})

test('a patrol searches on the way it heads at its pace, halts, and a wander turns it now and then within its spread', () => {
  const clock = new GameClock()
  const body = new Patrol({ x: 0, z: 0 })
  assert.deepEqual(body.states, ['search', 'halt'])
  live(clock, [body], 1)
  assert.ok(Math.abs(body.x - patrol.speed) < 1e-9)
  const ways = [.9, .1]
  const walk = new Wander(body, { random: () => ways.shift() ?? .5 })
  walk.update(wander.turnTime)
  assert.ok(Math.abs(body.yaw - .8 * wander.spread) < 1e-9)
  walk.update(wander.turnTime / 2)
  assert.ok(Math.abs(body.yaw - .8 * wander.spread) < 1e-9, 'not before its time')
  body.setState('halt')
  const { x } = body
  live(clock, [body], 1)
  assert.equal(body.x, x)
})

test('a wounded soldier crawls the way he heads, slower back, and turns', () => {
  const clock = new GameClock()
  const body = new WoundedSoldier({ x: 0, z: 0 })
  for (let i = 0; i < 30; i++) {
    body.throttle(1 / 30)
    live(clock, [body], 1 / 30)
  }
  assert.ok(body.x > 0)
  const ahead = body.vx
  body.vx = 0
  for (let i = 0; i < 30; i++) {
    body.back(1 / 30)
    live(clock, [body], 1 / 30)
  }
  assert.ok(body.vx < 0 && -body.vx < ahead)
  body.turn(1, 1)
  assert.ok(body.yaw < 0, 'right turns him down the view')
})

test('a machine gunner\'s rounds leave from the muzzle of his drawn gun, whichever way he turns', async() => {
  const { createPageElements } = await import('./helpers/dom.js')
  createPageElements()
  const { default: MachineGunnerSprite } = await import('/core/actor/soldiers/MachineGunnerSprite.js')
  const { default: art } = await import('/core/actor/soldiers/machineGunnerArt.js')
  const { topProjection } = await import('/core/actor/projection.js')
  const projection = topProjection({ pxPerMeter: 40 })
  for (const yaw of [0, Math.PI / 2, 2.5]) {
    const gunner = new MachineGunner({ x: 5, z: 5, yaw, clock: new GameClock() })
    const view = new MachineGunnerSprite(gunner, { projection, camera: { x: 0, y: 0 } })
    view.update(0)
    // the picture is drawn with its bottom right corner on his place, then turned
    const local = { x: -view.width + art.muzzle.x / art.width * view.width, y: -view.height + art.muzzle.y / art.height * view.height }
    const drawn = {
      x: view.x + local.x * Math.cos(view.angle) - local.y * Math.sin(view.angle),
      y: view.y + local.x * Math.sin(view.angle) + local.y * Math.cos(view.angle),
    }
    const muzzle = projection.point(gunner.muzzle)
    assert.ok(Math.hypot(drawn.x - muzzle.x, drawn.y - muzzle.y) < 1, `yaw ${yaw}: drawn ${JSON.stringify(drawn)}, fired ${JSON.stringify(muzzle)}`)
  }
})
