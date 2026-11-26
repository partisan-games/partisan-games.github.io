import { test } from 'node:test'
import assert from 'node:assert/strict'
import TouchLook from '/core3d/actor/characters/TouchLook.js'
import Keyboard from '/core/io/Keyboard.js'

const pointer = (type, target, { pointerType = 'touch', x = 0, y = 0, id = 1 } = {}) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, clientX: x, clientY: y, pointerId: id, button: 0 }))

test('a finger dragged across the game turns the view and raises the aim; a mouse or a drag from a button does not', t => {
  const looks = []
  const look = new TouchLook({ look: (yaw, pitch) => looks.push([yaw, pitch]) })
  const canvas = document.createElement('canvas'), button = document.createElement('button')
  document.body.append(canvas, button)
  t.after(() => {
    look.end(); canvas.remove(); button.remove()
  })
  assert.equal(document.body.style.touchAction, 'none', 'the drag does not scroll the page')
  pointer('pointerdown', canvas, { x: 100, y: 100 })
  pointer('pointermove', canvas, { x: 60, y: 120 })
  look.update()
  const [[yaw, pitch]] = looks
  assert.ok(yaw > 0 && pitch < 0, 'left turns left, down lowers the aim')
  pointer('pointerup', canvas)
  for (const [target, options] of [[canvas, { pointerType: 'mouse' }], [button, {}]]) {
    pointer('pointerdown', target, { ...options, x: 0 })
    pointer('pointermove', target, { ...options, x: 50 })
    pointer('pointerup', target, options)
  }
  looks.length = 0
  look.update()
  assert.deepEqual(looks, [[-0, -0]])
  look.end()
  assert.equal(document.body.style.touchAction, '')
})

test('a first-person game does not fire when a finger only turns the view; the mouse button still fires', t => {
  const keyboard = new Keyboard({ attackKey: 'pointer', touchPressesPointer: false })
  t.after(() => keyboard.end())
  pointer('pointerdown', document.body)
  assert.ok(!keyboard.attack)
  pointer('pointerdown', document.body, { pointerType: 'mouse' })
  assert.ok(keyboard.attack)
})
