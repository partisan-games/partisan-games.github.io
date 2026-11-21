import { test } from 'node:test'
import assert from 'node:assert/strict'
import FieldGun, { fieldGun } from '/core/gameplay/bodies/artillery/FieldGun.js'
import { cannonball } from '/core/gameplay/bodies/projectiles/Cannonball.js'

/** A gun on level ground facing `way`, at x 7.5 facing right or 22.5 facing left, with its barrel at `elevation`. */
function gun({ way = 1, elevation = .2, targets = [], groundAt, onBlast, canFire, x = way > 0 ? 7.5 : 22.5 } = {}) {
  const body = new FieldGun({ x, yaw: way > 0 ? 0 : Math.PI, targets, groundAt, onBlast, canFire })
  body.elevation = elevation
  return body
}

const touches = (body, point) => body.hitTime(point, point, cannonball.radius) !== null

/** Lives `seconds` of 30 steps a second. */
const live = (bodies, seconds) => {
  for (let i = 0; i < seconds * 30; i++) for (const body of bodies) body.update(1 / 30)
}

for (const way of [1, -1])
  for (const elevation of [0, 1])
    test(`a shot hits the drawn barrel, wheel and trail but not the empty space around them, facing ${way}, elevation ${elevation}`, () => {
      const body = gun({ way, elevation })
      const along = { x: Math.cos(body.barrelAngle), y: Math.sin(body.barrelAngle) }
      const { muzzle, carriage } = body
      assert.equal(touches(body, { x: muzzle.x - .1 * along.x, y: muzzle.y - .1 * along.y }), true, 'the muzzle')
      assert.equal(touches(body, { x: muzzle.x + .3 * along.x, y: muzzle.y + .3 * along.y }), false, 'past the muzzle')
      assert.equal(touches(body, { x: carriage.x + .375 * way, y: carriage.y + .125 }), true, 'the wheel')
      assert.equal(touches(body, { x: carriage.x - 1.5 * way, y: carriage.y - .575 }), true, 'the trail')
      assert.equal(touches(body, { x: carriage.x - 1.5 * way, y: carriage.y - .2 }), false, 'above the trail')
      assert.equal(touches(body, { x: body.x + 2 * way, y: body.y - .65 }), false, 'under the raised barrel')
    })

test('the gun stands with its wheel on the ground, sinks with it into a crater, and its shapes go with it', () => {
  let depth = 0
  const body = gun({ groundAt: () => -depth })
  const { y } = body
  const wheelBottom = () => body.carriage.y - (64.5 - 49.5 + 31.5) * .01875
  assert.ok(Math.abs(wheelBottom()) < 1e-9)
  depth = .5
  body.update(0)
  assert.equal(body.y, y, 'no time, no fall')
  live([body], 1 / 30)
  assert.ok(body.y < y && body.y > y - .5, 'it falls with gravity')
  live([body], 2)
  assert.ok(Math.abs(wheelBottom() + .5) < 1e-9, 'never below the ground')
  const point = { x: body.carriage.x + .375, y: body.carriage.y + .125 }
  assert.equal(touches(body, point), true, 'a hit finds the gun where it now stands')
  depth = 0
  live([body], 1 / 30)
  assert.ok(Math.abs(wheelBottom()) < 1e-9, 'new ground lifts it at once')
})

test('a gun recoils from its shot and rolls back to its place', () => {
  const body = gun()
  assert.equal(body.launch(), true)
  assert.equal(body.x, 7.5 - fieldGun.recoil)
  live([body], 1)
  assert.equal(body.x, 7.5)
})

test('a fast shot that crosses the whole gun in one step bursts at its near side, and the damage follows the burst', () => {
  const target = gun()
  const shooter = gun({ way: -1, targets: [target] })
  // in one step it would fly 20 m, far beyond the gun
  const ball = shooter.shells.fire({ x: target.x + 10, y: target.y - .25, z: 0 }, Math.PI, 0, 200)
  shooter.shells.update(.1, [target])
  assert.equal(ball.state, 'burst')
  assert.ok(ball.x > target.carriage.x && ball.x < target.muzzle.x + .5, `at the near side: ${ball.x}`)
  ball.update(.14)
  assert.equal(target.health.current, 100)
  assert.equal(shooter.hasActiveShot, true, 'the turn waits for the damage')
  ball.update(.02)
  assert.ok(target.health.current < 100)
  assert.equal(shooter.hasActiveShot, false)
})

test('of the ground and the gun, whichever a shot reaches first in a step ends its flight', () => {
  const blasts = []
  const target = gun()
  const shooter = gun({ way: -1, targets: [target], onBlast: x => blasts.push(x) })
  const flight = (from, velocity) => {
    const ball = shooter.shells.fire({ ...from, z: 0 }, 0, 0, 0)
    Object.assign(ball, { vx: velocity.x, vy: velocity.y })
    ball.update(.1)
    const hit = ball.firstHit([target])
    ball.strike(hit)
    return { ball, hit }
  }
  const short = flight({ x: 15, y: .5 }, { x: -50, y: -10 })
  assert.ok(Math.abs(short.ball.y - cannonball.radius) < 1e-3, 'it bursts on the ground')
  assert.equal(short.hit.target, undefined)
  assert.equal(blasts.length, 1, 'and digs a crater')
  short.ball.update(.2)
  assert.equal(target.health.current, 100)

  const over = flight({ x: target.x + 3, y: target.y - .75 }, { x: -50, y: -10 })
  assert.equal(over.hit.target, target, 'it stops on the gun, above the ground')
  assert.ok(over.ball.y > cannonball.radius)
  over.ball.update(.2)
  assert.ok(target.health.current < 100)
  assert.equal(blasts.length, 2, 'a hit too digs a crater under it')
})

test('opposing guns fire from mirrored muzzles at mirrored velocities, and one gun cannot overlap its shots', () => {
  const left = gun({ x: 5 }), right = gun({ way: -1, x: 20 })
  assert.ok(Math.abs(left.muzzle.x + right.muzzle.x - 25) < 1e-9)
  assert.ok(Math.abs(left.muzzle.y - right.muzzle.y) < 1e-9)
  assert.equal(left.launch(), true)
  assert.equal(right.launch(), true)
  const [a] = left.shells.projectiles, [b] = right.shells.projectiles
  assert.ok(Math.abs(a.vx + b.vx) < 1e-9 && Math.abs(a.vy - b.vy) < 1e-9 && a.vy > 0)
  assert.equal(left.launch(), false)
})

test('a gun has the states idle, load, fire and dead, and at rest or dead does not fire', () => {
  const body = gun()
  assert.deepEqual(body.states, ['idle', 'load', 'fire', 'dead'])
  body.aimAt({ x: 20, y: 0 })
  live([body], 2)
  assert.equal(body.shotsFired, 0)
  body.setState('dead')
  live([body], 2)
  assert.equal(body.shotsFired, 0)
  assert.equal(gun({ canFire: () => false }).launch(), false, 'nor when it may not')
})

for (const way of [1, -1])
  test(`a firing gun facing ${way} lands its shots where it aims, again after each shot is over`, () => {
    const body = gun({ way })
    const point = { x: body.x + way * 15, y: 0 }
    assert.equal(body.aimAt(point), true)
    body.setState('fire')
    const landings = []
    for (let i = 0; i < 600 && landings.length < 2; i++) {
      const before = body.shells.projectiles.map(ball => ball.bursts)
      live([body], 1 / 30)
      body.shells.projectiles.forEach((ball, j) => {
        if (ball.bursts > (before[j] ?? 0)) landings.push(ball.x)
      })
    }
    assert.equal(landings.length, 2, 'it fires again after its shot is over')
    // the flight goes by steps of game time, which bring it down a little short of the exact arc
    for (const x of landings) assert.ok(Math.abs(x - point.x) < .625, `it lands where it aims: ${x}, not ${point.x}`)
  })

test('a gun raises its barrel the farther the point, and cannot aim behind it nor beyond its reach', () => {
  const body = gun()
  const elevations = {}
  for (const [name, shot] of Object.entries(body.shots)) {
    assert.equal(body.aimAt({ x: body.x + body.forward * shot.x, y: body.y + shot.y }), true, name)
    assert.ok(body.aimedForce >= fieldGun.minForce && body.aimedForce <= fieldGun.maxForce)
    elevations[name] = body.elevation
  }
  assert.ok(elevations.up > elevations.straight + .1, 'the far shot raises the barrel high')
  const aimed = body.elevation
  assert.equal(body.aimAt({ x: body.x - 10, y: 0 }), false, 'behind')
  assert.equal(body.aimAt({ x: body.x + body.reach * 1.5, y: 0 }), false, 'beyond reach')
  assert.equal(body.elevation, aimed, 'the barrel stays')
})

test('charging builds the force up to its most, as much at 30 as at 60 steps a second, and firing spends it', () => {
  const a = gun(), b = gun()
  for (let i = 0; i < 30; i++) a.charge(1 / 30)
  for (let i = 0; i < 60; i++) b.charge(1 / 60)
  assert.ok(Math.abs(a.force - b.force) < 1e-9 && a.charged)
  a.charge(100)
  assert.equal(a.force, fieldGun.maxForce)
  a.launch()
  assert.equal(a.force, fieldGun.minForce)
  assert.equal(a.charged, false)
})
