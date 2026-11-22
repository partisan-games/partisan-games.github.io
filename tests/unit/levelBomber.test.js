import { test } from 'node:test'
import assert from 'node:assert/strict'
import LevelBomber, { levelBomber } from '/core/gameplay/bodies/aircraft/LevelBomber.js'
import Scout, { scout } from '/core/gameplay/bodies/aircraft/Scout.js'

const live = (bodies, seconds, fps = 30) => {
  for (let i = 0; i < seconds * fps; i++) bodies.forEach(body => body.update(1 / fps))
}

test('a He 111 flies level, aims only where a bomb let go now would land, and set to fire lets its stick go', () => {
  const impacts = []
  const body = new LevelBomber({ x: 0, y: 20, yaw: 0, onImpact: point => impacts.push(point) })
  live([body], 1)
  assert.equal(body.y, 20)
  assert.ok(Math.abs(body.x - levelBomber.speed) < 1e-9, 'level, at its speed')
  const target = { x: body.landing + 2, y: 0 }
  assert.equal(body.aimAt({ x: body.landing + levelBomber.spread * 2, y: 0 }), false, 'too far from where a bomb would land')
  assert.equal(body.aimAt(target), true)
  body.setState('attack')
  live([body], levelBomber.interval * (levelBomber.bombs + 1))
  assert.equal(body.shotsFired, levelBomber.bombs, 'one stick a pass')
  assert.equal(body.aimAt(target), false, 'none left')
  live([body], 3)
  assert.equal(impacts.length, levelBomber.bombs)
  assert.ok(Math.abs(impacts[0].x - target.x) <= levelBomber.spread, 'the first lands near the aim')
  body.enter()
  assert.equal(body.loaded, levelBomber.bombs, 'a new pass brings a new stick')
})

test('a He 111 and a Storch shot down fall and crash where they reach the ground, once', () => {
  for (const body of [new LevelBomber({ x: 0, y: 20 }), new Scout({ x: 0, y: 9 })]) {
    const crashes = []
    body.onCrash = point => crashes.push(point)
    body.takeHit(body.health.maximum)
    body.setState('move')
    assert.equal(body.state, 'dead')
    live([body], 10)
    assert.equal(body.crashed, true)
    assert.equal(crashes.length, 1)
    assert.equal(body.y, 0)
  }
})

test('a Storch flies slowly, level, the way it faces', () => {
  const body = new Scout({ x: 100, y: 9, yaw: Math.PI })
  live([body], 2)
  assert.ok(Math.abs(body.x - (100 - 2 * scout.speed)) < 1e-9)
  assert.equal(body.y, 9)
})
