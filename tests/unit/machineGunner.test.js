import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Mitraljezac, machineGun, GameSession, GameObject2D

before(async() => {
  createPageElements()
  ;({ default: Mitraljezac, machineGun } = await import('/scenes/bunker/Mitraljezac.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

/** A machine gunner alone with what his rounds may hit, on a running session. */
function gunnerAlone(t) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const target = new GameObject2D(null, { x: 500, y: 300 })
  const gunner = new Mitraljezac({ x: 100, y: 100, targets: [target], session })
  const step = seconds => {
    session.update(seconds)
    gunner.update(0)
  }
  return { session, gunner, target, step }
}

test('a machine gunner has the states idle and fire, and starts holding fire', t => {
  const { gunner, step } = gunnerAlone(t)
  assert.deepEqual(gunner.states, ['idle', 'fire'])
  assert.equal(gunner.state, 'idle')
  step(10)
  assert.equal(gunner.bullets.projectiles.length, 0)
})

test('a machine gunner turns his gun to the point he aims at, and fires there', t => {
  const { gunner, target, step } = gunnerAlone(t)
  assert.equal(gunner.forward, -1, 'the picture points the gun left')
  assert.equal(gunner.aimAt(target), true)
  assert.ok(Math.abs(gunner.angle - gunner.angleTo(target) - Math.PI) < 1e-9)
  assert.equal(gunner.forward, 1)
  gunner.setState('fire')
  step(machineGun.pause)
  const [round] = gunner.bullets.projectiles
  assert.ok(Math.abs(round.angle - gunner.angleTo(target)) < 1e-9)
})

test('the bunker gun fires five rounds after its wait, then waits for the next burst', t => {
  const { session, gunner, target, step } = gunnerAlone(t)
  gunner.aimAt(target)
  gunner.setState('fire')
  step(2.9)
  assert.equal(gunner.bullets.projectiles.length, 0)
  step(.11)
  for (let i = 0; i < 4; i++) step(.101)
  assert.equal(gunner.bullets.projectiles.length, 5)
  step(2.9)
  assert.equal(gunner.bullets.projectiles.length, 5)
  step(.11)
  assert.equal(gunner.bullets.projectiles.length, 6)
  session.finish()
  step(100)
  assert.equal(gunner.bullets.projectiles.length, 6)
})
