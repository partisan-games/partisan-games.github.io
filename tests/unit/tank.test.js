import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let TenkLevo, TenkDesno, GameClock, GameObject2D

before(async() => {
  createPageElements()
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  TenkDesno = (await import('/scenes/tenkici/TenkDesno.js')).default
  GameClock = (await import('/core/runtime/GameClock.js')).default
  GameObject2D = (await import('/core/actor/GameObject2D.js')).default
})

/** A tank alone with a target, on its own clock; the images do not load in tests. */
function tankAlone(Tank) {
  const clock = new GameClock()
  const tank = new Tank({ x: 400, y: 500, groundY: 520, clock, xLimit: Infinity, ai: false })
  tank.width = 150
  tank.height = 60
  tank.cev.width = 60
  const target = new GameObject2D(null, { x: 0, y: 500, width: 100, height: 40 })
  tank.targets.push(target)
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) {
      clock.advance(1 / 30)
      tank.update(1 / 30)
    }
  }
  return { tank, target, live }
}

test('a tank has the states idle, drive, fire and dead, and starts standing', () => {
  const { tank, live } = tankAlone(TenkLevo)
  assert.deepEqual(tank.states, ['idle', 'drive', 'fire', 'dead'])
  assert.equal(tank.state, 'idle')
  live(2)
  assert.equal(tank.x, 400)
})

test('a driving tank goes the way it faces', () => {
  for (const [Tank, way] of [[TenkLevo, 1], [TenkDesno, -1]]) {
    const { tank, live } = tankAlone(Tank)
    tank.x = 1000 // away from the right tank's half of the screen
    tank.setState('drive')
    live(1)
    assert.equal(Math.sign(tank.x - 1000), way, Tank.name)
  }
})

test('a firing tank raises its barrel towards the target, on either side, and fires as it reloads', () => {
  for (const [Tank, side] of [[TenkLevo, 1], [TenkDesno, -1]]) {
    const { tank, target, live } = tankAlone(Tank)
    target.x = tank.x + side * 500
    tank.setState('fire')
    live(2.5)
    assert.equal(Math.sign(Math.cos(tank.cev.angle)), side, `${Tank.name} aims at the target`)
    assert.ok(Math.sin(tank.cev.angle) < 0, 'upwards')
    assert.equal(tank.granate.projectiles.length >= 2, true, 'it fires again after reloading')
  }
})

test('a tank set to dead is destroyed', () => {
  const { tank } = tankAlone(TenkLevo)
  tank.setState('dead')
  assert.equal(tank.dead, true)
  assert.equal(tank.energija, 0)
})

test('a tank fires each shot it lists where it aims: the barrel level for a near point, raised high for a far one', () => {
  const elevations = {}
  for (const name of ['straight', 'up']) {
    const { tank, live } = tankAlone(TenkLevo)
    const shot = tank.shots[name]
    assert.equal(tank.aimAt({ x: tank.x + tank.forward * shot.x, y: tank.y + shot.y }), true, name)
    tank.setState('fire')
    live(1)
    elevations[name] = -Math.sin(tank.cev.angle)
    assert.ok(tank.granate.projectiles.length > 0, name)
  }
  assert.ok(elevations.up > elevations.straight + .3, 'the far shot raises the barrel high')
})

test('a tank cannot aim at a point behind it, and fires only in state fire', () => {
  const { tank, live } = tankAlone(TenkLevo)
  const barrel = tank.cev.angle
  assert.equal(tank.aimAt({ x: tank.x - tank.forward * 300, y: tank.y }), false)
  assert.equal(tank.cev.angle, barrel, 'the barrel stays')
  tank.aimAt({ x: tank.x + tank.forward * 300, y: tank.y })
  live(2)
  assert.equal(tank.granate.projectiles.length, 0, 'at rest it does not fire')
})
