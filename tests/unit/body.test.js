import { test } from 'node:test'
import assert from 'node:assert/strict'
import Body from '/core/gameplay/bodies/Body.js'

test('a body moves by its velocity in metres a second, the same in any frame rate', () => {
  const coarse = new Body(), fine = new Body()
  for (const body of [coarse, fine]) body.vx = 2
  coarse.update(1)
  for (let i = 0; i < 60; i++) fine.update(1 / 60)
  assert.equal(coarse.x, 2)
  assert.ok(Math.abs(fine.x - 2) < 1e-9)
})

test('a body plays its state while alive and counts the time in it from each change', () => {
  const played = []
  const body = new Body({ states: { idle: {}, drive: { update: (owner, dt) => played.push(dt) } } })
  body.update(.5)
  body.setState('drive')
  body.update(.25)
  assert.equal(body.stateTime, .25)
  assert.deepEqual(played, [.25])
  body.setState('drive')
  assert.equal(body.stateTime, .25, 'setting the same state keeps its time')
})

test('a killing hit enters the dead state once, and a dead body takes no more hits', () => {
  const body = new Body({ health: 30, states: { idle: {}, dead: {} } })
  assert.equal(body.takeHit(10), false)
  assert.equal(body.takeHit(25), true)
  assert.equal(body.state, 'dead')
  assert.equal(body.takeHit(10), false)
  assert.equal(body.hitsTaken, 2)
})

test('the point ahead follows yaw about +y and pitch above level', () => {
  const body = new Body({ x: 1, yaw: Math.PI, pitch: 0 })
  const point = body.ahead(2, .5)
  assert.ok(Math.abs(point.x + 1) < 1e-9 && point.y === .5 && Math.abs(point.z) < 1e-9)
})
