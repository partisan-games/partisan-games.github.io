import { test } from 'node:test'
import assert from 'node:assert/strict'
import Character from '/core/gameplay/bodies/characters/Character.js'
import CampCompanion from '/scenes/fps-base/EscapingPrisoners.js'
import CampNavigation from '/scenes/fps-base/CampNavigation.js'
import { CampGuard, Prisoner } from '/scenes/fps-base/stealth.js'

function setup({ enemyX = 15, coverPoints = [], sees = () => true, postureDuration = 0 } = {}) {
  const body = new Character({ reach: 1.65, actions: { attack: .9 }, damage: [40, 40] })
  const leader = new Character({ x: -8 })
  const enemy = new Character({ x: enemyX, reach: 25, health: 100 })
  enemy.face(body)
  body.targets = [enemy]
  const controller = new CampCompanion(body, { leader, enemies: [enemy], index: 0, coverPoints, sees,
    navigation: new CampNavigation(() => false), postureDuration })
  return { body, leader, enemy, controller }
}

test('companions attack a visible guard at pipe range and the actual blow hurts him', () => {
  const { body, enemy, controller } = setup({ enemyX: 1.2 })
  controller.update(.1)
  assert.equal(controller.state, 'defend')
  assert.equal(body.moving, false)
  assert.equal(body.swing.kind, 'attack')
  body.update(.5)
  assert.equal(enemy.health.current, 60)
})

test('a wall prevents a companion attacking a nearby guard', () => {
  const { body, controller } = setup({ enemyX: 1.2, sees: () => false })
  controller.update(.1)
  assert.equal(controller.state, 'follow')
  assert.equal(body.swing, null)
})

test('a companion flees to opaque cover and waits out continued gunfire before following again', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(controller.state, 'cover')
  assert.equal(controller.cover, cover)
  assert.equal(body.running, true)
  assert.equal(body.swing, null)
  body.x = cover.x
  body.z = cover.z
  for (let i = 0; i < 7; i++) {
    enemy.shotsFired++
    controller.update(1)
    assert.equal(controller.state, 'cover')
    assert.equal(body.moving, false)
  }
  controller.update(4.1)
  assert.equal(controller.state, 'follow')
  assert.equal(cover.owner, null)
})

test('a distant guard who is not shooting does not draw a companion away from the player', () => {
  const { body, leader, enemy, controller } = setup()
  controller.update(.1)
  assert.equal(controller.state, 'follow')
  assert.equal(body.swing, null)
  assert.ok(Math.cos(body.yaw) < 0, 'the companion faces the leader, away from the gunner')
  leader.x = body.x + 1
  controller.update(.1)
  assert.equal(body.moving, false)
  assert.equal(enemy.health.current, 100)
})

test('guards can aim at a visible companion and the companion can die from their fire', () => {
  const player = new Character({ x: 15 })
  const companion = new Character({ x: 3, health: 25 })
  const guard = new Character({ reach: 25, damage: [40, 40] })
  const ai = new CampGuard(guard, { target: player, candidates: [player, companion], sees: () => true,
    litAt: () => false, random: () => .5 })
  guard.face(player)
  ai.update(.1)
  assert.equal(ai.target, companion)
  for (let frame = 0; frame < 120 && companion.alive; frame++) {
    ai.update(1 / 30)
    guard.update(1 / 30)
  }
  assert.equal(companion.dead, true)
})

test('waiting companions alternate real crouching idles without rotating or starting combat', () => {
  const { body, leader, controller } = setup()
  leader.x = 1
  const originalYaw = body.yaw
  controller.random = () => .75
  controller.update(8)
  assert.equal(body.crouched, true)
  assert.equal(body.yaw, originalYaw)
  assert.equal(body.waitPose, 'crouchRest')
  assert.equal(body.swing, null)
  assert.equal(body.moving, false)
})

test('companions finish getting up before running and lower gradually when the leader stops', () => {
  const { body, leader, controller } = setup({ postureDuration: 1 })
  controller.update(.1)
  assert.equal(body.posture.name, 'crouchUp')
  assert.equal(body.moving, false)
  assert.equal(body.crouchProgress, .9)
  controller.update(.4)
  assert.equal(body.crouchProgress, .5)
  controller.update(.5)
  assert.equal(body.posture, null)
  assert.equal(body.running, true)
  assert.equal(body.crouchProgress, 0)
  leader.x = 1
  controller.update(.1)
  assert.equal(body.posture.name, 'crouchDown')
  assert.equal(body.crouchProgress, .1)
  controller.update(.9)
  assert.equal(body.posture, null)
  assert.equal(body.crouchProgress, 1)
})

test('reversing a posture transition preserves its progress and death interrupts it', () => {
  const { body, leader, controller } = setup({ postureDuration: 1 })
  controller.update(.5)
  leader.x = 1
  controller.update(.01)
  assert.equal(body.posture.name, 'crouchDown')
  assert.ok(Math.abs(body.crouchProgress - .51) < 1e-9)
  body.takeHit(1000)
  controller.update(.1)
  assert.equal(body.posture, null)
})

test('the prisoner collision height follows the companion posture without moving his feet', () => {
  const body = new Prisoner()
  const leader = new Character({ x: -8 })
  const { size: { height }, feet } = body
  const controller = new CampCompanion(body, { leader, enemies: [], index: 0, coverPoints: [],
    sees: () => true, navigation: new CampNavigation(() => false), postureDuration: 1 })
  controller.update(.25)
  body.update(.25)
  const first = body.size.height
  controller.update(.25)
  body.update(.25)
  assert.ok(first < body.size.height && body.size.height < height)
  assert.ok(Math.abs(body.feet - feet) < 1e-9)
  controller.update(.5)
  body.update(.5)
  assert.equal(body.size.height, height)
  assert.ok(Math.abs(body.feet - feet) < 1e-9)
})

test('a crouching companion gets up before striking a nearby guard', () => {
  const { body, enemy, controller } = setup({ enemyX: 1.2, postureDuration: 1 })
  controller.update(.1)
  assert.equal(body.swing, null)
  assert.equal(body.posture.name, 'crouchUp')
  controller.update(.9)
  controller.update(.01)
  assert.equal(body.swing.kind, 'attack')
  body.update(.5)
  assert.equal(enemy.health.current, 60)
})

test('corner looking occurs in cover during a lull and ends when fire resumes', () => {
  const cover = { x: -3, z: 2 }
  const { body, enemy, controller } = setup({ coverPoints: [cover], sees: (from, to) => to.z < 1 })
  enemy.shotsFired++
  controller.update(.1)
  Object.assign(body, cover)
  controller.update(1.2)
  assert.equal(controller.state, 'cover')
  assert.equal(body.waitPose, 'crouchPeek')
  assert.equal(body.moving, false)
  enemy.shotsFired++
  controller.update(.1)
  assert.equal(body.waitPose, 'crouchIdle')
})
