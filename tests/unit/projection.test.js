import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sideProjection, topProjection } from '/core/actor/projection.js'

const near = (a, b) => Math.abs(a - b) < 1e-9

test('the side view puts metres up from the ground line, and back', () => {
  const side = sideProjection({ pxPerMeter: 20, groundY: 400 })
  assert.deepEqual(side.point({ x: 3, y: 2, z: 9 }), { x: 60, y: 360 })
  assert.deepEqual(side.toWorld({ x: 60, y: 360 }), { x: 3, y: 2, z: 0 })
  assert.equal(side.length(1.5), 30)
  assert.ok(near(side.angle(0, Math.PI / 4), -Math.PI / 4), 'raised to the right points up the screen')
  assert.ok(near(Math.abs(side.angle(Math.PI, 0)), Math.PI))
  assert.equal(side.mirrored({ yaw: Math.PI }), true)
})

test('the top view puts depth down the screen and turns by yaw', () => {
  const top = topProjection({ pxPerMeter: 10 })
  assert.deepEqual(top.point({ x: 1, y: 50, z: 2 }), { x: 10, y: 20 })
  assert.equal(top.angle(Math.PI / 2), -Math.PI / 2)
})
