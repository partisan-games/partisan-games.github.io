import { test } from 'node:test'
import assert from 'node:assert/strict'
import Boat, { boat } from '/core/gameplay/bodies/boats/Boat.js'
import SBoat, { sBoat } from '/core/gameplay/bodies/boats/SBoat.js'
import ShoreMachineGun, { nest } from '/core/gameplay/bodies/artillery/ShoreMachineGun.js'
import Raider from '/core/gameplay/controllers/Raider.js'
import GameClock from '/core/runtime/GameClock.js'

const live = (clock, bodies, seconds, fps = 30) => {
  for (let i = 0; i < seconds * fps; i++) {
    clock.advance(1 / fps)
    for (const body of bodies) body.update(1 / fps)
  }
}

test('the boat goes where it heads under full ahead, the current pushes it back but not past its start', () => {
  const clock = new GameClock()
  const body = new Boat({ x: 20, z: 30, startX: 10, clock })
  for (let i = 0; i < 30; i++) {
    body.throttle(1 / 30)
    live(clock, [body], 1 / 30)
  }
  assert.ok(body.x > 25 && Math.abs(body.z - 30) < 1e-9, 'down the river')
  body.turn(1, .5)
  assert.ok(body.yaw < 0, 'right turns it down the view')
  live(clock, [body], 20)
  assert.equal(body.x, 10, 'the current carries it back to its start, no farther')
})

test('the banks turn the boat back into the stream', () => {
  const clock = new GameClock()
  const body = new Boat({ x: 20, z: 8, yaw: Math.PI / 2, bounds: { minZ: 7.5, maxZ: 60 }, clock })
  for (let i = 0; i < 30; i++) {
    body.throttle(1 / 30)
    live(clock, [body], 1 / 30)
  }
  assert.ok(body.heading.z > 0, 'heading away from the bank')
})

test('the boat fires from its bow along its heading as it reloads, and hits along a turned hull', () => {
  const clock = new GameClock()
  const enemy = new SBoat({ x: 40, z: 30, clock })
  const body = new Boat({ x: 10, z: 30, clock, targets: [enemy] })
  assert.equal(body.shoot(), true)
  assert.equal(body.shoot(), false, 'not before its reload')
  const [round] = body.bullets.projectiles
  assert.deepEqual([round.x, round.z], [body.muzzle.x, body.muzzle.z])
  live(clock, [body], 1)
  assert.equal(enemy.health.current, sBoat.health - boat.damage)
  enemy.yaw = Math.PI / 2
  enemy.z = body.z + enemy.size.length / 2 + 1
  body.reload.start(0)
  body.shoot()
  live(clock, [body], 1)
  assert.equal(enemy.health.current, sBoat.health - boat.damage, 'it passes the end of the turned hull')
})

test('the boat fires its few rockets a launcher reload apart, and three of them sink an S-boat', () => {
  const clock = new GameClock()
  const enemy = new SBoat({ x: 40, z: 30, clock })
  const body = new Boat({ x: 10, z: 30, clock, targets: [enemy] })
  assert.equal(body.fireRocket(), true)
  assert.equal(body.fireRocket(), false, 'not before the launcher is ready')
  live(clock, [body], boat.rocketReload + .1)
  assert.equal(enemy.health.current, sBoat.health - boat.rocketDamage)
  for (let i = 1; i < boat.rockets; i++) {
    assert.equal(body.fireRocket(), true)
    live(clock, [body], boat.rocketReload + .1)
  }
  assert.equal(enemy.alive, false)
  assert.equal(body.fireRocket(), false, 'none left')
})

test('an S-boat lies still until it is set to sail, then sails on its course at cruising speed', () => {
  const clock = new GameClock()
  const body = new SBoat({ x: 100, z: 30, clock })
  live(clock, [body], 1)
  assert.equal(body.x, 100)
  body.course = Math.PI
  body.setState('move')
  live(clock, [body], 1)
  assert.ok(Math.abs(body.x - (100 - sBoat.cruise)) < .1)
})

test('the S-boat guns follow their aim in any state but fire only in attack, within reach, in bursts', () => {
  const clock = new GameClock()
  const target = new Boat({ x: 100, z: 51, clock })
  const body = new SBoat({ x: 100, z: 30, clock, targets: [target] })
  body.aimAt(target)
  live(clock, [body], 3)
  assert.equal(body.shotsFired, 0)
  body.course = Math.PI
  body.setState('attack')
  live(clock, [body], 2)
  assert.equal(body.shotsFired, sBoat.burst, 'one burst')
  assert.equal(body.bursts, 1)
  body.aimAt({ x: body.x, z: body.z + sBoat.reach * 2 })
  live(clock, [body], sBoat.burstWait + 1)
  assert.equal(body.shotsFired, sBoat.burst, 'not beyond its reach')
})

test('a sinking S-boat holds fire, stays a surface for a while and then is gone', () => {
  const clock = new GameClock()
  const body = new SBoat({ x: 100, z: 30, clock })
  body.takeHit(sBoat.health)
  assert.equal(body.afloat, true)
  live(clock, [body], sBoat.surfaceTime + .1)
  assert.equal(body.afloat, false)
  live(clock, [body], sBoat.sinkTime)
  assert.equal(body.sunk, true)
})

test('a raider heads for a point ahead of the target in its lane and keeps attacking after its bursts', () => {
  const clock = new GameClock()
  const target = { x: 20, z: 30, alive: true }
  const body = new SBoat({ x: 100, z: 50, lane: 50, clock })
  const raider = new Raider(body, target, { viewWidth: () => 100, sees: () => true })
  raider.update()
  assert.equal(body.state, 'attack')
  assert.ok(Math.abs(Math.abs(body.course) - Math.PI) < 1e-9, 'up the river in its lane')
  body.bursts = 20
  raider.update()
  assert.equal(body.state, 'attack', 'it never turns away')
})

test('a nest aims only out over the water, swings at once to its aim when it opens fire, and fires in bursts', () => {
  const clock = new GameClock()
  const body = new ShoreMachineGun({ x: 50, z: 5, side: -1, clock })
  assert.equal(body.aimAt({ x: 50, z: 0 }), false, 'not inland')
  assert.equal(body.aimAt({ x: 80, z: 40 }), true)
  body.setState('attack')
  live(clock, [body], 1 / 30)
  assert.ok(Math.abs(body.gunYaw - body.bearing) < 1e-9)
  live(clock, [body], 1)
  assert.equal(body.shotsFired, nest.burst)
  body.setState('dead')
  live(clock, [body], nest.burstWait + 1)
  assert.equal(body.shotsFired, nest.burst)
})
