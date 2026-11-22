import { test } from 'node:test'
import assert from 'node:assert/strict'
import Garrison from '/scenes/cannon/Garrison.js'

test('the garrison holds with one machine gun and surrenders once when the last is destroyed', () => {
  const crew = new Garrison()
  assert.equal(crew.update(4), false)
  assert.equal(crew.update(1), false)
  assert.equal(crew.surrendered, false)
  assert.equal(crew.update(0), true)
  assert.equal(crew.surrendered, true)
  assert.equal(crew.update(0), false, 'it surrenders only once')
  assert.equal(crew.surrendered, true)
})
