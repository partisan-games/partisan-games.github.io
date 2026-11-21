import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'

/** Plays `seconds` at 30 frames a second, the controllers deciding before the bodies move, as in a scene. */
const play = (seconds, controllers, bodies) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) {
    controllers.forEach(controller => controller.update(1 / 30))
    bodies.forEach(body => body.update(1 / 30))
  }
}

test('keys walk, run, turn and side-step a character, jump it and swing the attack held', () => {
  const input = {}
  const body = new Character({ actions: { attack: .5, attack2: .5, jump: .4 } })
  const keys = new CharacterKeys(body, input)
  input.up = true
  play(.5, [keys], [body])
  assert.equal(body.state, 'move')
  assert.ok(body.x > .5)
  Object.assign(input, { up: false, strafeRight: true })
  play(.5, [keys], [body])
  assert.ok(body.z > .5, 'its right is +z')
  Object.assign(input, { strafeRight: false, left: true, run: true })
  play(.5, [keys], [body])
  assert.ok(body.yaw > .5)
  Object.assign(input, { left: false, run: false, attack2: true })
  keys.update(1 / 30)
  assert.equal(body.swing.kind, 'attack2')
  input.attack2 = false
  play(1, [keys], [body])
  assert.equal(body.state, 'idle')
  input.jump = true
  keys.update(1 / 30)
  assert.ok(body.leap > 0)
})

test('a wandering character chases a target it sees, swings at it in reach and leaves the dead alone', () => {
  const target = new Character({ x: 6, health: 50 })
  const body = new Character({ reach: 1.5, actions: { attack: .5 }, targets: [target], random: () => 0 })
  const ai = new CharacterAI(body, { target, way: 'wander', random: () => .5 })
  body.face(target)
  play(.1, [ai], [body, target])
  assert.equal(ai.doing, 'pursue')
  assert.ok(body.running)
  play(4, [ai], [body, target])
  assert.ok(target.dead, 'two blows of 35 kill 50')
  assert.equal(ai.target, null)
  assert.equal(ai.doing, 'wander')
})

test('it does not chase a target it cannot see, and a patrol turns back after its distance', () => {
  const target = new Character({ x: 3 })
  const body = new Character()
  const ai = new CharacterAI(body, { target, way: 'patrol', patrolDistance: 2, sees: () => false, random: () => .5 })
  body.face({ x: 0, z: -1 })
  const start = body.yaw
  // a walk of 1 s, then a half turn at its walking turn, π/8 radians a second for each metre a second of its walk
  play(5.3, [ai], [body])
  assert.equal(ai.doing, 'patrol')
  const turned = Math.abs(Math.atan2(Math.sin(body.yaw - start), Math.cos(body.yaw - start)))
  assert.ok(Math.abs(turned - Math.PI) < .01, `it turned back: ${turned}`)
})

test('a follower walks after its target and stops close to it; a fleer runs away', () => {
  const target = new Character({ x: 10 })
  const follower = new Character()
  const follow = new CharacterAI(follower, { target, way: 'follow', followDistance: 2, random: () => .5 })
  play(.1, [follow], [follower])
  assert.equal(follow.doing, 'follow')
  play(8, [follow], [follower])
  assert.equal(follow.doing, 'idle')
  assert.ok(Math.abs(target.x - follower.x - 2) < .5, `stopped near: ${follower.x}`)

  const fleer = new Character({ x: 5 })
  const flee = new CharacterAI(fleer, { target: new Character(), way: 'flee', random: () => .5 })
  play(1, [flee], [fleer])
  assert.equal(flee.doing, 'flee')
  assert.ok(fleer.x > 7, 'it runs away from its target')
})
