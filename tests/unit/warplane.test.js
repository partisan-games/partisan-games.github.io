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
    ;['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter'].forEach(code => key('keyup', code))
    plane.end()
  })
  return { plane, scene, clock }
}

const fly = (plane, seconds, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) plane.update(1 / fps, i / fps)
}

test('the warplane accelerates into a turn and stays exactly inside the side limit', t => {
  const { plane } = createPlane(t)
  key('keydown', 'ArrowRight')
  fly(plane, 1 / 60)
  assert.ok(plane.position.x > 0 && plane.position.x < plane.speed / 60, 'does not jump straight to full speed')
  fly(plane, .5)
  assert.ok(plane.position.x > 16 && plane.position.x < 20, `x ${plane.position.x}`)
  assert.ok(plane.mesh.rotation.z < 0, 'rolls right')
  fly(plane, 10)
  assert.equal(plane.position.x, 100, 'does not overshoot the limit')
  assert.equal(plane.velocityX, 0)
})

test('releasing or reversing steering changes velocity smoothly', t => {
  const { plane } = createPlane(t)
  key('keydown', 'ArrowRight')
  fly(plane, .5)
  const speed = plane.velocityX
  key('keyup', 'ArrowRight')
  fly(plane, 1 / 60)
  assert.ok(plane.velocityX > 0 && plane.velocityX < speed, 'brief braking instead of an instant stop')
  key('keydown', 'ArrowLeft')
  fly(plane, 1 / 60)
  assert.ok(plane.velocityX > 0, 'does not instantly reverse velocity')
  fly(plane, .2)
  assert.ok(plane.velocityX < 0)
  assert.ok(Math.abs(plane.mesh.rotation.z) <= plane.maxRoll)
})

test('steering and braking cover the same distance at 30, 60 and 120 fps', t => {
  const positions = [30, 60, 120].map(fps => {
    const { plane } = createPlane(t)
    key('keydown', 'ArrowRight')
    fly(plane, 1, fps)
    key('keyup', 'ArrowRight')
    fly(plane, .5, fps)
    return plane.position.x
  })
  for (const x of positions) assert.ok(Math.abs(x - positions[0]) < 1e-9)
})

test('uneven frame durations do not shift the plane relative to its camera', t => {
  const { plane } = createPlane(t)
  key('keydown', 'ArrowRight')
  key('keydown', 'ArrowUp')
  for (const delta of [1 / 60, 1 / 30, 1 / 120, .1, 1 / 60]) {
    plane.update(delta)
    const { camera } = plane.chaseCamera
    camera.updateMatrixWorld()
    const screen = plane.position.clone().project(camera)
    assert.ok(Math.abs(screen.x) < 1e-9, `horizontal screen position at dt ${delta}`)
    assert.ok(Math.abs(screen.y) < 1e-9, `vertical screen position at dt ${delta}`)
    assert.equal(camera.position.z - plane.position.z, plane.depth)
  }
  assert.ok(plane.position.x > 0)
  assert.ok(plane.position.y > 29)
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
