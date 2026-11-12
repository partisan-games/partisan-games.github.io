import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh, PerspectiveCamera, Scene } from 'three'
import { createPageElements } from './helpers/dom.js'

let Warplane, Input, GameClock

before(async() => {
  createPageElements()
  Warplane = (await import('/core3d/aircraft/Warplane.js')).default
  Input = (await import('/core/io/Input.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** A box plane in a scene, steered by the keyboard, with a chase camera. */
function createPlane(t, clock = new GameClock()) {
  const scene = new Scene()
  const plane = new Warplane({ clock, camera: new PerspectiveCamera(), limit: 100, mesh: new Mesh(new BoxGeometry(2, 1, 4)) })
  plane.input.end()
  plane.input = new Input({ useKeyboard: true, useJoystick: false })
  scene.add(plane.mesh)
  t.after(() => {
    ;['ArrowRight', 'Enter'].forEach(code => key('keyup', code))
    plane.end()
  })
  return { plane, scene, clock }
}

const fly = (plane, seconds, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) plane.update(1 / fps, i / fps)
}

test('the warplane flies right at its speed and rolls into the turn, up to the side limit', t => {
  const { plane } = createPlane(t)
  key('keydown', 'ArrowRight')
  fly(plane, .5)
  assert.ok(Math.abs(plane.position.x - 20) < .01, `x ${plane.position.x}`)
  assert.ok(plane.mesh.rotation.z < 0, 'rolls right')
  fly(plane, 10)
  assert.ok(plane.position.x <= 100 + plane.speed / 60, 'stays inside the limit')
})

test('the warplane fires a missile, and the next one only after the reload of game time', t => {
  const { plane, clock } = createPlane(t)
  key('keydown', 'Enter')
  fly(plane, .2)
  assert.equal(plane.missiles.length, 1)
  clock.advance(.5)
  fly(plane, 1 / 60)
  assert.equal(plane.missiles.length, 2)
})

test('a landed warplane slows down the same at 30 and at 60 frames per second', t => {
  const speedAfterLanding = fps => {
    const { plane } = createPlane(t)
    plane.position.y = 0 // on the ground
    for (let i = 0; i < fps; i++) plane.land(1 / fps)
    return plane.speed
  }
  const at30 = speedAfterLanding(30), at60 = speedAfterLanding(60)
  assert.ok(Math.abs(at30 - at60) < 1e-9, `${at30} and ${at60}`)
  assert.ok(Math.abs(at60 - 37) < 1e-9, 'as fast as it slowed down at 30 frames per second')
})
