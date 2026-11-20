import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh } from 'three'
import { createPageElements } from './helpers/dom.js'

let AI, AIIdleState, WanderState, AnimOnceState

before(async() => {
  createPageElements()
  AI = (await import('/core3d/actor/AI.js')).default
  AIIdleState = (await import('/core3d/actor/states/ai/AIIdleState.js')).default
  WanderState = (await import('/core3d/actor/states/ai/WanderState.js')).default
  AnimOnceState = (await import('/core3d/actor/states/AnimOnceState.js')).default
})

/** An actor without a model or animations: a box standing on the ground. */
const box = () => new AI({ mesh: new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0)), baseState: 'idle' })

test('a 3D actor goes from state to state on the shared state machine, each state knowing the one before', () => {
  const actor = box()
  assert.equal(actor.state, 'idle')
  assert.ok(actor.fsm.currentState instanceof AIIdleState)
  actor.setState('wander')
  assert.equal(actor.state, 'wander')
  assert.equal(actor.fsm.machine.name, 'wander', 'the shared machine holds the state')
  assert.ok(actor.fsm.currentState instanceof WanderState)
  assert.equal(actor.fsm.currentState.prevState, 'idle')
})

test('a 3D state without its own class plays its animation once, and with none goes back at once', () => {
  const actor = box()
  actor.setState('wander')
  let played
  const { enter } = AnimOnceState.prototype
  AnimOnceState.prototype.enter = function(...args) {
    played = this.name
    return enter.apply(this, args)
  }
  try {
    actor.setState('wave')
  } finally {
    AnimOnceState.prototype.enter = enter
  }
  assert.equal(played, 'wave')
  assert.equal(actor.state, 'wander', 'the box has no animation to play')
  assert.equal(actor.fsm.currentState.prevState, 'wave')
})

test('a 3D state is left before the next is entered, and entering the same state again does nothing', () => {
  const actor = box()
  const calls = []
  const idle = actor.fsm.currentState
  idle.exit = () => calls.push('exit idle')
  actor.setState('idle')
  assert.equal(actor.fsm.currentState, idle, 'the same state, not a new one')
  assert.deepEqual(calls, [])
  actor.setState('wander')
  assert.deepEqual(calls, ['exit idle'])
})

test('a 3D actor whose attack style changes plays the attack by the new style the next time', () => {
  const actor = box()
  actor.attackStyle = 'ONCE'
  actor.setState('attack')
  const once = actor.fsm.currentState.constructor
  actor.setState('idle')
  actor.attackStyle = 'LOOP'
  actor.setState('attack')
  assert.notEqual(actor.fsm.currentState.constructor, once)
})
