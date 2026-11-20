import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let ShoreMachineGun, nest

before(async() => {
  createPageElements()
  ;({ default: ShoreMachineGun, nest } = await import('/scenes/camac/ShoreMachineGun.js'))
})

/** A nest alone, with no controller, on the upper shore: the water is below it. */
function gun(t) {
  const session = new GameSession()
  t.after(() => session.dispose())
  session.start()
  const block = new ShoreMachineGun({ session, viewLeft: () => 0 })
  block.deploy(400, 40, -1)
  return { session, block }
}

const shots = block => block.bullets.projectiles.filter(p => p.visible).length

test('a nest stands idle with its gun out over the water until it is set to fire', t => {
  const { session, block } = gun(t)
  assert.deepEqual(block.states, ['idle', 'fire', 'dead'])
  assert.equal(block.state, 'idle')
  block.aimAt({ x: 300, y: 300 })
  session.update(5)
  block.update(.1)
  assert.equal(block.gunAngle, Math.PI / 2)
  assert.equal(shots(block), 0)
})

test('the nest aims only out over the water, as far as its gun swings', t => {
  const { block } = gun(t)
  assert.equal(block.aimAt({ x: 400, y: 10 }), false, 'the landward side')
  assert.equal(block.aimAt({ x: 0, y: 60 }), true)
  assert.ok(Math.abs(block.bearing - (Math.PI / 2 + nest.swing)) < 1e-12)
})

test('opening fire swings the gun to its aim and fires at once, in bursts', t => {
  const { session, block } = gun(t)
  block.setState('fire')
  block.update(0)
  assert.equal(shots(block), 0, 'with nowhere to aim it holds fire')
  block.aimAt({ x: 500, y: 300 })
  block.update(0)
  assert.equal(block.gunAngle, block.bearing)
  assert.equal(shots(block), 1)
  for (let i = 0; i < 10; i++) {
    session.update(.15)
    block.update(0)
  }
  assert.equal(shots(block), nest.burst)
})

test('a destroyed nest holds fire and a new life stands idle again', t => {
  const { session, block } = gun(t)
  block.aimAt({ x: 500, y: 300 })
  block.setState('dead')
  assert.equal(block.dead, true)
  block.setState('fire')
  session.update(5)
  block.update(.1)
  assert.equal(shots(block), 0)
  block.deploy(600, 40, -1)
  assert.equal(block.state, 'idle')
  assert.equal(block.alive, true)
})
