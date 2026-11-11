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

test('a keyboard removes every document and window listener it added', t => {
  const active = new Set()
  for (const target of [document, window]) {
    const add = target.addEventListener.bind(target)
    const remove = target.removeEventListener.bind(target)
    t.mock.method(target, 'addEventListener', (type, listener, options) => {
      active.add(listener)
      add(type, listener, options)
    })
    t.mock.method(target, 'removeEventListener', (type, listener, options) => {
      active.delete(listener)
      remove(type, listener, options)
    })
  }

  new Input({ useKeyboard: true, useJoystick: false }).end()
  assert.equal(active.size, 0)
})
