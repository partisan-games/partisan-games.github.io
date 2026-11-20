import { test } from 'node:test'
import assert from 'node:assert/strict'
import StateMachine from '/core/gameplay/StateMachine.js'

const recorder = () => {
  const log = []
  const state = name => ({
    enter: (owner, from) => log.push(`enter ${name} from ${from}`),
    update: (owner, dt) => log.push(`update ${name} ${dt}`),
    exit: (owner, to) => log.push(`exit ${name} to ${to}`),
  })
  return { log, states: { idle: state('idle'), walk: state('walk') } }
}

test('a state machine enters its first state, leaves the old state before entering the new one, and names both', () => {
  const { log, states } = recorder()
  const machine = new StateMachine({}, states, 'idle')
  machine.set('walk')
  assert.deepEqual(log, ['enter idle from null', 'exit idle to walk', 'enter walk from idle'])
  assert.equal(machine.name, 'walk')
  assert.deepEqual(machine.names, ['idle', 'walk'])
})

test('entering the current state again does nothing, and only the current state is updated', () => {
  const { log, states } = recorder()
  const machine = new StateMachine({}, states, 'idle')
  machine.set('idle')
  machine.update(.5)
  assert.deepEqual(log, ['enter idle from null', 'update idle 0.5'])
})

test('a state machine refuses a state it does not have', () => {
  const { states } = recorder()
  assert.throws(() => new StateMachine({}, states, 'fly'), RangeError)
  const machine = new StateMachine({}, states, 'idle')
  assert.throws(() => machine.set('toString'), RangeError, 'not even one inherited by every object')
  assert.equal(machine.name, 'idle')
})

test('a state may change state while entering, and the machine ends in the last one', () => {
  const owner = {}
  const machine = new StateMachine(owner, {
    hit: { enter: () => machine.set('dead') },
    dead: {},
    idle: {},
  }, 'idle')
  machine.set('hit')
  assert.equal(machine.name, 'dead')
})
