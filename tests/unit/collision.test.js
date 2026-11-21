import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

import { box, circle, fromImage, placeShape } from '/core/collision/shapes.js'
import { sweepCircle } from '/core/collision/sweep.js'

let GameObject2D

before(async() => {
  createPageElements()
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

function object(x, y, width, height, { angle = 0, ...options } = {}) {
  const shape = new GameObject2D(null, { x, y, width, height, ...options })
  shape.angle = angle
  return shape
}

test('objects without shapes keep colliding as unturned rectangles that must overlap, not just touch', () => {
  const a = object(0, 0, 10, 10)
  assert.equal(a.collidesWith(object(9, 0, 10, 10)), true)
  assert.equal(a.collidesWith(object(10, 0, 10, 10)), false)
  // An angle does not turn the old rectangle.
  assert.equal(a.collidesWith(object(12, 0, 20, 2, { angle: Math.PI / 2 })), true)
  assert.equal(a.collidesWith(object(9, 0, 10, 10, { visible: false })), false)
})

test('a shape follows its body as the renderer draws it: offset, angle, scale and the swapped flip names', () => {
  const body = { x: 100, y: 50, angle: Math.PI / 2, flipX: 1, flipY: 1, scaleX: 2, scaleY: 2 }
  const placed = placeShape(box(10, 0, 8, 2, .1), body)
  assert.ok(Math.abs(placed.x - 100) < 1e-9 && Math.abs(placed.y - 70) < 1e-9)
  assert.deepEqual([placed.halfWidth, placed.halfHeight, placed.angle], [8, 2, Math.PI / 2 + .1])

  // flipY mirrors left and right, as Renderer2D scales by (flipY, flipX).
  const mirrored = placeShape(box(10, 4, 8, 2, .1), { x: 0, y: 0, flipY: -1 })
  assert.deepEqual([mirrored.x, mirrored.y, mirrored.angle], [-10, 4, -.1])
  const upsideDown = placeShape(circle(10, 4, 3), { x: 0, y: 0, flipX: -1 })
  assert.deepEqual([upsideDown.x, upsideDown.y, upsideDown.r], [10, -4, 3])
})

test('shapes measured on an image move to the centre of the drawn object and take its scale', () => {
  const [wheel, trail] = fromImage({ width: 400, height: 100 }, .5, [circle(300, 50, 20), box(100, 80, 60, 10, .2)])
  assert.deepEqual(wheel, circle(50, 0, 10))
  assert.deepEqual(trail, { ...box(-50, 15, 30, 5), angle: .2 })
})

const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`)

test('a fast round shot touches the near side of a box it crosses within one step, at its own radius', () => {
  const wall = box(100, 0, 10, 40)
  approx(sweepCircle({ x: 0, y: 0 }, { x: 1000, y: 0 }, 5, wall), .09)
  approx(sweepCircle({ x: 0, y: 0 }, { x: 1000, y: 0 }, 0, wall), .095)
})

test('a shot passing a corner misses, though a box widened by its radius would count it', () => {
  const block = box(0, 0, 20, 20)
  assert.equal(sweepCircle({ x: -50, y: -78 }, { x: 50, y: 22 }, 5, block), null)
  assert.ok(sweepCircle({ x: -50, y: -76 }, { x: 50, y: 24 }, 5, block) !== null)
  // running along an edge without entering is no contact either
  assert.equal(sweepCircle({ x: -50, y: -15 }, { x: 50, y: -15 }, 5, block), null)
})

test('a contact at the start and a still shot are answered, and a circle is swept as well as a turned box', () => {
  const block = box(0, 0, 20, 20)
  assert.equal(sweepCircle({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, block), 0)
  assert.equal(sweepCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, 0, block), 0)
  assert.equal(sweepCircle({ x: 50, y: 5 }, { x: 50, y: 5 }, 5, block), null)
  approx(sweepCircle({ x: -100, y: 0 }, { x: 0, y: 0 }, 0, circle(0, 0, 10)), .9)
  approx(sweepCircle({ x: -100, y: 10 }, { x: 100, y: 10 }, 0, box(0, 0, 40, 4, Math.PI / 2)), .49)
})
