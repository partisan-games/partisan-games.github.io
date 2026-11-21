import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameClock from '/core/runtime/GameClock.js'
import CannonAI from '/core/gameplay/controllers/CannonAI.js'
import FieldGun from '/core/gameplay/bodies/artillery/FieldGun.js'
import Wind from '/scenes/ustanak/Wind.js'

for (const way of [-1, 1])
  test(`the computer compensates for headwind and tailwind facing ${way}`, () => {
    const wind = new Wind()
    const cannon = new FieldGun({ x: way === 1 ? 20 : 100, yaw: way === 1 ? 0 : Math.PI, wind })
    const target = new FieldGun({ x: way === 1 ? 60 : 60 })
    const ai = new CannonAI({ cannon, target, clock: new GameClock(), random: () => .5 })
    wind.enabled = false
    ai.prepareAim()
    const calm = ai.nextForce
    wind.enabled = true
    wind.strength = 1.2 * way
    ai.prepareAim()
    const tailwind = ai.nextForce
    wind.strength *= -1
    ai.prepareAim()
    assert.ok(tailwind < calm, 'tailwind needs less power')
    assert.ok(ai.nextForce > calm, 'headwind needs more power')
  })

for (const [distance, random] of [[60, .5], [82, .1]])
  test(`the computer corrects its opening miss on its next shot at distance ${distance}`, () => {
    const clock = new GameClock()
    const target = new FieldGun({ x: 20 })
    const cannon = new FieldGun({ x: target.x + distance, yaw: Math.PI, targets: [target] })
    const ai = new CannonAI({ cannon, target, clock, random: () => random })
    const forces = [], health = [], misses = []
    // the real outline leaves room under a raised barrel, so a near miss may need a third shot
    for (let shot = 0; shot < 3 && target.health.current === 100; shot++) {
      clock.advance(1.2)
      ai.update()
      const ball = cannon.shells.projectiles.find(projectile => projectile.active)
      assert.ok(ball)
      forces.push(Math.hypot(ball.vx, ball.vy))
      let frames = 0
      while (cannon.hasActiveShot && frames++ < 2400) {
        clock.advance(1 / 120)
        cannon.update(1 / 120)
      }
      assert.equal(cannon.hasActiveShot, false, 'the shot must finish')
      health.push(target.health.current)
      misses.push(Math.sign(cannon.forward * (target.x - ball.x)))
      ai.beginTurn()
    }
    assert.equal(health[0], 100, 'the opening shot is not a near-perfect solution')
    assert.ok((forces[1] - forces[0]) * misses[0] > 0, 'power corrects in the direction of the miss')
    assert.ok(health.at(-1) < 100, 'corrections eventually find the target')
  })

test('computer ranging does not bypass the permission to fire, nor spend its wait during a pause', () => {
  const clock = new GameClock()
  let allowed = false
  const cannon = new FieldGun({ x: 80, yaw: Math.PI, canFire: () => allowed })
  const target = new FieldGun({ x: 20 })
  const ai = new CannonAI({ cannon, target, clock, random: () => .5 })
  clock.advance(.6)
  ai.update()
  assert.equal(cannon.shotsFired, 0, 'it waits')
  clock.advance(.6)
  ai.update()
  assert.equal(cannon.shotsFired, 0, 'a ready computer still needs permission from the scene')
  allowed = true
  ai.update()
  ai.update()
  assert.equal(cannon.shotsFired, 1)
})
