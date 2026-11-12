import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, NumberKeyframeTrack, PerspectiveCamera, Scene, Vector3 } from 'three'
import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import Input from '/core/io/Input.js'
import { keys } from '/core/io/keys.js'
import PlayerController from '/core3d/actor/behaviors/PlayerController.js'
import AIController from '/core3d/actor/behaviors/AIController.js'
import KinematicMovement from '/core3d/actor/behaviors/KinematicMovement.js'

const names = ['idle', 'walk', 'run', 'jump', 'attack']
const clips = () => names.map(name => new AnimationClip(name, .5, [new NumberKeyframeTrack('.position[y]', [0, .5], [0, 0])]))
const body = () => new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0))
const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

function createPlayer(t, useComposedMovement, camera) {
  const scene = new Scene()
  const ground = new Mesh(new BoxGeometry(100, 1, 100).translate(0, -.5, 0))
  const player = new Player({
    mesh: body(), animations: clips(), animDict: Object.fromEntries(names.map(name => [name, name])),
    input: new Input({ useKeyboard: true, useJoystick: false }),
    solids: [ground], showHealthBar: false, camera, useComposedMovement,
  })
  scene.add(ground, player.mesh)
  t.after(() => player.end())
  return { player, step: dt => {
    scene.updateMatrixWorld(true)
    player.update(dt)
  } }
}

test('the same kinematic movement consumes player and AI intentions without platform input', () => {
  const player = new PlayerController({ up: true, run: true })
  const ai = new AIController()
  ai.intent.up = ai.intent.run = true
  const measure = input => {
    const mesh = body()
    const velocity = new Vector3()
    const movement = new KinematicMovement({ mesh, velocity, isBlocked: () => false })
    for (let i = 0; i < 60; i++)
      movement.move(1 / 60, { input, speed: 2, runCoefficient: 2, drag: .5, canMove: true, state: 'run' })
    return mesh.position.z
  }
  assert.ok(measure(ai.intent) < -1)
  assert.equal(measure(player.intent), measure(ai.intent))
})

test('the opt-in AI controller creates no document or window event subscriptions', t => {
  let listeners = 0
  const documentAdd = document.addEventListener.bind(document)
  const windowAdd = window.addEventListener.bind(window)
  t.mock.method(document, 'addEventListener', (...args) => {
    listeners++
    return documentAdd(...args)
  })
  t.mock.method(window, 'addEventListener', (...args) => {
    listeners++
    return windowAdd(...args)
  })
  const ai = new AI({ mesh: body(), baseState: 'idle', useComposedMovement: true })
  assert.ok(ai.controller instanceof AIController)
  assert.equal(ai.input, ai.controller.intent)
  assert.equal(listeners, 0)
})

test('opt-in movement preserves keyboard, FSM and animation outcomes at 30 and 60 Hz', async t => {
  const cases = [
    ['walk', ['ArrowUp']], ['run', ['ArrowUp', 'ShiftLeft']],
    ['turn', ['ArrowLeft']], ['strafe', [keys.strafeLeft.codes[0]]], ['jump', ['Space']],
  ]
  for (const fps of [30, 60])
    for (const [name, codes] of cases)
      await t.test(`${name} at ${fps} Hz`, sub => {
        const legacy = createPlayer(sub, false)
        const composed = createPlayer(sub, true)
        codes.forEach(code => key('keydown', code))
        sub.after(() => codes.forEach(code => key('keyup', code)))
        for (let frame = 0; frame < fps; frame++) {
          legacy.step(1 / fps)
          composed.step(1 / fps)
          assert.ok(legacy.player.position.distanceTo(composed.player.position) < 1e-7)
          assert.equal(legacy.player.state, composed.player.state)
          assert.ok(Math.abs(legacy.player.mesh.rotation.y - composed.player.mesh.rotation.y) < 1e-7)
        }
        for (const action of names)
          assert.equal(legacy.player.anim.actions[action].isRunning(), composed.player.anim.actions[action].isRunning())
      })
})

test('opt-in camera and HUD read state and clean up without moving the player', t => {
  const camera = new PerspectiveCamera()
  const player = new Player({
    mesh: body(), showHealthBar: true, camera, useComposedMovement: true,
    input: new Input({ useKeyboard: false, useJoystick: false }),
  })
  t.after(() => player.end())
  const position = player.position.clone()
  player.health.damage(25)
  player.view.update(1 / 60, 'idle')
  assert.equal(player.healthBar.value, 75)
  assert.equal(player.healthBar.max, 100)
  assert.ok(player.position.equals(position))
  assert.equal(player.chaseCamera, player.view.chaseCamera)
  player.end()
  assert.equal(player.healthBar.isConnected, false)
})

test('the composed terrain and vertical movement use supplied queries and the same velocity', () => {
  const mesh = body()
  const velocity = new Vector3(0, -3, 0)
  const movement = new KinematicMovement({ mesh, velocity, groundHeight: () => 2 })
  const ground = movement.sampleGround({ solids: [], height: 2, altitude: 1 })
  assert.equal(ground, 3)
  mesh.position.y = 4
  movement.vertical(1, ground)
  assert.equal(mesh.position.y, 3)
  movement.gravity(.5, { gravity: 10, maxVelocityY: 20 })
  assert.equal(velocity.y, -8)
})
