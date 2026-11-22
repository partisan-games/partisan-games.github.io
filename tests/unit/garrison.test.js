import { test } from 'node:test'
import assert from 'node:assert/strict'
import Garrison from '/scenes/cannon/Garrison.js'

test('the garrison holds at half strength and offers surrender once below half', () => {
  const crew = new Garrison(10)
  assert.equal(crew.update(10), false)
  assert.equal(crew.update(5), false)
  assert.equal(crew.surrendered, false)
  assert.equal(crew.update(4), true)
  assert.equal(crew.surrendered, true)
  assert.equal(crew.update(0), false, 'it surrenders only once')
  assert.equal(crew.surrendered, true)
})
