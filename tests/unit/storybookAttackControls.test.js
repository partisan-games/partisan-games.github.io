import { test } from 'node:test'
import assert from 'node:assert/strict'
import { attackControls } from '/storybook/attackControls.js'

test('one attack keeps its state and aiming target without a duplicate shot or action', () => {
  const controls = attackControls({ states: ['idle', 'attack', 'dead'], acts: ['attack', 'surrender'],
    anim: { actions: { attack: {}, walk: {} } }, shots: { straight: {} } })
  assert.deepEqual(controls.states, ['idle', 'attack', 'dead'])
  assert.deepEqual(controls.shots, [])
  assert.deepEqual(controls.acts, ['surrender'])
  assert.deepEqual(controls.animations, ['walk'])
  assert.equal(controls.primary, 'straight')
})

test('different attacks replace the generic attack, and automatic weapons remain separately aimable', () => {
  const controls = attackControls({ states: ['idle', 'fire', 'dead'],
    shots: { straight: {}, drop: {}, behind: { automatic: true } } })
  assert.deepEqual(controls.states, ['idle', 'dead'])
  assert.deepEqual(controls.shots, ['straight', 'drop', 'behind'])
  const single = attackControls({ states: ['fire'], shots: { straight: {}, behind: { automatic: true } } })
  assert.deepEqual(single.shots, ['behind'])
})

test('an actor without an attack state retains its shot control', () => {
  assert.deepEqual(attackControls({ states: ['idle'], shots: { up: {} } }).shots, ['up'])
})
