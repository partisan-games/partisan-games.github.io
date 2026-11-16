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

function createPlayer(t, camera) {
  const scene = new Scene()
  const ground = new Mesh(new BoxGeometry(100, 1, 100).translate(0, -.5, 0))
  const player = new Player({
    mesh: body(), animations: clips(), animDict: Object.fromEntries(names.map(name => [name, name])),
    input: new Input({ useKeyboard: true, useJoystick: false }),
    solids: [ground], showHealthBar: false, camera,
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

test('the AI controller creates no document or window event subscriptions', t => {
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
  const ai = new AI({ mesh: body(), baseState: 'idle' })
  assert.ok(ai.controller instanceof AIController)
  assert.equal(ai.input, ai.controller.intent)
  assert.equal(listeners, 0)
})

test('keys move, turn and jump the player the same at 30 and 60 Hz', async t => {
  const play = (sub, codes, fps) => {
    const { player, step } = createPlayer(sub)
    codes.forEach(code => key('keydown', code))
    sub.after(() => codes.forEach(code => key('keyup', code)))
    const states = new Set()
    for (let frame = 0; frame < fps; frame++) {
      step(1 / fps)
      states.add(player.state)
    }
    return { position: player.position.clone(), rotation: player.mesh.rotation.y, states }
  }
  for (const fps of [30, 60])
    await t.test(`at ${fps} Hz`, sub => {
      const walk = play(sub, ['ArrowUp'], fps)
      const run = play(sub, ['ArrowUp', 'ShiftLeft'], fps)
      const turn = play(sub, ['ArrowLeft'], fps)
      const strafe = play(sub, [keys.strafeLeft.codes[0]], fps)
      const jump = play(sub, ['Space'], fps)

      assert.ok(Math.abs(walk.position.z + 1.9) < .1, `walk ${walk.position.z}`)
      assert.ok(Math.abs(run.position.z / walk.position.z - 2) < .01, 'running covers twice the distance')
      assert.ok(run.states.has('run'))
      assert.ok(Math.abs(turn.rotation - Math.PI / 4) < 1e-3, `turn ${turn.rotation}`)
      assert.equal(turn.position.length(), 0)
      assert.ok(Math.abs(strafe.position.x + 1.95) < .05, `strafe ${strafe.position.x}`)
      assert.equal(strafe.position.z, 0)
      assert.ok(jump.states.has('jump'))
    })
})

test('the camera and HUD read state and clean up without moving the player', t => {
  const camera = new PerspectiveCamera()
  const player = new Player({
    mesh: body(), showHealthBar: true, camera,
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
