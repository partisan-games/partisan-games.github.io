import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let MachineGunner, machineGun, GameSession, GameObject2D

before(async() => {
  createPageElements()
  ;({ default: MachineGunner, machineGun } = await import('/core/actor/soldiers/MachineGunner.js'))
  GameSession = (await import('/core/runtime/GameSession.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

/** A machine gunner alone with what his rounds may hit, on a running session. */
function gunnerAlone(t) {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const target = new GameObject2D(null, { x: 500, y: 300 })
  const gunner = new MachineGunner({ x: 100, y: 100, targets: [target], session })
  const step = seconds => {
    session.update(seconds)
    gunner.update(0)
  }
  return { session, gunner, target, step }
}

test('a machine gunner has the states idle, fire and dead, and starts holding fire', t => {
  const { gunner, step } = gunnerAlone(t)
  assert.deepEqual(gunner.states, ['idle', 'fire', 'dead'])
  assert.equal(gunner.state, 'idle')
  step(10)
  assert.equal(gunner.bullets.projectiles.length, 0)
})

test('a defeated gunner finishes his collapse once and holds it without firing', t => {
  const { gunner, step } = gunnerAlone(t)
  gunner.setState('dead')
  gunner.update(.15)
  assert.equal(gunner.deathElapsed, .15)
  gunner.update(0)
  assert.equal(gunner.deathElapsed, .15)
  gunner.update(10)
  assert.equal(gunner.deathElapsed, .6)
  gunner.die()
  assert.equal(gunner.deathElapsed, .6)
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

test('the shot starts at the rotated artwork muzzle and the recoil waits when time stops', t => {
  const { session, gunner, step } = gunnerAlone(t)
  assert.deepEqual(gunner.muzzle, { x: 38, y: 88 })
  gunner.aimAt({ x: 100, y: 0 })
  assert.ok(Math.abs(gunner.muzzle.x - 112) < 1e-9)
  assert.ok(Math.abs(gunner.muzzle.y - 38) < 1e-9)
  gunner.setState('fire')
  step(machineGun.pause)
  const [round] = gunner.bullets.projectiles
  assert.equal(round.x, gunner.muzzle.x)
  assert.equal(round.y, gunner.muzzle.y)
  assert.equal(gunner.fireFrame, 0)
  session.update(.026)
  gunner.update(.026)
  assert.equal(gunner.fireFrame, 1)
  gunner.update(0)
  assert.equal(gunner.fireFrame, 1)
  assert.deepEqual([gunner.width, gunner.height], [63, 27])
})

test('a gunner set back is alive at his gun, holding fire, with his rounds out of play and a fresh wait', t => {
  const { gunner, target, step } = gunnerAlone(t)
  gunner.aimAt(target)
  gunner.setState('fire')
  step(3.01)
  gunner.die()
  gunner.reset()
  assert.equal(gunner.alive, true)
  assert.equal(gunner.state, 'idle')
  assert.ok(gunner.bullets.projectiles.every(round => !round.visible))
  gunner.setState('fire')
  step(.5)
  assert.ok(gunner.bullets.projectiles.every(round => !round.visible), 'he waits again before his burst')
})

test('a scaled gunner is drawn smaller and fires from his scaled muzzle', t => {
  const { session } = gunnerAlone(t)
  const full = new MachineGunner({ x: 100, y: 100, session })
  const small = new MachineGunner({ x: 100, y: 100, session, scale: .5 })
  assert.deepEqual([small.width, small.height], [full.width / 2, full.height / 2])
  assert.deepEqual([small.muzzle.x - 100, small.muzzle.y - 100], [(full.muzzle.x - 100) / 2, (full.muzzle.y - 100) / 2])
})
