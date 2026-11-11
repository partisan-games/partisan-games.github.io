import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import AIAttackLoopState from '/core3d/actor/states/ai/AIAttackLoopState.js'

const createActor = () => ({
  attacks: 0,
  distanceToTarget: 0,
  attackDistance: 1,
  enterAttack() {
    this.attacks++
  },
  setState() {},
})

test('without animation the actor attacks every 3 seconds of game time', () => {
  const actor = createActor()
  const state = new AIAttackLoopState(actor, 'attack')
  state.enter()
  assert.equal(actor.attacks, 1)

  for (let i = 0; i < 6; i++) state.update(1)
  assert.equal(actor.attacks, 3)
})

test('without animation no timer keeps attacking after the game stops', () => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  const actor = createActor()
  new AIAttackLoopState(actor, 'attack').enter()

  mock.timers.tick(60_000)
  mock.timers.reset()
  assert.equal(actor.attacks, 1)
})
