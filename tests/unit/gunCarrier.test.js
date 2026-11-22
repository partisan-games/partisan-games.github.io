import { test } from 'node:test'
import assert from 'node:assert/strict'
import GunCarrier, { gunCarrierKinds } from '/core/gameplay/bodies/vehicles/GunCarrier.js'
import Body from '/core/gameplay/bodies/Body.js'
import GameClock from '/core/runtime/GameClock.js'

/** A machine-gun carrier of `kind` at x 50 facing left, a target ahead of it, on its own clock. */
function rider(kind = gunCarrierKinds.motorcycle) {
  const clock = new GameClock()
  const target = new Body({ x: 30, y: 1, size: { length: 7, height: 3, width: 3 }, states: { idle: {}, dead: {} } })
  const body = new GunCarrier({ kind, x: 50, y: 1, yaw: Math.PI, clock, targets: [target] })
  const live = seconds => {
    for (let i = 0; i < seconds * 60; i++) {
      clock.advance(1 / 60)
      body.update(1 / 60)
    }
  }
  return { body, target, live }
}

for (const [id, kind] of Object.entries(gunCarrierKinds))
  test(`a ${id} drives the way it faces and, set to fire, fires bursts ahead while it drives`, () => {
    const { body, target, live } = rider(kind)
    body.setState('move')
    live(1)
    assert.ok(Math.abs(body.x - (50 - kind.speed)) < 1e-9)
    assert.equal(body.aimAt({ x: body.x + 10, y: 1 }), false, 'not behind it')
    assert.equal(body.aimAt(target), true)
    body.setState('attack')
    live(kind.gun.firstShot + kind.gun.reload * kind.gun.burst + .1)
    assert.equal(body.shotsFired, kind.gun.burst, 'one burst, then a rest')
    assert.ok(body.x < 50 - kind.speed, 'it drives on while it fires')
    live(1)
    assert.equal(target.health.maximum - target.health.current, kind.gun.damage * target.hitsTaken)
    assert.ok(target.hitsTaken > 0)
  })

test('a wrecked carrier stops, fires no more and stays wrecked', () => {
  const { body, target, live } = rider()
  const { motorcycle } = gunCarrierKinds
  body.aimAt(target)
  body.setState('attack')
  body.takeHit(motorcycle.health)
  body.setState('attack')
  assert.equal(body.state, 'dead')
  live(3)
  assert.equal(body.shotsFired, 0)
  assert.equal(body.vx, 0)
})
