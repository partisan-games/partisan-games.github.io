import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Rifleman, rifle, patrol, kinds, GameSession, GameObject2D

before(async() => {
  createPageElements()
  ;({ default: Rifleman, rifle, patrol } = await import('/scenes/franjo-kluz/Rifleman.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

/** A soldier alone with the plane his rounds may hit; nothing of a game around him. */
function soldierAlone(t, { kind = kinds.soldier } = {}) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const plane = new GameObject2D(null, { x: 0, y: 0, width: 200, height: 60 })
  const soldier = new Rifleman({ ...kind, targets: [plane], session, camera: { cameraX: 0, cameraY: 0 }, groundY: 700, x: 1000 })
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      session.update(1 / 30)
      soldier.update(1 / 30)
    }
  }
  return { soldier, plane, live }
}

test('a soldier has the states idle, patrol, fire and dead, and starts at ease', t => {
  const { soldier } = soldierAlone(t)
  assert.deepEqual(soldier.states, ['idle', 'patrol', 'fire', 'dead'])
  assert.equal(soldier.state, 'idle')
  assert.equal(soldier.pose, 'rest')
})

test('a soldier keeps his state until set to another: at ease he stands, on patrol he walks to and fro by his post', t => {
  const { soldier, plane, live } = soldierAlone(t)
  plane.setPosition(soldier.x, soldier.y - 300)
  live(10)
  assert.equal(soldier.state, 'idle')
  assert.equal(soldier.x, soldier.post, 'he stands')
  soldier.setState('patrol')
  const headings = new Set()
  for (let second = 0; second < 20; second++) {
    live(1)
    headings.add(soldier.heading)
    assert.equal(soldier.state, 'patrol')
    assert.equal(soldier.pose, 'walk')
    assert.ok(Math.abs(soldier.x - soldier.post) <= patrol.range + 1e-9, 'he keeps near his post')
    assert.equal(soldier.flipY, soldier.heading, 'he faces where he walks')
  }
  assert.deepEqual([...headings].sort(), [-1, 1], 'he turns at the ends of his patrol')
  assert.equal(soldier.bullets.projectiles.length, 0, 'he fires only when set to')
})

test('a soldier set to fire stops and fires from his muzzle where he aims, the rifle raised for a steep shot', t => {
  const { soldier, live } = soldierAlone(t)
  soldier.setState('patrol')
  live(.5)
  assert.equal(soldier.aimAt({ x: soldier.x + 100, y: soldier.y - 400 }), true)
  soldier.setState('fire')
  soldier.cooldown.start(0)
  live(1 / 30)
  assert.equal(soldier.flipY, 1, 'he faces the point')
  assert.equal(soldier.pose, 'fireUp')
  const [round] = soldier.bullets.projectiles
  const muzzle = soldier.framePoint(soldier.art.clips.fireUp.muzzle)
  assert.ok(Math.hypot(round.x - muzzle.x, round.y - muzzle.y) < rifle.speed / 30 + 1e-9, 'the round leaves the muzzle')
  const { x } = soldier
  live(1)
  assert.equal(soldier.x, x, 'he no longer walks')

  assert.equal(soldier.aimAt({ x: soldier.x - 500, y: soldier.y - 100 }), true)
  soldier.cooldown.start(0)
  live(1 / 30)
  assert.equal(soldier.flipY, -1)
  assert.equal(soldier.pose, 'fire', 'a low point gets a level shot')
})

test('a soldier in state fire shoots wherever he aims, straight ahead when he aims nowhere', t => {
  const { soldier, live } = soldierAlone(t)
  soldier.setState('fire')
  soldier.cooldown.start(0)
  live(1 / 30)
  const [ahead] = soldier.bullets.projectiles
  assert.equal(ahead.visible, true)
  assert.ok(Math.abs(ahead.dy) < 1e-9, 'level')
  assert.equal(Math.sign(ahead.dx), soldier.forward, 'he fires the way he faces')
  soldier.aimAt({ x: soldier.x + 5000, y: soldier.y - 10 })
  soldier.cooldown.start(0)
  live(1 / 30)
  assert.equal(soldier.bullets.projectiles.filter(round => round.visible).length, 2, 'he fires although the point is out of reach')
})

test('a soldier set to dead falls and stays down, and fires no more', t => {
  const { soldier, live } = soldierAlone(t)
  soldier.aimAt({ x: soldier.x, y: soldier.y - 300 })
  soldier.setState('fire')
  soldier.setState('dead')
  assert.equal(soldier.dead, true)
  assert.equal(soldier.pose, 'death')
  soldier.cooldown.start(0)
  live(1)
  assert.equal(soldier.state, 'dead')
  assert.equal(soldier.bullets.projectiles.length, 0)
})

test('a soldier aims only at a point above him, and a round that hits a target takes a little of its health', t => {
  const { soldier, plane, live } = soldierAlone(t)
  const health = 100
  plane.health = health
  plane.takeHit = damage => {
    plane.health -= damage
  }
  soldier.setState('fire')
  plane.setPosition(soldier.x + 100, soldier.y - 300)
  assert.equal(soldier.aimAt(plane), true)
  soldier.cooldown.start(0)
  live(1 / 30)
  const [round] = soldier.bullets.projectiles
  assert.equal(round.visible, true, 'it fires')
  round.hit(plane)
  assert.equal(plane.health, health - rifle.damage)

  assert.equal(soldier.aimAt({ x: soldier.x + 100, y: soldier.y + 10 }), false, 'not below him')
})

test('a soldier in state idle fires nothing even with a point aimed at', t => {
  const { soldier, live } = soldierAlone(t)
  soldier.aimAt({ x: soldier.x + 100, y: soldier.y - 300 })
  soldier.cooldown.start(0)
  live(2)
  assert.equal(soldier.bullets.projectiles.length, 0)
})

test('each shot the soldier lists has its own picture: level at a low plane, the rifle raised at a high one', t => {
  const { soldier, live } = soldierAlone(t)
  soldier.setState('fire')
  for (const [name, pose] of [['straight', 'fire'], ['up', 'fireUp']]) {
    const shot = soldier.shots[name]
    assert.equal(soldier.aimAt({ x: soldier.x + soldier.forward * shot.x, y: soldier.y + shot.y }), true)
    soldier.cooldown.start(0)
    live(1 / 30)
    assert.equal(soldier.pose, pose, name)
  }
})
