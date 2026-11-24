import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Box3 } from 'three'
import { createRockPile } from '/core3d/geometry/rocks.js'

test('a rock pile lies on the ground, about as wide and high as asked, so it covers that high', () => {
  let seed = 1
  const random = () => {
    seed = seed * 16807 % 2147483647
    return seed / 2147483647
  }
  const pile = createRockPile({ width: 2.5, height: 1.2, random })
  pile.updateMatrixWorld(true)
  const box = new Box3().setFromObject(pile)
  assert.ok(Math.abs(box.min.y) < 1e-9, `${box.min.y}`)
  assert.ok(box.max.y > .9 && box.max.y <= 1.2 * 1.3, `${box.max.y}`)
  assert.ok(box.max.x - box.min.x > 1.2 && box.max.x - box.min.x < 4, `${box.max.x - box.min.x}`)
})
