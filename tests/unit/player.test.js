import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, NumberKeyframeTrack, Scene } from 'three'
import Player from '/core3d/actor/Player.js'
import Input from '/core/io/Input.js'

const clipNames = ['idle', 'walk', 'run', 'jump', 'attack']
const animDict = Object.fromEntries(clipNames.map(name => [name, name]))
const createClips = () => clipNames.map(name =>
  new AnimationClip(name, .5, [new NumberKeyframeTrack('.position[y]', [0, .5], [0, 0])]))

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

/** A player on flat ground, driven by real keyboard events through the whole chain: input, states, movement, animation. */
function createPlayer(t) {
  const scene = new Scene()
  const ground = new Mesh(new BoxGeometry(100, 1, 100).translate(0, -.5, 0))
  const input = new Input({ useKeyboard: true, useJoystick: false })
  const player = new Player({ mesh: createBody(2), animations: createClips(), animDict, input, solids: [ground], showHealthBar: false })
  scene.add(ground, player.mesh)
  t.after(() => player.end())

  const play = (seconds = .5) => {
    for (let i = 0; i < seconds * 60; i++) {
      scene.updateMatrixWorld()
      player.update(1 / 60)
    }
  }
  return { player, play }
}

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))
const press = code => key('keydown', code)
const release = code => key('keyup', code)
const isRunning = (player, name) => player.anim.actions[name].isRunning()

test('the up arrow walks the player forward with the walk animation, and releasing it stops', t => {
  const { player, play } = createPlayer(t)
  const start = player.position.z

  press('ArrowUp')
  play()
  assert.equal(player.state, 'walk')
  assert.ok(isRunning(player, 'walk'))
  assert.ok(player.position.z < start - .3, 'moved forward')

  release('ArrowUp')
  play()
  assert.equal(player.state, 'idle')
  const stoppedAt = player.position.z
  play()
  assert.ok(Math.abs(player.position.z - stoppedAt) < .01, 'stands still')
})

test('holding Shift runs farther than walking in the same time', t => {
  const walker = createPlayer(t)
  press('ArrowUp')
  walker.play(1)
  release('ArrowUp')
  const walked = -walker.player.position.z

  const runner = createPlayer(t)
  press('ShiftLeft')
  press('ArrowUp')
  runner.play(1)
  assert.equal(runner.player.state, 'run')
  assert.ok(isRunning(runner.player, 'run'))
  release('ArrowUp')
  release('ShiftLeft')

  assert.ok(-runner.player.position.z > walked * 1.5, `ran ${-runner.player.position.z}, walked ${walked}`)
})

test('the left arrow turns the player in place', t => {
  const { player, play } = createPlayer(t)
  const { x, z } = player.position

  press('ArrowLeft')
  play()
  release('ArrowLeft')

  assert.ok(player.mesh.rotation.y > .3, 'turned left')
  assert.ok(Math.hypot(player.position.x - x, player.position.z - z) < .01, 'did not move')
})

test('Space plays the jump once and returns to standing', t => {
  const { player, play } = createPlayer(t)

  press('Space')
  play(.1)
  release('Space')
  assert.equal(player.state, 'jump')
  assert.ok(isRunning(player, 'jump'))

  play(1)
  assert.equal(player.state, 'idle')
})

test('Enter attacks on every loop while held and stops after it is released', t => {
  const { player, play } = createPlayer(t)
  let attacks = 0
  player.enterAttack = () => attacks++

  press('Enter')
  play(1.1)
  assert.equal(player.state, 'attack')
  assert.ok(attacks >= 3, `attacked ${attacks} times`) // on entering and on each half-second loop

  release('Enter')
  play(1)
  assert.equal(player.state, 'idle')
})
