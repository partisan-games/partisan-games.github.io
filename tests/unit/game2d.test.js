import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let GameObject2D

before(async() => {
  createPageElements()
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

test('a moving shot hits its target once and scores one point', () => {
  const target = new GameObject2D(null, { width: 50, height: 50, x: 500, y: 100 })
  const shot = new GameObject2D(null, { width: 6, height: 6, x: 100, y: 100, speed: 600 })
  let score = 0

  for (let i = 0; i < 120; i++) {
    shot.update(1 / 60)
    if (target.alive && shot.collidesWith(target)) {
      target.die()
      score++
    }
  }

  assert.equal(target.dead, true)
  assert.equal(score, 1)
})

