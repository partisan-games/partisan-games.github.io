import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let AttachedFlame, Flame

before(async() => {
  createPageElements()
  AttachedFlame = (await import('/scenes/to-trieste/AttachedFlame.js')).default
  Flame = (await import('/core/actor/Flame.js')).default
})

test('a stationary attached flame preserves the original Tenkići particles, spread and lifetime', t => {
  t.mock.method(Math, 'random', () => .75)
  const original = new Flame(400, 300)
  const attached = new AttachedFlame(400, 300)
  for (const dt of [.05, .1, .2, .3, .4, .5]) {
    original.update(dt)
    attached.update(dt)
    assert.deepEqual(attached.sparks, original.sparks)
  }
  assert.ok(attached.sparks.some(p => p.dx !== 0 && p.x !== attached.x), 'natural lateral spread must survive')
  assert.equal(AttachedFlame.prototype.render, Flame.prototype.render, 'colors, size and blending use the original renderer')
})

test('scroll and recoil translate old particles without altering their motion or shifting new ones twice', t => {
  t.mock.method(Math, 'random', () => .75)
  const original = new Flame(400, 300)
  const attached = new AttachedFlame(400, 300)
  for (const [shiftX, shiftY] of [[0, 0], [-16, 0], [-20, -3], [30, 4]]) {
    attached.x += shiftX
    attached.y += shiftY
    original.update(.1)
    attached.update(.1)
    assert.equal(attached.sparks.length, original.sparks.length)
    for (const [index, particle] of attached.sparks.entries()) {
      const reference = original.sparks[index]
      assert.ok(Math.abs(particle.x - attached.x - (reference.x - original.x)) < 1e-8)
      assert.ok(Math.abs(particle.y - attached.y - (reference.y - original.y)) < 1e-8)
      assert.equal(particle.dx, reference.dx)
      assert.equal(particle.dy, reference.dy)
      assert.equal(particle.vreme, reference.vreme)
    }
  }
})

test('attached flames retain their active array and reuse expired particles after clearing', t => {
  t.mock.method(Math, 'random', () => .75)
  const flame = new AttachedFlame(400, 300)
  const active = flame.sparks
  flame.update(.1)
  const firstGeneration = new Set(active)
  flame.update(1.25)
  assert.equal(flame.sparks, active)
  assert.equal(active.length, 0)
  assert.ok([...firstGeneration].every(p => flame.freeParticles.includes(p)))
  flame.update(.1)
  const reused = [...active]
  flame.clear()
  flame.update(.1)
  assert.equal(flame.sparks, active)
  assert.ok(active.every(p => reused.includes(p)), 'cleared particles return to the pool')
  assert.ok(active.every(p => p.vreme === .1), 'reused particles start a fresh lifetime')
})
