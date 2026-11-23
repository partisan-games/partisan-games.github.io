import { test } from 'node:test'
import assert from 'node:assert/strict'
import { touchpadMove } from '/catalog/Stage3D.js'

test('two fingers on a touchpad orbit the 3D stage in any browser, while a pinch and a mouse wheel zoom', () => {
  // Chrome reports a touchpad in pixels, Firefox in lines
  assert.deepEqual(touchpadMove({ deltaMode: 0, deltaX: 6, deltaY: 0 }), { across: 6, up: 0 })
  assert.deepEqual(touchpadMove({ deltaMode: 0, deltaX: 0, deltaY: -4.5 }), { across: 0, up: -4.5 })
  assert.deepEqual(touchpadMove({ deltaMode: 1, deltaX: .5, deltaY: 0 }), { across: 8, up: 0 })
  assert.deepEqual(touchpadMove({ deltaMode: 1, deltaX: 0, deltaY: .25 }), { across: 0, up: 4 })
  assert.equal(touchpadMove({ deltaMode: 0, deltaX: 0, deltaY: 100 }), null, 'a mouse wheel notch in Chrome')
  assert.equal(touchpadMove({ deltaMode: 1, deltaX: 0, deltaY: 3 }), null, 'a mouse wheel notch in Firefox')
  assert.equal(touchpadMove({ deltaMode: 0, deltaX: 0, deltaY: 2.5, ctrlKey: true }), null, 'a pinch')
})
