import { test } from 'node:test'
import assert from 'node:assert/strict'
import Tank, { tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import TankAI, { tankAI } from '/core/gameplay/controllers/TankAI.js'
import GameClock from '/core/runtime/GameClock.js'

/** A left-facing tank on the right half of an 80 m field, driven by the AI with a chosen random. */
function selfDriven(random = () => .5) {
  const clock = new GameClock()
  const targets = []
  const tank = new Tank({ kind: tankKinds.german, x: 60, yaw: Math.PI, clock, targets, bounds: { min: 40, max: 80 } })
  const ai = new TankAI(tank, { clock, targets, random: () => random() })
  return { clock, tank, ai, targets }
}

const enemy = x => new Tank({ x, clock: new GameClock() })

test('the AI tank fires first after its wait of game time, however long the game stood still before', () => {
  const { clock, tank, ai, targets } = selfDriven()
  targets.push(enemy(10))
  ai.update(1 / 30)
  assert.equal(tank.shotsFired, 0)
  clock.advance(tankAI.fireWait)
  ai.update(1 / 30)
  assert.equal(tank.shotsFired, 1)
})

test('the AI aims at the nearest living target and holds fire with none', () => {
  const { clock, tank, ai, targets } = selfDriven()
  const near = enemy(40), far = enemy(5)
  const aimed = []
  tank.aimAt = target => aimed.push(target)
  targets.push(far, near)
  clock.advance(tankAI.fireWait)
  ai.update(1 / 30)
  assert.deepEqual(aimed, [near])
  near.setState('dead')
  far.setState('dead')
  clock.advance(tankAI.fireWait)
  ai.update(1 / 30)
  assert.equal(aimed.length, 1)
  assert.equal(tank.shotsFired, 1, 'only the shot at the living target')
})

test('the AI drives ahead from the back of its ground and back from past its front, and a dead tank does nothing', () => {
  const wayAt = x => {
    const { clock, tank, ai } = selfDriven(() => .9)
    tank.x = x
    clock.advance(tankAI.turn)
    ai.update(1 / 30)
    return Math.sign(tank.vx)
  }
  assert.equal(wayAt(79), -1, 'from the back it drives ahead, to the left')
  assert.equal(wayAt(38), 1, 'past its front it drives back')
  const { clock, tank, ai } = selfDriven()
  tank.setState('dead')
  clock.advance(tankAI.fireWait)
  ai.update(1 / 30)
  assert.equal(tank.vx, 0)
})
