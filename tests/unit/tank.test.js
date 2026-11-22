import { test } from 'node:test'
import assert from 'node:assert/strict'
import Tank, { tank as settings, tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

/** A tank body alone with a target on the ground, on its own clock, with no page. */
function tankAlone({ yaw = 0, x = 40, targetX = 0 } = {}) {
  const clock = new GameClock()
  const target = new Body({ x: targetX, size: { length: 7, height: 3, width: 3 }, states: { idle: {}, dead: {} } })
  const tank = new Tank({ kind: tankKinds.partisan, x, yaw, clock, targets: [target], random: () => .5 })
  const live = (seconds, fps = 30) => {
    for (let i = 0; i < seconds * fps; i++) {
      clock.advance(1 / fps)
      tank.update(1 / fps)
    }
  }
  return { tank, target, clock, live }
}

test('a tank has the states idle, move, attack and dead, and starts standing', () => {
  const { tank, live } = tankAlone()
  assert.deepEqual(tank.states, ['idle', 'move', 'attack', 'dead'])
  assert.equal(tank.state, 'idle')
  live(2)
  assert.equal(tank.x, 40)
})

test('a driving tank goes the way it faces, as far at 30 as at 60 frames a second', () => {
  for (const [yaw, way] of [[0, 1], [Math.PI, -1]]) {
    const distances = [30, 60].map(fps => {
      const { tank, live } = tankAlone({ yaw })
      tank.setState('move')
      live(1, fps)
      return tank.x - 40
    })
    assert.equal(Math.sign(distances[0]), way)
    assert.ok(Math.abs(distances[0] - distances[1]) < Math.abs(distances[0]) * .05, `${distances}`)
  }
})

test('it drives back slower than ahead and keeps within its ground', () => {
  const ahead = tankAlone(), back = tankAlone()
  for (let i = 0; i < 30; i++) {
    ahead.tank.drive(1, 1 / 30)
    back.tank.drive(-1, 1 / 30)
    ahead.live(1 / 30)
    back.live(1 / 30)
  }
  assert.ok(ahead.tank.x - 40 > 40 - back.tank.x)
  const { tank, live } = tankAlone()
  tank.bounds = { min: 0, max: 42 }
  tank.setState('move')
  live(2)
  assert.equal(tank.x, 42)
})

test('a firing tank raises its barrel at a target ahead, on either side, and fires as it reloads', () => {
  for (const [yaw, side] of [[0, 1], [Math.PI, -1]]) {
    const { tank, live } = tankAlone({ yaw })
    assert.equal(tank.aimAt({ x: tank.x + side * 60, y: 0 }), true)
    assert.ok(tank.elevation > 0)
    tank.setState('attack')
    live(2.5)
    assert.ok(tank.shotsFired >= 2, 'it fires again after reloading')
    assert.equal(Math.sign(tank.muzzle.x - tank.x), side)
  }
})

test('a hit may break the drive of a tank, which then pushes it on half as hard, or its gun, which then reloads twice as long', () => {
  const broken = tankAlone(), whole = tankAlone()
  const rolls = [.1, .1]
  broken.tank.random = () => rolls.shift() ?? .5
  broken.tank.takeHit(10)
  assert.deepEqual(broken.tank.broken, { drive: true, gun: true })
  whole.tank.takeHit(10)
  assert.deepEqual(whole.tank.broken, { drive: false, gun: false }, 'a roll above the chance breaks nothing')
  for (const { tank, live } of [broken, whole]) {
    tank.vx = 0
    tank.drive(1, 1 / 30)
    live(0)
  }
  assert.ok(Math.abs(broken.tank.vx - whole.tank.vx * settings.breakdown.slower) < 1e-9)
  for (const { tank, live } of [broken, whole]) {
    tank.aimAt({ x: tank.x + 60, y: 0 })
    tank.setState('attack')
    live(3)
  }
  assert.ok(broken.tank.shotsFired < whole.tank.shotsFired)
  const kept = new Tank({ clock: broken.clock, breakdown: { drive: 0, gun: 0 }, random: () => 0 })
  kept.takeHit(10)
  assert.deepEqual(kept.broken, { drive: false, gun: false }, 'a game with no breakdowns keeps its tanks whole')
})

test('aiming behind turns only the turret and sends the shell out of the reversed barrel', () => {
  const { tank } = tankAlone()
  tank.aimAt({ x: tank.x + tank.shots.straight.x, y: 0 })
  const near = tank.elevation
  tank.aimAt({ x: tank.x + tank.shots.up.x, y: 0 })
  assert.ok(tank.elevation > near + .3)
  assert.equal(tank.aimAt({ x: tank.x - 30, y: 0 }), true)
  assert.equal(tank.forward, 1)
  assert.ok(tank.muzzle.x < tank.barrelPivot.x)
  const { x, y } = tank.muzzle
  tank.shoot()
  const [shell] = tank.shells.projectiles
  assert.deepEqual([shell.x, shell.y], [x, y])
  assert.ok(shell.vx < 0)
  assert.ok(tank.aimAt({ x: tank.x + 30, y: 0 }))
  assert.ok(tank.muzzle.x > tank.barrelPivot.x)
})

test('a tank fires only in state fire or when told, recoils, and waits for its reload on game time', () => {
  const { tank, clock, live } = tankAlone()
  live(2)
  assert.equal(tank.shotsFired, 0, 'at rest it does not fire')
  assert.equal(tank.shoot(), true)
  assert.ok(tank.vx < 0, 'the shot pushes it back')
  assert.equal(tank.shoot(), false, 'not during the reload')
  clock.advance(settings.reloadTime)
  assert.equal(tank.shoot(), true)
})

test('a tank burns at a fifth of its own health, a whole one with little health too', () => {
  const clock = new GameClock()
  const enemy = new Tank({ kind: tankKinds.german, clock, health: 10 })
  assert.equal(enemy.burning, false, 'whole')
  enemy.takeHit(8)
  assert.equal(enemy.burning, true)
})

test('a shell keeps the speed of the tank that fired it, so a marching tank does not outrun its own shells', () => {
  const { tank } = tankAlone()
  tank.elevation = 0
  tank.vx = 9
  tank.shoot()
  const [shell] = tank.shells.projectiles
  assert.ok(Math.abs(shell.vx - (settings.shellSpeed + 9)) < 1e-9)
})

test('a shell that hits takes the target health after its burst, and a hit tank burns low and dies', () => {
  const { tank, target, live } = tankAlone({ x: 0, targetX: 12 })
  tank.elevation = 0
  tank.shoot()
  live(1)
  assert.equal(target.health.current, 100 - 15)
  const hit = tankAlone()
  hit.tank.takeHit(85)
  assert.ok(hit.tank.vx < 0, 'a hit pushes it back')
  assert.equal(hit.tank.burning, true)
  hit.tank.takeHit(20)
  assert.equal(hit.tank.state, 'dead')
  hit.tank.setState('idle')
  assert.equal(hit.tank.shoot(), false, 'a dead tank fires no more')
})
