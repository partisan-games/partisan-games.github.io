import { test } from 'node:test'
import assert from 'node:assert/strict'
import Touch from '/core/io/Touch.js'

test('a camera button in the bottom right corner moves above the touch buttons, and back once they are gone', t => {
  const cornerRule = Object.assign(document.createElement('style'), { textContent: '.bottom-right { position: absolute; bottom: 8px }' })
  document.head.append(cornerRule)
  const cameraButton = Object.assign(document.createElement('button'), { className: 'bottom-right' })
  t.after(() => {
    cornerRule.remove()
    cameraButton.remove()
  })

  const touch = new Touch({ useJoystick: true, buttonDict: { jump: 'jump' } })
  document.body.append(cameraButton)
  assert.match(getComputedStyle(cameraButton).bottom, /60px/, 'above the 60px touch buttons')

  touch.end()
  assert.equal(getComputedStyle(cameraButton).bottom, '8px')
})

test('when the buttons wrap into more rows, the camera button rises above all of them, and drops back once they are gone', t => {
  const cornerRule = Object.assign(document.createElement('style'), { textContent: '.bottom-right { position: absolute; bottom: 8px }' })
  document.head.append(cornerRule)
  const cameraButton = Object.assign(document.createElement('button'), { className: 'bottom-right' })
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
    cameraButton.remove()
  })

  const touch = new Touch({ useJoystick: true, buttonDict: { jump: 'jump', attack: 'attack', attack2: 'attack2', special: 'special' } })
  document.body.append(cameraButton)
  resized([{ contentRect: { height: 136 } }])
  assert.match(getComputedStyle(cameraButton).bottom, /136px/, 'above two rows of buttons')

  touch.end()
  assert.equal(getComputedStyle(cameraButton).bottom, '8px')
})
