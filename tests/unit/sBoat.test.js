import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let SBoat, sBoat

before(async() => {
  createPageElements()
  ;({ default: SBoat, sBoat } = await import('/scenes/camac/SBoat.js'))
})

/** An S-boat alone, with no controller, launched and placed in the view. */
function boat(t) {
  const session = new GameSession()
  t.after(() => session.dispose())
  session.start()
  const block = new SBoat({ session, viewLeft: () => 0 })
  block.launch(1)
  block.setPosition(600, 300)
  return { session, block }
}

const shots = block => block.bullets.projectiles.filter(p => p.visible).length

test('a launched S-boat lies still with its guns trained ahead until it is set to', t => {
  const { session, block } = boat(t)
  assert.deepEqual(block.states, ['idle', 'sail', 'fire', 'withdraw', 'dead'])
  assert.equal(block.state, 'idle')
  session.update(5)
  block.update(.1)
  assert.equal(block.speed, 0)
  assert.equal(block.gunAngle, Math.PI)
  assert.equal(shots(block), 0)
})

test('an S-boat sails on its course and withdraws at full speed', t => {
  const { block } = boat(t)
  block.course = Math.PI
  block.setState('sail')
  block.update(.1)
  assert.equal(block.speed, sBoat.cruise)
  assert.ok(block.x < 600)
  block.setState('withdraw')
  block.update(.1)
  assert.equal(block.speed, sBoat.full)
  assert.ok(block.angle < Math.PI, 'it turns back')
})

test('the guns follow their aim in any state but fire only in fire, within reach, in bursts', t => {
  const { session, block } = boat(t)
  assert.equal(block.aimAt({ x: 300, y: 400 }), true)
  assert.equal(block.aimAt({ x: 590, y: 300 }), false, 'too near')
  block.aimAt({ x: 300, y: 400 })
  session.update(5)
  block.update(.1)
  assert.ok(block.gunAngle < Math.PI, 'the guns turn towards the aim')
  assert.equal(shots(block), 0)
  block.setState('fire')
  for (let i = 0; i < 60; i++) {
    session.update(.1)
    block.update(.1)
  }
  assert.equal(shots(block) % sBoat.burst, 0)
  assert.ok(block.bursts >= 1)
})

test('a sinking S-boat holds fire and a new pass lies still again', t => {
  const { session, block } = boat(t)
  block.aimAt({ x: 300, y: 300 })
  block.setState('dead')
  assert.equal(block.dead, true)
  block.setState('fire')
  session.update(5)
  block.update(.1)
  assert.equal(shots(block), 0)
  block.launch(-1)
  assert.equal(block.state, 'idle')
  assert.equal(block.alive, true)
})
