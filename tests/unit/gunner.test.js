import { test } from 'node:test'
import assert from 'node:assert/strict'
import Gunner, { gunner } from '/scenes/cannon/Gunner.js'

test('a manned gunner fires after his wait and again after the next, and a silenced one never does', () => {
  const rolls = [0, .2, .5]
  const post = new Gunner({ random: () => rolls.shift() ?? .9 })
  assert.equal(post.update(gunner.firstWait - .1, true), null)
  assert.deepEqual(post.update(.2, true), { hit: false }, 'the roll of .5 misses')
  const { least, most } = gunner.wait
  assert.equal(post.update(least + .2 * (most - least) - .2, true), null, 'the next wait is drawn from .2')
  assert.equal(post.update(100, false), null, 'silenced, he waits no longer and fires not')
  assert.deepEqual(post.update(.3, true), { hit: false })
  const sure = new Gunner({ random: () => 0 })
  assert.deepEqual(sure.update(gunner.firstWait, true), { hit: true })
})
