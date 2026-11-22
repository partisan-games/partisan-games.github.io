import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameClock from '/core/runtime/GameClock.js'
import Warplane, { warplane } from '/core/gameplay/bodies/aircraft/Warplane.js'
import Building from '/core/gameplay/bodies/buildings/Building.js'
import Tower, { tower } from '/core/gameplay/bodies/buildings/Tower.js'
import WarplaneKeys from '/core/gameplay/controllers/WarplaneKeys.js'

const near = (actual, expected, within = 1e-6) => assert.ok(Math.abs(actual - expected) <= within, `${actual} is not ${expected}`)

/** Flies a plane `seconds` at `fps`, the clock running with it. */
const fly = (plane, clock, seconds, fps = 30) => {
  for (let i = 0; i < Math.round(seconds * fps); i++) {
    clock.advance(1 / fps)
    plane.update(1 / fps)
  }
}

test('a warplane moves across and up as far at 30, 60 and 120 frames a second, and stays inside its limit', () => {
  const across = [30, 60, 120].map(fps => {
    const clock = new GameClock(), plane = new Warplane({ clock, limit: 100 })
    plane.steer({ across: 1, climb: 1 })
    fly(plane, clock, 1, fps)
    plane.steer()
    fly(plane, clock, .5, fps)
    return [plane.x, plane.y]
  })
  for (const [x, y] of across.slice(1)) {
    near(x, across[0][0], 1e-6)
    near(y, across[0][1], 1e-6)
  }
  const clock = new GameClock(), plane = new Warplane({ clock, limit: 10 })
  plane.steer({ across: -1 })
  fly(plane, clock, 3)
  assert.equal(plane.x, -10)
  assert.ok(plane.roll === 0 || Math.abs(plane.roll) < .01, 'at the limit it stops and levels its wings')
})

test('it banks into a move across, the way it moves', () => {
  const clock = new GameClock(), plane = new Warplane({ clock })
  plane.steer({ across: 1 })
  fly(plane, clock, .3)
  assert.ok(plane.roll < -.2, `it banks right: ${plane.roll}`)
})

test('keys fire a missile, and the next only after its reload of game time; it bursts on a building and destroys it', () => {
  const clock = new GameClock()
  // a building ahead and below, where the missile's dive takes it
  const target = new Building({ x: 0, y: 5, z: -40, size: { length: 30, height: 10, width: 30 } })
  const plane = new Warplane({ clock, targets: [target] })
  const keys = new WarplaneKeys(plane, { attack: true })
  keys.update()
  keys.update()
  assert.equal(plane.shotsFired, 1)
  fly(plane, clock, warplane.reload + 1 / 30)
  keys.update()
  assert.equal(plane.shotsFired, 2)
  fly(plane, clock, 1)
  assert.ok(target.dead, 'one missile destroys a building')
  assert.ok(plane.missiles.projectiles.some(missile => missile.bursts > 0))
})

test('a missile that misses bursts on the ground', () => {
  const clock = new GameClock(), plane = new Warplane({ clock, groundAt: () => 2 })
  plane.fire()
  fly(plane, clock, 2)
  const [missile] = plane.missiles.projectiles
  assert.equal(missile.bursts, 1)
  assert.equal(missile.y, 2)
})

test('a landed warplane slows down the same at 30 and at 60 frames a second', () => {
  const speeds = [30, 60].map(fps => {
    const clock = new GameClock(), plane = new Warplane({ clock })
    plane.land()
    fly(plane, clock, 3, fps)
    return plane.speed
  })
  near(speeds[1], speeds[0], 1e-6)
  assert.ok(speeds[0] < warplane.speed)
})

test('a tower fires at a target in range every interval of game time, and its rounds hit', () => {
  const clock = new GameClock()
  const plane = new Warplane({ clock, y: 29, z: -100 })
  const gun = new Tower({ clock, targets: [plane], size: { length: 6, height: 18, width: 6 }, y: 9 })
  for (let i = 0; i < 60; i++) {
    clock.advance(1 / 30)
    gun.update(1 / 30)
  }
  assert.equal(gun.shotsFired, Math.floor(2 / tower.interval))
  assert.ok(plane.hitsTaken > 0, 'its rounds reach the plane')
  const far = new Warplane({ clock, z: -1000 })
  const idle = new Tower({ clock, targets: [far], size: { length: 6, height: 18, width: 6 } })
  idle.update(1)
  assert.equal(idle.shotsFired, 0, 'out of range it holds fire')
})
