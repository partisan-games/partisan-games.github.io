import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'
import CannonAI from '/core/gameplay/controllers/CannonAI.js'
import Wind from '/scenes/ustanak/Wind.js'

let Top

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
})

for (const direction of [-1, 1])
  test(`computer compensates for headwind and tailwind facing ${direction}`, () => {
    const wind = new Wind()
    const cannon = new Top({ x: direction === 1 ? 200 : 1000, y: 300, direction, wind })
    const target = new Top({ x: direction === 1 ? 1000 : 200, y: 300 })
    cannon.width = 200
    cannon.minSila = 0
    cannon.maxForce = 10000
    const ai = new CannonAI({ cannon, target, clock: { now: 0 }, random: () => .5 })
    wind.enabled = false
    ai.prepareAim()
    const calm = ai.nextForce
    wind.enabled = true
    wind.strength = 12 * direction
    ai.prepareAim()
    const tailwind = ai.nextForce
    wind.strength *= -1
    ai.prepareAim()
    assert.ok(tailwind < calm, 'tailwind needs less power')
    assert.ok(ai.nextForce > calm, 'headwind needs more power')
  })

for (const [distance, random] of [[600, .5], [820, .1]])
  test(`the computer corrects its opening miss on its next shot at distance ${distance}`, () => {
    const session = new GameSession()
    session.start()
    const target = new Top({ x: 200, y: 568, clock: session.clock })
    const cannon = new Top({ x: target.x + distance, y: 568, direction: -1, clock: session.clock, targets: [target] })
    for (const gun of [target, cannon]) {
      gun.width = 274 * .75
      gun.height = 52 * .75
    }
    const ai = new CannonAI({ cannon, target, clock: session.clock, random: () => random })
    const forces = []
    const health = []
    const misses = []
    // The real outline leaves room under a raised barrel, so a near miss may need a third shot.
    for (let shot = 0; shot < 3 && target.energija === 100; shot++) {
      session.update(1.2)
      ai.update()
      const shell = cannon.granate.projectiles.find(projectile => projectile.visible)
      assert.ok(shell)
      if (shot === 0) {
        // Measured where the shell comes down to the cannon's height: the ground lies lower, under the wheels.
        const flightTime = (-shell.dy + Math.sqrt(shell.dy ** 2
        + 2 * shell.gravity * (target.y - shell.y))) / shell.gravity
        const passingX = shell.x + shell.dx * flightTime
        assert.ok(Math.abs(passingX - target.x) < Math.abs(cannon.x - target.x) * .55,
          `the opening trajectory passes close to the cannon instead of far beyond it: ${passingX}`)
      }
      forces.push(Math.hypot(shell.dx, shell.dy))
      let frames = 0
      while (cannon.hasActiveShot && frames++ < 2400) {
        session.update(1 / 120)
        cannon.update(1 / 120)
        cannon.granate.projectiles.forEach(projectile => projectile.update(1 / 120))
        cannon.resolveShots()
      }
      assert.equal(cannon.hasActiveShot, false, 'the shot must finish')
      health.push(target.energija)
      misses.push(Math.sign(cannon.direction * (target.x - shell.x)))
      ai.beginTurn()
    }
    assert.equal(health[0], 100, 'the opening shot is not a near-perfect solution')
    assert.ok((forces[1] - forces[0]) * misses[0] > 0, 'power corrects in the direction of the miss')
    assert.ok(health.at(-1) < 100, 'corrections eventually find the target')
    assert.ok(health.length >= 2, 'the computer corrects its opening miss')
  })

test('computer ranging does not bypass turn permission or spend its wait during pause', () => {
  const session = new GameSession()
  session.start()
  let allowed = false, shots = 0
  const cannon = new Top({ x: 800, y: 300, direction: -1, clock: session.clock,
    canFire: () => allowed && session.state === 'running', onFire: () => shots++ })
  cannon.width = 100
  const target = new Top({ x: 200, y: 300 })
  const ai = new CannonAI({ cannon, target, clock: session.clock, random: () => .5 })
  session.update(.6)
  session.pause()
  session.update(100)
  ai.update()
  assert.equal(shots, 0)
  session.resume()
  session.update(.6)
  ai.update()
  assert.equal(shots, 0, 'a ready AI still needs permission from the scene')
  allowed = true
  ai.update()
  ai.update()
  assert.equal(shots, 1)
  cannon.granate.projectiles.forEach(projectile => projectile.reset())
  session.finish()
  ai.update()
  assert.equal(shots, 1)
})
