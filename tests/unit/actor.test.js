import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, NumberKeyframeTrack, Scene } from 'three'
import AI from '/core3d/actor/AI.js'
import Animator from '/core3d/actor/Animator.js'
import * as timers from '/core/timers.js'

const clipNames = ['idle', 'walk', 'pain', 'attack', 'jump']
const animDict = Object.fromEntries(clipNames.map(name => [name, name]))
const createClips = () => clipNames.map(name =>
  new AnimationClip(name, 1, [new NumberKeyframeTrack('.position[y]', [0, 1], [0, 0])]))

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

function createActor(props = {}) {
  const scene = new Scene()
  const ai = new AI({ mesh: createBody(2), animations: createClips(), animDict, baseState: 'idle', ...props })
  scene.add(ai.mesh)
  return { ai, scene }
}

const dispatch = (ai, type, name) => ai.anim.mixer.dispatchEvent({ type, action: ai.anim.actions[name] })

test('a one-time animation state ignores the end of the animation fading out', () => {
  const { ai } = createActor()
  ai.setState('pain')

  dispatch(ai, 'finished', 'idle')
  assert.equal(ai.state, 'pain')

  dispatch(ai, 'finished', 'pain')
  assert.equal(ai.state, 'idle')
})

test('a looping AI attack strikes again only when its own animation loops', () => {
  const target = createBody(2)
  const { ai } = createActor({ target })
  let attacks = 0
  ai.enterAttack = () => attacks++
  ai.setState('attack')
  assert.equal(attacks, 1)

  dispatch(ai, 'loop', 'walk')
  assert.equal(attacks, 1)

  dispatch(ai, 'loop', 'attack')
  assert.equal(attacks, 2)
})

test('a one-time animation can be played in reverse', () => {
  const mesh = createBody(2)
  const animator = new Animator({ mesh, animations: createClips(), animDict })

  animator.playActionOnce(null, 'jump', true)
  assert.equal(animator.actions.jump.getEffectiveTimeScale(), -1)
})

test('hitting a corpse does not count as a new death', () => {
  let deaths = 0
  const { ai } = createActor({ deathCallback: () => deaths++ })

  ai.damageAmount = 1000
  ai.update(1 / 60)
  ai.damageAmount = 50
  ai.update(1 / 60)

  assert.equal(deaths, 1)
})

test('an AI notices a target behind it only when the target is close', () => {
  const target = createBody(2)
  const { ai } = createActor({ target })
  ai.mesh.rotation.y = 0
  ai.lookAt(target.position.clone().setZ(-100)) // face away from the target

  target.position.set(0, 0, 20)
  assert.equal(ai.targetNear, false)

  target.position.set(0, 0, 5)
  assert.equal(ai.targetNear, true)
})

test('a delayed flame does not start after the attack has already ended', () => {
  const { ai } = createActor()
  ai.flame = { mesh: new Mesh(), reset() {} }
  let damaged = 0

  ai.startFlame(1, () => damaged++)
  ai.endFlame()
  timers.update(1)

  assert.equal(damaged, 0)
  assert.equal(ai.shouldLoop, false)
})

test('an attack that lands after the actor left the scene does nothing', () => {
  const { ai, scene } = createActor()
  let sounds = 0
  ai.attackSound = 'shot.mp3'
  ai.playAttackSound = () => sounds++

  ai.enterAttack('player')
  scene.remove(ai.mesh)
  timers.update(1)

  assert.equal(sounds, 0)
})
