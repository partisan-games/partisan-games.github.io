import { test } from 'node:test'
import assert from 'node:assert/strict'
import Input from '/core/io/Input.js'

const press = (element, type) => element.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }))

test('on a touch screen without a keyboard, a held touch control counts as a pressed key', t => {
  const input = new Input({ useKeyboard: false, useJoystick: true })
  t.after(() => input.end())
  const down = document.querySelectorAll('.joystick-btn')[1]

  press(down, 'pointerdown')
  assert.equal(input.down, true)
  assert.equal(input.keyPressed, true)
  assert.equal(input.controlsPressed, true)

  press(down, 'pointerup')
  assert.equal(input.keyPressed, false)
  assert.equal(input.controlsPressed, false)
})
