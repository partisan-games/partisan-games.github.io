import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BoxGeometry, Mesh } from 'three'
import wallBlocker from '/core3d/actor/characters/wallBlocker.js'

// The near face of the wall is at x = 2. The demon is 2 m wide and .6 m deep.
const wall = new Mesh(new BoxGeometry(.2, 8, 12))
wall.position.set(2.1, 4, 0)
const resolve = wallBlocker(wall, { widthScale: .97 })
const step = (x, z, yaw, fromX, fromZ) => resolve({ size: { width: 2, length: .6 }, x, z, y: 3, yaw }, fromX, fromZ)
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .001, `expected ${expected}, got ${actual}`)

test('approach stops at body depth head-on and lets the last 3 cm of a wing through sideways', () => {
  near(step(3, 0, 0, 0, 0).x, 1.7)
  near(step(3, 0, Math.PI / 2, 0, 0).x, 1.03)
})

test('a diagonal step slides along the wall, then the demon can step away', () => {
  const { x, z } = step(1.3, 1, Math.PI / 2, 1, 0)
  near(x, 1.03)
  near(z, 1)
  near(step(.8, 1, Math.PI / 2, x, z).x, .8)
})

test('turning the wings toward the wall resolves contact even when standing still', () => {
  near(step(1.2, 0, 0, 1.2, 0).x, 1.2)
  near(step(1.2, 0, Math.PI / 2, 1.2, 0).x, 1.03)
})
