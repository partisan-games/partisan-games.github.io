import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'

let BattleFeedback

before(async() => {
  createPageElements()
  BattleFeedback = (await import('/scenes/to-trieste/BattleFeedback.js')).default
})

test('feedback is bounded, expires on its clock, and observes damage and death once', () => {
  const clock = new GameClock()
  const unit = { alive: true, get dead() {
    return !this.alive
  }, energija: 100,
  x: 200, y: 100, width: 100, height: 40, dx: -160, shown: true,
  granate: {}, children: [], lifeId: 1 }
  const feedback = new BattleFeedback({ units: [unit], clock, scrollSpeed: -160 })
  for (let i = 0; i < 100; i++) unit.granate.onFire({ position: { x: 240, y: 90 }, angle: 0, projectile: { gravity: 90 } })
  assert.ok(feedback.effects.length <= 40)
  feedback.update()
  assert.ok(feedback.effects.length > 0, 'without clock advancement effects do not expire')
  clock.advance(1)
  feedback.update()
  assert.equal(feedback.effects.length, 0)
  unit.energija = 80
  feedback.update()
  assert.equal(feedback.effects.filter(e => e.kind === 'impact').length, 1)
  feedback.update()
  assert.equal(feedback.effects.filter(e => e.kind === 'impact').length, 1)
  unit.alive = false
  feedback.update()
  feedback.update()
  assert.equal(feedback.effects.filter(e => e.kind === 'destruction').length, 1)
  clock.advance(1)
  feedback.update()
  assert.equal(feedback.effects.length, 0)
})
