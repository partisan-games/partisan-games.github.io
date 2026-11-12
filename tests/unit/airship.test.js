import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh } from 'three'
import { createPageElements } from './helpers/dom.js'

let Airship, Input

before(async() => {
  createPageElements()
  Airship = (await import('/core3d/aircraft/Airship.js')).default
  Input = (await import('/core/io/Input.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** Flies a box airship for a second with the keys held, and returns what `measure` reads from it. */
function flyFor(t, fps, codes, measure) {
  const airship = new Airship({ mesh: new Mesh(new BoxGeometry(2, 1, 4)) })
  airship.mesh.position.y = 50 // in the air: lifting off the ground resets the speed
  airship.input.end()
  airship.input = new Input({ useKeyboard: true, useJoystick: false })
  t.after(() => airship.end())
  codes.forEach(code => key('keydown', code))
  for (let i = 0; i < fps; i++) airship.update(1 / fps)
  codes.forEach(code => key('keyup', code))
  return measure(airship)
}

const assertSameAt30And60 = (t, codes, measure, what) => {
  const at30 = flyFor(t, 30, codes, measure), at60 = flyFor(t, 60, codes, measure)
  // turning in fewer, larger steps while slightly pitched differs only in the fifth decimal
  assert.ok(Math.abs(at30 - at60) < 1e-4, `${what}: ${at30} at 30, ${at60} at 60`)
  return at60
}

test('the airship turns as far at 30 as at 60 frames per second, as it did at 30', t => {
  const turn = assertSameAt30And60(t, ['ArrowLeft'], ship => ship.mesh.rotation.y, 'turn')
  assert.ok(Math.abs(turn - .3) < 2e-3, `about .01 a frame for 30 frames, ${turn}`)
})

test('the airship speeds up as much at 30 as at 60 frames per second', t => {
  assertSameAt30And60(t, ['PageUp'], ship => ship.speed, 'speed')
})
