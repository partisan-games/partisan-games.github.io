import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

import { box, circle, fromImage, placeShape } from '/core/collision/shapes.js'
import { shapesOverlap } from '/core/collision/overlap.js'
import Collider from '/core/collision/Collider.js'
import { firstContact } from '/core/collision/sweep.js'

let GameObject2D, Projectile, firstHit, BoatCombat

before(async() => {
  createPageElements()
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
  Projectile = (await import('/core/actor/projectiles/Projectile.js')).default
  ;({ firstHit } = await import('/scenes/to-trieste/lineOfFire.js'))
  BoatCombat = (await import('/scenes/camac/BoatCombat.js')).default
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

test('the line of fire in Trieste counts a shot that touches an edge and pads the target by the shot size', () => {
  const target = object(100, 100, 20, 20)
  assert.equal(firstHit({ x: 0, y: 90 }, { x: 200, y: 90 }, [target])?.time, .45)
  assert.equal(firstHit({ x: 0, y: 89 }, { x: 200, y: 89 }, [target]), null)
  assert.equal(firstHit({ x: 0, y: 89 }, { x: 200, y: 89 }, [target], { x: 0, y: 2 })?.time, .45)
  assert.equal(firstHit({ x: 100, y: 100 }, { x: 100, y: 100 }, [target])?.time, 0)
})

/** A boat that BoatCombat can hit, and a bullet that has just flown from start to end. */
function boatDuel({ boat = {}, shot = {} } = {}) {
  const hits = []
  const target = {
    x: 300, y: 100, width: 100, height: 20, angle: 0, alive: true, visible: true, lifeId: 1, ...boat,
    get dead() {
      return !this.alive
    },
    takeHit: (damage, lifeId) => (hits.push({ damage, lifeId }), true),
  }
  const bullet = {
    visible: true, width: 10, height: 2, angle: 0, damage: 10, offScreen: false,
    path: { start: { x: 0, y: 100 }, end: { x: 600, y: 100 } }, ...shot,
    setPosition(x, y) {
      this.x = x; this.y = y
    },
    reset() {
      this.visible = false
    },
  }
  const shooter = { x: 0, y: 0, alive: true, visible: true, bullets: { projectiles: [bullet] }, get dead() {
    return false
  } }
  const combat = new BoatCombat({ state: 'running' })
  combat.add(shooter, 'partisan')
  combat.add(target, 'axis')
  return { combat, target, bullet, hits }
}

test('Čamac stops a bullet that crosses a whole boat within one frame at the boat\'s near side', () => {
  const { combat, target, bullet, hits } = boatDuel()
  combat.beginFrame()
  combat.resolve()
  assert.deepEqual(hits, [{ damage: 10, lifeId: 1 }])
  assert.ok(Math.abs(bullet.x - (target.x - target.width / 2 - bullet.width / 2)) < 1e-9)
  assert.equal(bullet.visible, false)
})

test('Čamac checks a turned boat in its own frame and follows its movement during the frame', () => {
  const turned = boatDuel({ boat: { angle: Math.PI / 2 }, shot: { path: { start: { x: 300, y: 0 }, end: { x: 300, y: 50 } } } })
  turned.combat.beginFrame()
  turned.combat.resolve()
  assert.equal(turned.hits.length, 1)

  // The bullet ends where the boat was, but the boat has already left.
  const moving = boatDuel({ shot: { path: { start: { x: 340, y: 60 }, end: { x: 340, y: 100 } } } })
  moving.combat.beginFrame()
  moving.target.x = 500
  moving.combat.resolve()
  assert.equal(moving.hits.length, 0)
})

test('circles, turned boxes and their mixes overlap in either order, but not when they only touch', () => {
  const pairs = [
    [circle(0, 0, 5), circle(9, 0, 5), true],
    [circle(0, 0, 5), circle(10, 0, 5), false],
    [circle(0, 0, 5), box(14, 0, 20, 4), true],
    [circle(0, 0, 5), box(15, 0, 20, 4), false],
    // Near a corner only the distance to the corner counts, not the bounding rectangles.
    [circle(0, 0, 5), box(9, 9, 10, 10), false],
    [circle(0, 0, 5), box(8, 8, 10, 10), true],
    [box(0, 0, 20, 2), box(14, 0, 10, 10), true],
    [box(0, 0, 20, 2), box(15, 0, 10, 10), false],
    [box(0, 0, 20, 2), box(0, 8, 20, 2, Math.PI / 2), true],
    [box(0, 0, 20, 2), box(0, 12, 20, 2, Math.PI / 2), false],
    [box(0, 0, 20, 2, Math.PI / 4), box(8, -8, 4, 4), false],
    [box(0, 0, 20, 2, Math.PI / 4), box(6, 6, 4, 4), true],
  ]
  for (const [a, b, expected] of pairs) {
    assert.equal(shapesOverlap(a, b), expected, `${JSON.stringify(a)} and ${JSON.stringify(b)}`)
    assert.equal(shapesOverlap(b, a), expected)
  }
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

test('an object with a collider is hit only on its parts, including a part drawn by another body', () => {
  const barrel = object(0, 0, 100, 20)
  const carriage = object(-30, 40, 60, 20)
  barrel.collider = new Collider([
    { body: barrel, shapes: [box(20, 0, 60, 6)] },
    { body: carriage, shapes: [circle(20, 0, 10)] },
  ])
  const shot = (x, y) => object(x, y, 4, 4)
  assert.equal(barrel.collidesWith(shot(40, 0)), true)
  assert.equal(shot(40, 0).collidesWith(barrel), true)
  assert.equal(barrel.collidesWith(shot(-40, 0)), false, 'a transparent edge of the old rectangle is not a target')
  assert.equal(barrel.collidesWith(shot(-10, 40)), true, 'the wheel on the carriage')
  assert.equal(barrel.collidesWith(shot(-10, 25)), false, 'the gap between the parts')

  barrel.angle = Math.PI / 2
  assert.equal(barrel.collidesWith(shot(40, 0)), false)
  assert.equal(barrel.collidesWith(shot(0, 40)), true)

  carriage.hide()
  assert.equal(barrel.collidesWith(shot(-10, 40)), false, 'a hidden part is not a target')
  barrel.hide()
  assert.equal(barrel.collidesWith(shot(0, 40)), false)
})

const approx = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`)

test('a fast round shot hits the near side of a target it crosses within one step, at its own radius', () => {
  const wall = object(100, 0, 10, 40)
  const hit = firstContact({ start: { x: 0, y: 0 }, end: { x: 1000, y: 0 }, radius: 5 }, [wall])
  assert.equal(hit.target, wall)
  approx(hit.time, .09)
  approx(hit.point.x, 90)
  assert.equal(firstContact({ start: { x: 0, y: 0 }, end: { x: 1000, y: 0 } }, [wall]).point.x, 95)
})

test('a shot passing a corner misses, though a rectangle widened by its radius would count it', () => {
  const block = object(0, 0, 20, 20)
  const pastCorner = { start: { x: -50, y: -78 }, end: { x: 50, y: 22 }, radius: 5 }
  assert.equal(firstContact(pastCorner, [block]), null)
  assert.ok(firstContact({ ...pastCorner, start: { x: -50, y: -76 }, end: { x: 50, y: 24 } }, [block]))
  // Running along an edge without entering is no contact either.
  assert.equal(firstContact({ start: { x: -50, y: -15 }, end: { x: 50, y: -15 }, radius: 5 }, [block]), null)
})

test('a contact at the start, a still shot and a way out of the screen are all answered', () => {
  const block = object(0, 0, 20, 20)
  assert.equal(firstContact({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }, [block]).time, 0)
  assert.equal(firstContact({ start: { x: 5, y: 5 }, end: { x: 5, y: 5 } }, [block]).time, 0)
  assert.equal(firstContact({ start: { x: 50, y: 5 }, end: { x: 50, y: 5 }, radius: 5 }, [block]), null)
  approx(firstContact({ start: { x: -100, y: 0 }, end: { x: 5000, y: 0 } }, [block]).point.x, -10)
})

test('the earliest of several targets wins whatever their order, and a tie goes to the earlier one', () => {
  const near = object(100, 0, 10, 10)
  const far = object(200, 0, 10, 10)
  const twin = object(100, 0, 10, 10)
  const way = { start: { x: 0, y: 0 }, end: { x: 300, y: 0 } }
  assert.equal(firstContact(way, [far, near]).target, near)
  assert.equal(firstContact(way, [near, far]).target, near)
  assert.equal(firstContact(way, [twin, near]).target, twin)
  assert.equal(firstContact(way, [near, twin]).target, near)
})

test('a sweep follows a part that moved during the step and leaves out a hidden one', () => {
  const tank = object(100, 0, 40, 20)
  tank.collider = new Collider([{ body: tank, shapes: [circle(0, 0, 10)] }])
  tank.collider.beginStep()
  tank.x = 300
  // The shot ends where the tank was, after it left.
  assert.equal(firstContact({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } }, [tank]), null)
  assert.ok(firstContact({ start: { x: 0, y: 0 }, end: { x: 300, y: 0 } }, [tank]))
  tank.hide()
  assert.equal(firstContact({ start: { x: 0, y: 0 }, end: { x: 300, y: 0 } }, [tank]), null)
})

test('an arc is checked step by step, and a projectile keeps only the way of its current flight', () => {
  const shot = new Projectile({ src: null, gravity: 98 })
  const target = object(141, 88, 6, 6)
  shot.launch({ x: 0, y: 140 }, -Math.PI / 4, 150)
  let hit = null
  for (let step = 0; step < 60 && !hit; step++) {
    shot.update(1 / 30)
    hit = shot.path && firstContact({ ...shot.path, radius: 2 }, [target])
  }
  assert.equal(hit?.target, target)

  shot.reset()
  assert.equal(shot.path, null)
  shot.launch({ x: 0, y: 0 }, 0, 300)
  shot.update(1 / 30)
  assert.deepEqual(shot.path.start, { x: 0, y: 0 })
})
