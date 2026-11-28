import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import WalkKeys from '/core/gameplay/controllers/WalkKeys.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import Escort, { escort } from '/core/gameplay/controllers/Escort.js'
import NearestTarget from '/core/gameplay/controllers/NearestTarget.js'

/** Plays `seconds` at 30 frames a second, the controllers deciding before the bodies move, as in a scene. */
const play = (seconds, controllers, bodies) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) {
    controllers.forEach(controller => controller.update(1 / 30))
    bodies.forEach(body => body.update(1 / 30))
  }
}

test('walking keys walk a shooter whose gun fires on its own trigger, so the attack key does not swing', () => {
  const input = { up: true, attack: true }
  const body = new Character({ actions: { attack: .1 } })
  play(.5, [new WalkKeys(body, input)], [body])
  assert.ok(body.x > .5)
  assert.equal(body.swing, null)
})

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

test('an escort keeps its place beside its leader, the way the leader faces, and stops to shoot the nearest enemy it sees', () => {
  // the leader faces +z, so ahead is +z and its right is -x
  const leader = { x: 30, z: 0, yaw: -Math.PI / 2 }
  const enemies = []
  const body = new Character({ reach: escort.sight, actions: { attack: .2 }, targets: enemies })
  const guard = new Escort(body, { leader, enemies, place: { ahead: 4, side: 3 }, random: () => .5 })
  play(8, [guard], [body])
  const distance = Math.hypot(27 - body.x, 4 - body.z)
  assert.ok(distance <= escort.keep + .5, `it keeps to its place ahead and to the right: ${body.x}, ${body.z}`)
  const far = new Character({ x: body.x + 30, z: 1, health: 1000 }), near = new Character({ x: body.x + 15, health: 1000 })
  enemies.push(far, near)
  const { x } = body
  play(escort.pause[1] * 2, [guard], [body, far, near])
  assert.ok(Math.abs(body.x - x) < .5, 'it stands to shoot')
  assert.ok(near.hitsTaken > 0 && far.hitsTaken === 0, 'it shoots the nearest')
  const hidden = new Escort(new Character({ actions: { attack: .2 } }), { leader, enemies, sees: () => false })
  assert.equal(hidden.target, null, 'it does not shoot what it cannot see')
})

test('a tank escort keeps a steady gait as the tank creeps, speeds up and stops', () => {
  for (const fps of [30, 120]) {
    const leader = { x: 0, z: 0, yaw: -Math.PI / 2 }
    const body = new Character({ speed: 3 })
    const guard = new Escort(body, { leader, enemies: [] })
    const drive = (speed, check) => {
      for (let frame = 0; frame < fps * 6; frame++) {
        leader.z += speed / fps
        guard.update(1 / fps)
        body.update(1 / fps)
        if (frame >= fps * 4) check()
      }
    }
    for (const speed of [.8, 3, 5]) drive(speed, () => {
      assert.equal(body.state, 'move')
      assert.equal(body.running, speed > body.speed)
      assert.ok(Math.abs(body.vz - speed) < .1)
    })
    drive(0, () => {
      assert.equal(body.state, 'idle')
      assert.ok(Math.abs(body.vz) < .01)
    })
  }
})

test('a fighter turns to the nearest living candidate, and to the next when its target falls', () => {
  const body = new Character()
  const ai = new CharacterAI(body, { random: () => .5 })
  const tank = { x: 20, z: 0, alive: true }, comrade = new Character({ x: 5 })
  const pick = new NearestTarget(ai, { candidates: [tank, comrade] })
  pick.update(1 / 30)
  assert.equal(ai.target, comrade)
  comrade.takeHit(1000)
  pick.update(1 / 30)
  assert.equal(ai.target, tank, 'a fallen target is replaced at once')
})

test('an escort fights before it follows, holds a while after the fight, and a hit it cannot answer sends it on', () => {
  const leader = { x: 0, z: 0, yaw: 0 }
  const enemy = new Character({ x: -10, health: 1000 })
  const body = new Character({ reach: escort.sight, actions: { attack: .2 }, targets: [enemy] })
  body.crouched = false
  const guard = new Escort(body, { leader, enemies: [enemy], random: () => .5 })
  leader.x = 30
  play(escort.pause[1] * 2, [guard], [body, enemy])
  assert.ok(Math.abs(body.x) < .5, `left behind in a fight, it stands its ground: ${body.x}`)
  assert.ok(enemy.hitsTaken > 0, 'and fires back')
  assert.equal(body.crouched, true, 'crouched, as it can')
  enemy.takeHit(1000)
  play(escort.calm - .5, [guard], [body, enemy])
  assert.ok(Math.abs(body.x) < .5, 'it holds a while after the fight')
  play(2, [guard], [body, enemy])
  assert.ok(body.x > 3, `then it goes after its leader: ${body.x}`)
  assert.equal(body.crouched, false, 'upright')

  const hitBody = new Character({ actions: { attack: .2 } })
  const hitGuard = new Escort(hitBody, { leader, enemies: [], random: () => .5 })
  hitGuard.quiet = 0
  hitBody.takeHit(1)
  play(1, [hitGuard], [hitBody])
  assert.ok(hitBody.x > 1, `hit with no one in sight, it does not wait to be hit again: ${hitBody.x}`)
})
