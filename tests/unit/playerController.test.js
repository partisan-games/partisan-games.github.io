import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, NumberKeyframeTrack, Scene } from 'three'
import Player from '/core3d/actor/Player.js'
import Input from '/core/io/Input.js'
import PlayerController from '/core3d/actor/behaviors/PlayerController.js'
import AttackLoopState from '/core3d/actor/states/AttackLoopState.js'
import { attackStyles, jumpStyles } from '/core3d/constants.js'

const allKeys = { up: true, down: true, strafeLeft: true, strafeRight: true, run: true, jump: true, attack: true, attack2: true, special: true }

/** The states a controller enters from `state` in one decision, given the held keys and the body's facts. */
function decide(state, keys = {}, body = {}) {
  const entered = []
  const actor = {
    state, inAir: false, onGround: false, ableToJump: true, jumpStyle: jumpStyles.ANIM_JUMP, ...body,
    setState: name => entered.push(name),
  }
  new PlayerController(keys).decide(actor)
  return entered
}

test('from idle the controller walks, falls, jumps, attacks and acts in the order the idle state did', () => {
  assert.deepEqual(decide('idle', allKeys, { inAir: true }), ['walk', 'walk', 'fall', 'jump', 'attack', 'attack2', 'special'])
  assert.deepEqual(decide('idle'), [])
  assert.deepEqual(decide('idle', { up: true }), ['walk'])
  assert.deepEqual(decide('idle', { down: true }), ['walk'])
  assert.deepEqual(decide('idle', { strafeRight: true }), ['walk'])
  assert.deepEqual(decide('idle', {}, { inAir: true }), ['fall'])
  assert.deepEqual(decide('idle', { jump: true }), ['jump'])
  assert.deepEqual(decide('idle', { jump: true }, { ableToJump: false }), [], 'a body that cannot jump stays')
  assert.deepEqual(decide('idle', { attack2: true }), ['attack2'])
  assert.deepEqual(decide('idle', { special: true }), ['special'])
})

test('from walk the controller jumps, falls, attacks, runs or stops in the order the walk state did', () => {
  assert.deepEqual(decide('walk', allKeys, { inAir: true }), ['jump', 'fall', 'attack', 'attack2', 'run'])
  assert.deepEqual(decide('walk', { up: true }), [])
  assert.deepEqual(decide('walk', { strafeLeft: true }), [])
  assert.deepEqual(decide('walk', { up: true, jump: true }, { ableToJump: false }), [])
  assert.deepEqual(decide('walk', { run: true }), ['run', 'idle'], 'running without a direction ends standing')
  assert.deepEqual(decide('walk'), ['idle'])
  assert.deepEqual(decide('walk', { jump: true }, { inAir: true }), ['jump', 'fall', 'idle'])
})

test('from run the controller jumps, falls, attacks, walks or stops in the order the run state did', () => {
  assert.deepEqual(decide('run', allKeys, { inAir: true }), ['jump', 'fall', 'attack', 'attack2'])
  assert.deepEqual(decide('run', { up: true, run: true }), [])
  assert.deepEqual(decide('run', { down: true }), ['walk'])
  assert.deepEqual(decide('run'), ['walk', 'idle'])
  assert.deepEqual(decide('run', { run: true, attack: true }), ['attack', 'idle'])
})

test('from a fall the controller flies up again only in the flying jump style, and stands once on the ground', () => {
  assert.deepEqual(decide('fall', allKeys, { jumpStyle: jumpStyles.FLY, onGround: true }), ['jump', 'idle'])
  assert.deepEqual(decide('fall', allKeys, { jumpStyle: jumpStyles.FLY_JUMP }), [])
  assert.deepEqual(decide('fall', { jump: true }, { jumpStyle: jumpStyles.FLY }), ['jump'])
  assert.deepEqual(decide('fall', {}, { onGround: true }), ['idle'])
})

test('the controller leaves states that end on their own to themselves', () => {
  for (const state of ['jump', 'attack', 'attack2', 'special', 'pain', 'death'])
    assert.deepEqual(decide(state, allKeys, { inAir: true, onGround: true }), [], state)
})

/** A looping attack of an actor that counts its swings and the states it is sent to. */
function loopAttack(controller) {
  const action = {}
  const actor = {
    controller, swings: 0, entered: [],
    anim: { getAction: () => action, playLoopAction() {}, removeEventListener() {} },
    enterAttack() {
      this.swings++
    },
    setState(name) {
      this.entered.push(name)
    },
  }
  const state = new AttackLoopState(actor, 'attack')
  state.enter({ name: 'walk' })
  state.onLoopEnd({ action })
  return actor
}

test('a looping attack swings again while its controller holds the key, and returns when it lets go', () => {
  const held = loopAttack(new PlayerController({ attack: true }))
  assert.equal(held.swings, 2)
  assert.deepEqual(held.entered, [])

  const released = loopAttack(new PlayerController({}))
  assert.equal(released.swings, 1)
  assert.deepEqual(released.entered, ['walk'])
})

test('a looping attack without a controller goes on until someone changes the state', () => {
  const actor = loopAttack(null)
  assert.equal(actor.swings, 2)
  assert.deepEqual(actor.entered, [])
})

const names = ['idle', 'walk', 'run', 'jump', 'attack']
const clips = () => names.map(name => new AnimationClip(name, .5, [new NumberKeyframeTrack('.position[y]', [0, .5], [0, 0])]))

function createPlayer(t, options) {
  const scene = new Scene()
  const ground = new Mesh(new BoxGeometry(100, 1, 100).translate(0, -.5, 0))
  const player = new Player({
    mesh: new Mesh(new BoxGeometry(1, 2, 1).translate(0, 1, 0)),
    animations: clips(), animDict: Object.fromEntries(names.map(name => [name, name])),
    input: new Input({ useKeyboard: false, useJoystick: false }),
    solids: [ground], showHealthBar: false, ...options,
  })
  scene.add(ground, player.mesh)
  t.after(() => player.end())
  return { player, step: () => {
    scene.updateMatrixWorld(true)
    player.update(1 / 30)
  } }
}

test('a player without a controller stays in the state it is set to', t => {
  const { player, step } = createPlayer(t, { controller: null })
  for (const state of ['walk', 'run']) {
    player.setState(state)
    for (let frame = 0; frame < 30; frame++) step()
    assert.equal(player.state, state)
  }
})

test('a player whose controller holds no key stops walking in the first frame', t => {
  const { player, step } = createPlayer(t)
  player.setState('walk')
  step()
  assert.equal(player.state, 'idle')
})

test('a state the body leaves on its own is decided upon by the controller only in the next frame', t => {
  const { player, step } = createPlayer(t, { animations: [], animDict: {}, attackStyle: attackStyles.ONCE, input: { up: true } })
  player.setState('attack')
  for (let frame = 0; frame < 30 && player.state === 'attack'; frame++) step()
  assert.equal(player.state, 'idle', 'the attack ends on its own')
  step()
  assert.equal(player.state, 'walk', 'and the controller, holding the key forward, walks on')
})
