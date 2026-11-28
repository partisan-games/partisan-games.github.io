import { test } from 'node:test'
import assert from 'node:assert/strict'
import Touch from '/core/io/Touch.js'

test('what stands in the bottom right corner moves above the touch buttons, and back once they are gone', t => {
  const cornerRule = Object.assign(document.createElement('style'), { textContent: '.bottom-right { position: absolute; bottom: 8px }' })
  document.head.append(cornerRule)
  const corner = Object.assign(document.createElement('button'), { className: 'bottom-right' })
  t.after(() => {
    cornerRule.remove()
    corner.remove()
  })

  const touch = new Touch({ useJoystick: true, buttonDict: { jump: 'jump' } })
  document.body.append(corner)
  // the test page does not work out nested CSS variables, so it sees only that the corner no longer stands at its own place
  assert.notEqual(getComputedStyle(corner).bottom, '8px', 'above the touch buttons')

  touch.end()
  assert.equal(getComputedStyle(corner).bottom, '8px')
})

test('when the buttons wrap into more rows, what stands in the corner rises above all of them, and drops back once they are gone', t => {
  const cornerRule = Object.assign(document.createElement('style'), { textContent: '.bottom-right { position: absolute; bottom: 8px }' })
  document.head.append(cornerRule)
  const corner = Object.assign(document.createElement('button'), { className: 'bottom-right' })
  const { ResizeObserver } = globalThis
  let resized
  globalThis.ResizeObserver = class {
    constructor(callback) {
      resized = callback
    }
    observe() {}
    disconnect() {}
  }
  t.after(() => {
    globalThis.ResizeObserver = ResizeObserver
    cornerRule.remove()
    corner.remove()
  })

  const touch = new Touch({ useJoystick: true, buttonDict: { jump: 'jump', attack: 'attack', attack2: 'attack2', special: 'special' } })
  document.body.append(corner)
  resized([{ contentRect: { height: 136 } }])
  assert.equal(document.documentElement.style.getPropertyValue('--touch-buttons-height'), '136px', 'above two rows of buttons')
  assert.notEqual(getComputedStyle(corner).bottom, '8px')

  touch.end()
  assert.equal(getComputedStyle(corner).bottom, '8px')
})

test('holding a touch button does not open the browser menu', t => {
  const touch = new Touch({ useJoystick: true, buttonDict: { attack: 'attack' } })
  t.after(() => touch.end())
  for (const button of document.querySelectorAll('.joystick-btn, .game-btn')) {
    const longPress = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    button.dispatchEvent(longPress)
    assert.ok(longPress.defaultPrevented)
  }
})
