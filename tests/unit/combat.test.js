import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AnimationClip, BoxGeometry, Mesh, NumberKeyframeTrack, Scene } from 'three'
import AI from '/core3d/actor/AI.js'
import Player from '/core3d/actor/Player.js'
import Input from '/core/io/Input.js'
import * as timers from '/core/timers.js'

const createClips = names => names.map(name =>
  new AnimationClip(name, .5, [new NumberKeyframeTrack('.position[y]', [0, .5], [0, 0])]))
const dictOf = names => Object.fromEntries(names.map(name => [name, name]))

/** A box standing on the ground, with its origin at its feet like a character model. */
const createBody = height => new Mesh(new BoxGeometry(1, height, 1).translate(0, height / 2, 0))

test('an enemy spots the player, runs up, attacks until the player dies and then stops', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  const scene = new Scene()
  const ground = new Mesh(new BoxGeometry(100, 1, 100).translate(0, -.5, 0))

  let deaths = 0
  const playerClips = ['idle', 'walk']
  const player = new Player({
    mesh: createBody(2), animations: createClips(playerClips), animDict: dictOf(playerClips),
    input: new Input({ useKeyboard: false, useJoystick: false }), solids: [ground], showHealthBar: false,
    deathCallback: () => deaths++,
  })
  t.after(() => player.end())

  const enemyClips = ['idle', 'walk', 'run', 'attack']
  const enemy = new AI({
    mesh: createBody(2), animations: createClips(enemyClips), animDict: dictOf(enemyClips),
    baseState: 'idle', target: player.mesh, pos: [0, 0, -6],
  })
  scene.add(ground, player.mesh, enemy.mesh)

  const states = new Set()
  let hitsAfterDeath = 0
  const hit = enemy.hit.bind(enemy)
  enemy.hit = (...args) => {
    if (player.dead) hitsAfterDeath++
    hit(...args)
  }

  for (let frame = 0; frame < 60 * 20 && !player.dead; frame++) {
    scene.updateMatrixWorld()
    enemy.update(1 / 60)
    player.update(1 / 60)
    states.add(enemy.state)
    t.mock.timers.tick(1000 / 60)
    timers.update(1 / 60)
  }

  assert.ok(states.has('pursue'), `enemy states: ${[...states]}`)
  assert.ok(states.has('attack'), `enemy states: ${[...states]}`)
  assert.equal(player.dead, true, `player energy left: ${player.energy}`)
  assert.equal(player.state, 'death')
  assert.equal(deaths, 1)

  for (let frame = 0; frame < 60 * 3; frame++) {
    scene.updateMatrixWorld()
    enemy.update(1 / 60)
    player.update(1 / 60)
    t.mock.timers.tick(1000 / 60)
    timers.update(1 / 60)
  }
  assert.equal(enemy.target, null, 'the enemy lets go of a dead target')
  assert.equal(hitsAfterDeath, 0)
  assert.equal(deaths, 1)
})
