import { test } from 'node:test'
import assert from 'node:assert/strict'
import MachineGunner, { machineGun } from '/core/gameplay/bodies/soldiers/MachineGunner.js'
import Grenadier, { grenadier } from '/core/gameplay/bodies/soldiers/Grenadier.js'
import Grenade, { grenade } from '/core/gameplay/bodies/projectiles/Grenade.js'
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
  assert.deepEqual(gunner.states, ['idle', 'attack', 'dead'])
  gunner.aimAt(target)
  assert.equal(gunner.forward, -1)
  gunner.setState('attack')
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

test('a grenadier throws short or long, only the grenades he has, and not at all once he falls before letting go', () => {
  const clock = new GameClock()
  const bursts = []
  const body = new Grenadier({ x: 0, z: 0, grenades: 2, onBurst: point => bursts.push(point) })
  body.facing = 1
  assert.deepEqual(body.states, ['idle', 'move', 'attack', 'dead'])
  body.act('throw short')
  assert.equal(body.state, 'attack')
  live(clock, [body], 2)
  body.act('throw long')
  live(clock, [body], 2)
  assert.deepEqual(bursts.map(point => Math.round(point.x * 1e6) / 1e6), [grenadier.throw.short, grenadier.throw.ahead])
  assert.equal(body.grenades, 0)
  assert.equal(body.shotsFired, 2, 'one release cue for each grenade')
  assert.equal(body.shoot(), false, 'out of grenades')
  body.setState('attack')
  live(clock, [body], 2)
  assert.equal(bursts.length, 2, 'a story button cannot make him throw one he has not got')

  const fallen = new Grenadier({ onBurst: point => bursts.push(point) })
  fallen.shoot()
  live(clock, [fallen], grenadier.throw.release / 2)
  fallen.setState('dead')
  live(clock, [fallen], 2)
  assert.equal(fallen.grenade.active, false)
  assert.equal(fallen.shotsFired, 0, 'an interrupted throw makes no release sound')
  assert.equal(bursts.length, 2)
})

test('a grenadier walks while steered and stops when the keys let go; set walking with no keys, he walks on', () => {
  const clock = new GameClock()
  const body = new Grenadier()
  body.steer(1, 0, 1 / 30)
  live(clock, [body], 1 / 30)
  assert.equal(body.state, 'move')
  live(clock, [body], 1 / 30)
  assert.equal(body.state, 'idle')
  const walker = new Grenadier()
  walker.setState('move')
  live(clock, [walker], 1)
  assert.equal(walker.state, 'move')
  assert.ok(walker.x < -1, 'on the way he faces')
})

test('a grenade falls as its world pulls, bounces back off a wall and along the ground, and bursts once, when its fuse burns down', t => {
  const clock = new GameClock()
  const bursts = []
  const throwAt = (options, velocity) => {
    const body = new Grenade({ onBurst: point => bursts.push(point), ...options })
    body.launch({ x: 0, y: 1, z: 0 }, velocity)
    return body
  }
  const wall = throwAt({ isBlocked: (from, way, distance) => from.x + way.x * distance > 1 }, { x: 5, y: 0, z: 0 })
  live(clock, [wall], 2)
  assert.equal(bursts.length, 1)
  assert.ok(bursts[0].x < 1, 'it came back off the wall')

  const moon = throwAt({ gravity: 1.62 }, { x: 0, y: 0, z: 0 })
  live(clock, [moon], 2)
  assert.ok(Math.abs(bursts[1].y - (1 - 1.62 * grenade.fuse ** 2 / 2)) < 1e-9, 'its fuse burns down while it still falls')

  t.mock.property(grenade, 'fuse', 3)
  const rolling = throwAt({}, { x: 4, y: 3, z: 0 })
  const heights = []
  // a little past its fuse, as frames do not add up to it exactly
  for (let i = 0; i < 92; i++) {
    live(clock, [rolling], 1 / 30)
    heights.push(rolling.y)
  }
  assert.equal(bursts.length, 3, 'one burst each')
  assert.ok(Math.min(...heights) >= 0, 'never under the ground')
  // it fell and then rose again
  const bounced = heights.findIndex((height, i) => i > 1 && heights[i - 1] < heights[i - 2] && height > heights[i - 1])
  assert.ok(bounced > 0, 'it bounced')
  assert.equal(bursts[2].y, 0, 'it settled on the ground before it burst')
  const firstLanding = 4 * (3 + Math.sqrt(9 + 2 * rolling.gravity)) / rolling.gravity
  assert.ok(bursts[2].x > firstLanding + .3, 'it went on past where it first landed')
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

test('the original window gunner keeps the existing size in the house', async() => {
  const { createPageElements } = await import('./helpers/dom.js')
  createPageElements()
  const { default: Bunker, bunkerKinds } = await import('/core/gameplay/bodies/artillery/Bunker.js')
  const { default: BunkerSprite } = await import('/core/actor/artillery/BunkerSprite.js')
  const { default: art } = await import('/core/actor/soldiers/machineGunnerArt.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  const body = new Bunker({ kind: bunkerKinds.house, clock: new GameClock() })
  const view = new BunkerSprite(body, { kind: 'house', projection: sideProjection({ pxPerMeter: 20, groundY: 400 }) })
  assert.equal(art.width * view.gunner.scale, 63 * .66)
  assert.equal(art.height * view.gunner.scale, 27 * .66)
})
