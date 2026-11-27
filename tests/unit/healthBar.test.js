import { test } from 'node:test'
import assert from 'node:assert/strict'
import { healthBar } from '/ui/components.js'

test('every game draws health as one bar: the share left as a percentage, in the corner it is given', () => {
  const holder = document.createElement('div')
  holder.innerHTML = healthBar(.25, 'top-right')
  const [bar] = holder.children
  assert.equal(holder.children.length, 1)
  assert.equal(bar.tagName, 'PROGRESS')
  assert.equal(bar.value, 25)
  assert.equal(bar.max, 100)
  assert.deepEqual([...bar.classList], ['progress', 'top-right'])
})
