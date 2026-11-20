import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Boss

before(async() => {
  createPageElements()
  ;({ default: Boss } = await import('/scenes/vis/Boss.js'))
})

function createBoss(t) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  return new Boss({ session })
}

test('the boss keeps its nose down whichever way it flies', t => {
  const plane = createBoss(t)
  assert.equal(plane.angle, Math.PI)
  plane.face(0)
  assert.equal(plane.angle, Math.PI)
})

test('the boss fires from its nose and its wings in turn, and tells how many of its hits are left', t => {
  const plane = createBoss(t)
  plane.x = 500
  plane.width = 100
  assert.deepEqual([0, 1, 2, 3].map(() => plane.nextGun().x), [500, 465, 535, 500])
  plane.damage(plane.maxHits / 4)
  assert.equal(plane.hitsLeft, .75)
})
