import { test } from 'node:test'
import assert from 'node:assert/strict'
import Strafer, { strafe } from '/core/gameplay/controllers/Strafer.js'
import Fighter from '/core/gameplay/bodies/aircraft/Fighter.js'
import GameClock from '/core/runtime/GameClock.js'

/** A fighter flying left 12 m up, `ahead` metres ahead of a target on the ground, which it sees while `shown`. */
function pass({ ahead = 40, shown = true } = {}) {
  const target = { x: 0, y: 1.5, alive: true, shown }
  const body = new Fighter({ x: ahead, y: 12, yaw: Math.PI, clock: new GameClock() })
  const strafer = new Strafer(body, target, { sees: seen => seen.shown, viewWidth: () => 70 })
  const fly = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      strafer.update(1 / 30)
      body.update(1 / 30)
    }
  }
  return { body, target, strafer, fly }
}

test('a strafer flies level until the target is ahead within reach, then dives at it once, firing once its nose is on it', () => {
  const far = pass({ ahead: 80 })
  far.fly(1 / 30)
  assert.equal(far.body.state, 'idle', 'too far ahead')
  assert.equal(far.body.vy, 0)
  const { body, target, fly } = pass()
  fly(1 / 30)
  assert.equal(body.state, 'idle', 'its level nose is above the target')
  while (body.state !== 'attack' && body.x > target.x) fly(1 / 30)
  assert.ok(Math.abs(body.pitch + Math.atan2(body.y - target.y, body.x - target.x)) <= strafe.aim, 'it fires with its nose on the target')
  assert.ok(body.vy < 0 && body.pitch < 0, 'it dives nose first')
  assert.ok(body.pitch >= -strafe.maxDive - 1e-9, 'no steeper than it can')
  assert.equal(body.vx, -strafe.speed * Math.cos(body.pitch))
})

test('a strafer dives without firing at a target out of sight', () => {
  const { body, fly } = pass({ shown: false })
  fly(1)
  assert.equal(body.state, 'idle')
  assert.ok(body.vy < 0)
})

test('a strafer pulls up near the target or low over it, and does not dive again', () => {
  const { body, strafer, fly } = pass()
  fly(1)
  assert.equal(strafer.phase, 'dive')
  body.y = strafe.lowest
  fly(1 / 30)
  assert.equal(strafer.phase, 'done')
  assert.equal(body.state, 'idle')
  fly(3)
  assert.ok(Math.abs(body.pitch) < 1e-9, 'level again')
  const near = pass({ ahead: strafe.pullUp + .5 })
  near.strafer.phase = 'dive'
  near.fly(.2)
  assert.equal(near.strafer.phase, 'done')
})
