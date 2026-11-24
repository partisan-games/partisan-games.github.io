import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3 } from 'three'
import { createStoneWall, stoneWall } from '/core3d/geometry/stoneWall.js'

test('a stone wall stands on the ground about as high as asked, its stones the same size on any length', () => {
  const short = createStoneWall({ length: 4 }), long = createStoneWall({ length: 20 })
  const box = new Box3().setFromObject(long)
  assert.ok(Math.abs(box.min.y) < 1e-6)
  assert.ok(Math.abs(box.max.y - 1.1) <= stoneWall.wear + 1e-6, `${box.max.y}`)
  assert.ok(Math.abs(box.max.x - box.min.x - 20) < 1e-5)
  const span = wall => {
    const { uv } = wall.geometry.attributes
    let most = 0
    for (let i = 0; i < uv.count; i++) most = Math.max(most, uv.getX(i))
    return most
  }
  assert.ok(Math.abs(span(long) / span(short) - 5) < .01, 'five times as long shows five times the stones')
})
