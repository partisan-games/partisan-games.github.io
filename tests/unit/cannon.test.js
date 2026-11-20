import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import { firstContact } from '/core/collision/sweep.js'

let Top, GameObject2D
const groundY = 600

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

/** A cannon as the scene places it, with the image size it would load. */
function cannon({ direction = 1, elevation = .2, session = null, targets = [], x = direction === 1 ? 300 : 900 } = {}) {
  const top = new Top({ x, y: groundY - 32, direction, clock: session?.clock, targets })
  top.width = 274 * .75
  top.height = 52 * .75
  top.elevation = elevation
  return top
}

const touches = (top, point, radius = 4) => firstContact({ start: point, end: point, radius }, [top]) !== null

for (const direction of [1, -1])
  for (const elevation of [0, 1])
    test(`a shell hits the drawn barrel, wheel and trail but not the empty space around them, facing ${direction}, elevation ${elevation}`, () => {
      const top = cannon({ direction, elevation })
      const insideMuzzle = { x: top.vrhX - 4 * Math.cos(top.angle), y: top.vrhY - 4 * Math.sin(top.angle) }
      assert.equal(touches(top, insideMuzzle), true, 'the muzzle')
      const beyondMuzzle = { x: top.vrhX + 12 * Math.cos(top.angle), y: top.vrhY + 12 * Math.sin(top.angle) }
      assert.equal(touches(top, beyondMuzzle), false, 'past the muzzle')
      const { postolje } = top
      assert.equal(touches(top, { x: postolje.x + 15 * direction, y: groundY - 5 }), true, 'the wheel')
      assert.equal(touches(top, { x: postolje.x - 60 * direction, y: groundY + 23 }), true, 'the trail')
      assert.equal(touches(top, { x: postolje.x - 60 * direction, y: groundY + 8 }), false, 'above the trail')
      const underBarrel = { x: top.x + 80 * direction, y: groundY - 6 }
      assert.equal(touches(top, underBarrel), false, 'under the raised barrel')
      const shell = new GameObject2D(null, { ...underBarrel, width: 8, height: 8 })
      assert.equal(top.collidesWith(shell), false, 'the carriage rectangle used to fill the space under the barrel')
    })

test('shells land on the line under the wheels, where the cannons stand, so a low shot reaches the wheel', () => {
  const session = new GameSession()
  session.start()
  const target = cannon({ session })
  const { postolje } = target
  const wheelBottom = postolje.y + (64.5 + 31.5 - 99 / 2) * .75
  const { shooter, shell } = shellAt({ x: postolje.x + 100, y: wheelBottom - 20 }, { x: -1000, y: 0 }, { target, session })
  assert.equal(shell.ground.floorY, wheelBottom)
  shell.update(.1)
  shooter.resolveShots()
  session.update(.2)
  assert.ok(target.energija < 100, 'a shot at the lower half of the wheel hits it')
  session.dispose()
})

test('the shapes follow the barrel as it recoils', () => {
  const top = cannon()
  const nearMuzzle = { x: top.vrhX - 2, y: top.vrhY }
  assert.equal(touches(top, nearMuzzle, 0), true)
  top.x -= 5
  assert.equal(touches(top, nearMuzzle, 0), false)
})

/** A shell from the opposite cannon, already flying towards the target. */
function shellAt(position, velocity, { target, session }) {
  const shooter = cannon({ direction: -1, session, targets: [target] })
  const shell = shooter.granate.projectiles[0]
  shell.launch(position, 0, 0)
  shell.dx = velocity.x
  shell.dy = velocity.y
  return { shooter, shell }
}

test('a fast shell that crosses the whole cannon in one step explodes at its near side and damages it once', () => {
  const session = new GameSession()
  session.start()
  const target = cannon({ session })
  const { shooter, shell } = shellAt({ x: 700, y: groundY - 10 }, { x: -8000, y: 0 }, { target, session })
  target.collider.beginStep()
  shell.update(.1)
  assert.ok(shell.x < 0, 'the step ends far beyond the cannon')
  shooter.resolveShots()
  assert.ok(shell.timerId, 'the shell explodes')
  assert.ok(shell.x > target.x && shell.x < target.x + 120, `at the near side: ${shell.x}`)

  session.update(.14)
  assert.equal(target.energija, 100)
  assert.equal(shooter.hasActiveShot, true, 'the turn waits for the damage')
  session.update(.02)
  assert.ok(target.energija < 100)
  assert.equal(shooter.hasActiveShot, false)
  const health = target.energija
  session.update(1)
  shooter.resolveShots()
  assert.equal(target.energija, health)
  session.dispose()
})

test('of the ground and the cannon, whichever the shell reaches first in a step ends its flight', () => {
  const session = new GameSession()
  session.start()
  const target = cannon({ session })
  // Falling short: the way of this step meets the ground before the cannon.
  const floor = target.granate.projectiles[0].ground.floorY
  const short = shellAt({ x: 600, y: floor - 20 }, { x: -2000, y: 400 }, { target, session })
  short.shell.update(.1)
  short.shooter.resolveShots()
  assert.ok(Math.abs(short.shell.y - (floor - 4)) < 1e-3, 'it explodes on the ground')
  session.update(.2)
  assert.equal(target.energija, 100)

  // The same step would reach the ground beyond the cannon, but meets the cannon first.
  const over = shellAt({ x: 420, y: groundY - 30 }, { x: -2000, y: 400 }, { target, session })
  over.shell.update(.1)
  over.shooter.resolveShots()
  assert.ok(over.shell.y < floor - 4, 'it stops on the cannon, above the ground')
  session.update(.2)
  assert.ok(target.energija < 100)
  session.dispose()
})

test('opposing cannons launch at mirrored positions and velocities, against the same ground', () => {
  const session = new GameSession()
  const left = new Top({ x: 200, y: 300, clock: session.clock })
  const right = new Top({ x: 800, y: 300, direction: -1, clock: session.clock })
  left.width = right.width = 100
  assert.ok(Math.abs(left.vrhX + right.vrhX - 1000) < 1e-9)
  assert.ok(Math.abs(left.vrhY - right.vrhY) < 1e-9)
  assert.equal(left.launch(), true)
  assert.equal(right.launch(), true)
  const a = left.granate.projectiles[0], b = right.granate.projectiles[0]
  assert.ok(Math.abs(a.dx + b.dx) < 1e-9)
  assert.ok(Math.abs(a.dy - b.dy) < 1e-9)
  assert.ok(a.dy < 0 && b.dy < 0)
  assert.equal(left.launch(), false, 'one cannon cannot overlap its shots')
  for (const projectile of [...left.granate.projectiles, ...right.granate.projectiles]) assert.equal(projectile.ground.floorY, a.ground.floorY)
})

test('an impact keeps the turn until delayed damage resolves', () => {
  const session = new GameSession()
  session.start()
  const cannon = new Top({ x: 200, y: 300, clock: session.clock })
  cannon.width = 100
  cannon.launch()
  let hits = 0
  cannon.granate.projectiles[0].checkHit({ collidesWith: () => true, takeHit: () => hits++ })
  session.update(.14)
  assert.equal(cannon.hasActiveShot, true)
  assert.equal(hits, 0)
  session.update(.02)
  assert.equal(cannon.hasActiveShot, false)
  assert.equal(hits, 1)
})

/** A cannon that lives alone on the game clock, its shells ending their flights as the scene ends them. */
function alone(options) {
  const session = new GameSession()
  session.start()
  const top = cannon({ session, ...options })
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      session.update(1 / 30)
      top.update(1 / 30)
      top.granate.projectiles.forEach(shell => shell.update(1 / 30))
      top.resolveShots()
    }
  }
  return { top, live, session }
}

test('a cannon has the states idle and fire, starts standing, and at rest does not fire', () => {
  const { top, live } = alone()
  assert.deepEqual(top.states, ['idle', 'fire'])
  assert.equal(top.state, 'idle')
  top.aimAt({ x: top.x + 500, y: top.y })
  live(2)
  assert.equal(top.hasActiveShot, false)
})

for (const direction of [1, -1])
  test(`a firing cannon facing ${direction} lands its shells where it aims, again after each shot is over`, () => {
    const { top, live } = alone({ direction })
    const point = { x: top.x + direction * 600, y: Top.floorY(top.y) }
    assert.equal(top.aimAt(point), true)
    top.setState('fire')
    const landings = []
    let landed = null
    for (let i = 0; i < 600 && landings.length < 2; i++) {
      live(1 / 30)
      const shell = top.granate.projectiles.find(projectile => projectile.timerId)
      if (shell && shell !== landed) landings.push(shell.x)
      landed = shell ?? null
    }
    assert.equal(landings.length, 2, 'it fires again after its shot is over')
    // the flight goes by steps of game time, which bring it down a little short of the exact arc
    for (const x of landings) assert.ok(Math.abs(x - point.x) < 25, `it lands where it aims: ${x}, not ${point.x}`)
  })

test('a cannon raises its barrel the farther the point, cannot aim behind it nor beyond its reach', () => {
  const top = cannon()
  const elevations = {}
  for (const [name, shot] of Object.entries(top.shots)) {
    assert.equal(top.aimAt({ x: top.x + top.forward * shot.x, y: top.y + shot.y }), true, name)
    assert.ok(top.aimedForce >= top.minSila && top.aimedForce <= top.maxForce)
    elevations[name] = top.elevation
  }
  assert.ok(elevations.up > elevations.straight + .1, 'the far shot raises the barrel high')
  const aimed = top.elevation
  assert.equal(top.aimAt({ x: top.x - 400, y: top.y }), false, 'behind')
  assert.equal(top.aimAt({ x: top.x + top.reach * 1.5, y: top.y }), false, 'beyond reach')
  assert.equal(top.elevation, aimed, 'the barrel stays')
})

test('a dead cannon does not fire', () => {
  const { top, live } = alone()
  top.aimAt({ x: top.x + 500, y: top.y })
  top.setState('fire')
  top.alive = false
  live(1)
  assert.equal(top.hasActiveShot, false)
})
