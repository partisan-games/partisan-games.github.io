import { test } from 'node:test'
import assert from 'node:assert/strict'
import Sentry, { watch } from '/core/gameplay/Sentry.js'

const body = (state = 'idle') => ({
  state,
  alive: true,
  setState(name) {
    this.state = name
  },
})

/** The states the body is in, tenth of a second by tenth. */
const watched = (sentry, seconds) => Array.from({ length: seconds * 10 }, () => {
  sentry.update(.1)
  return sentry.body.state
})

test('a sentry stands at ease and walks its patrol in turn, each for a while within its bounds', () => {
  const sentry = new Sentry(body())
  const states = watched(sentry, 120)
  const runs = []
  for (const state of states)
    if (runs.at(-1)?.state === state) runs.at(-1).seconds += .1
    else runs.push({ state, seconds: .1 })

  assert.ok(runs.length > 10, 'it changes again and again')
  for (const { state, seconds } of runs.slice(0, -1))
    assert.ok(seconds >= watch[state].min - .15 && seconds <= watch[state].max + .15, `${state} for ${seconds} s`)
})

test('a sentry leaves alone a body that is firing or dead, and starts afresh when set back to patrol', () => {
  const sentry = new Sentry(body('fire'))
  assert.ok(watched(sentry, 30).every(state => state === 'fire'))

  sentry.body.state = 'patrol'
  assert.equal(watched(sentry, watch.patrol.min - .2).at(-1), 'patrol', 'a fresh while, not the one left over')

  sentry.body.alive = false
  sentry.body.state = 'idle'
  assert.ok(watched(sentry, 30).every(state => state === 'idle'))
})
