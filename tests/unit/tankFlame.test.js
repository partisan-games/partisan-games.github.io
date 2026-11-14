import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let AttachedFlame, Plamen

before(async() => {
  createPageElements()
  AttachedFlame = (await import('/scenes/2d-tank/AttachedFlame.js')).default
  Plamen = (await import('/core/actor/Plamen.js')).default
})

test('a stationary attached flame preserves the original Tenkići particles, spread and lifetime', t => {
  t.mock.method(Math, 'random', () => .75)
  const original = new Plamen(400, 300)
  const attached = new AttachedFlame(400, 300)
  for (const dt of [.05, .1, .2, .3, .4, .5]) {
    original.update(dt)
    attached.update(dt)
    assert.deepEqual(attached.iskre, original.iskre)
  }
  assert.ok(attached.iskre.some(p => p.dx !== 0 && p.x !== attached.x), 'natural lateral spread must survive')
  assert.equal(AttachedFlame.prototype.render, Plamen.prototype.render, 'colors, size and blending use the original renderer')
})

test('scroll and recoil translate old particles without altering their motion or shifting new ones twice', t => {
  t.mock.method(Math, 'random', () => .75)
  const original = new Plamen(400, 300)
  const attached = new AttachedFlame(400, 300)
  for (const [shiftX, shiftY] of [[0, 0], [-16, 0], [-20, -3], [30, 4]]) {
    attached.x += shiftX
    attached.y += shiftY
    original.update(.1)
    attached.update(.1)
    assert.equal(attached.iskre.length, original.iskre.length)
    for (const [index, particle] of attached.iskre.entries()) {
      const reference = original.iskre[index]
      assert.ok(Math.abs(particle.x - attached.x - (reference.x - original.x)) < 1e-8)
      assert.ok(Math.abs(particle.y - attached.y - (reference.y - original.y)) < 1e-8)
      assert.equal(particle.dx, reference.dx)
      assert.equal(particle.dy, reference.dy)
      assert.equal(particle.vreme, reference.vreme)
    }
  }
})
