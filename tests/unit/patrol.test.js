import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Patrola, search

before(async() => {
  createPageElements()
  ;({ default: Patrola, search } = await import('/scenes/ranjenik/Patrola.js'))
})

/** A patrol alone, counting the times it calls out. */
function patrolAlone(t) {
  const patrol = new Patrola()
  t.after(() => patrol.end())
  const calls = []
  t.mock.method(patrol, 'pustiNasumicno', sounds => calls.push(sounds))
  return { patrol, calls }
}

test('a patrol has the states search and halt, and starts searching at its pace', t => {
  const { patrol } = patrolAlone(t)
  assert.deepEqual(patrol.states, ['search', 'halt'])
  assert.equal(patrol.state, 'search')
  assert.equal(patrol.speed, search.speed)
})

test('a searching patrol turns now and then and calls out on game time rather than wall time', t => {
  const { patrol, calls } = patrolAlone(t)
  t.mock.timers.enable({ apis: ['Date'], now: 0 })
  t.mock.timers.tick(100_000)
  patrol.update(0)
  assert.equal(calls.length, 0)
  const { angle } = patrol
  patrol.update(search.turnTime)
  assert.notEqual(patrol.angle, angle, 'it turns')
  patrol.update(search.talkTime)
  assert.equal(calls.length, 1)
})

test('a halted patrol stands, calls that it has found someone, and neither turns nor calls out again', t => {
  const { patrol, calls } = patrolAlone(t)
  patrol.setState('halt')
  assert.equal(patrol.speed, 0)
  assert.equal(calls.length, 1)
  const { angle } = patrol
  patrol.update(search.talkTime)
  assert.equal(patrol.angle, angle)
  assert.equal(calls.length, 1)
  patrol.setState('search')
  assert.equal(patrol.speed, search.speed, 'it searches on')
})
