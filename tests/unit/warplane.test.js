import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameClock from '/core/runtime/GameClock.js'
import Warplane, { warplane } from '/core/gameplay/bodies/aircraft/Warplane.js'
import Building from '/core/gameplay/bodies/buildings/Building.js'
import Tower, { tower } from '/core/gameplay/bodies/buildings/Tower.js'
import WarplaneKeys from '/core/gameplay/controllers/WarplaneKeys.js'
import Interceptor, { interceptor } from '/core/gameplay/bodies/aircraft/Interceptor.js'
import GunTurrets, { gunTurrets } from '/core/gameplay/bodies/aircraft/GunTurrets.js'

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

test('a destroyed warplane settles on elevated ground and cannot resume flight', () => {
  const clock = new GameClock(), plane = new Warplane({ clock, groundAt: () => 6 })
  plane.setState('dead')
  fly(plane, clock, 18)
  plane.setState('move')
  assert.equal(plane.state, 'dead')
  assert.equal(plane.speed, 0)
  assert.equal(plane.airborne, false)
  near(plane.y, 6 + plane.size.height * 2 / 3)
  assert.equal(plane.fire(), false)
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

/** Plays `bodies` together for `seconds` at 30 frames a second, the clock running with them. */
const play = (clock, bodies, seconds) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) {
    clock.advance(1 / 30)
    for (const body of bodies) body.update(1 / 30)
  }
}

test('an enemy fighter makes pass after pass at the bomber, firing when it has it in its sights', () => {
  const clock = new GameClock(), bomber = new Warplane({ clock })
  const fighter = new Interceptor({ target: bomber, clock, x: 20, y: bomber.y + 10, z: -200 })
  const distances = [], states = new Set()
  for (let i = 0; i < 30 * 20; i++) {
    play(clock, [bomber, fighter], 1 / 30)
    distances.push(fighter.distance)
    states.add(fighter.state)
  }
  assert.ok(Math.min(...distances) < interceptor.breakAway + 5, 'it closes in')
  assert.deepEqual([...states].sort(), ['attack', 'extend'], 'it breaks away and comes round again')
  assert.ok(fighter.shotsFired > 0 && bomber.hitsTaken > 0, 'its bursts hit the bomber')
  assert.ok(fighter.y > interceptor.floor - 5, `it keeps above the ground: ${fighter.y}`)
})

test('a fighter shot down falls to the ground and lies there', () => {
  const clock = new GameClock(), bomber = new Warplane({ clock })
  const fighter = new Interceptor({ target: bomber, clock, groundAt: () => 3, y: 40, z: -100 })
  fighter.takeHit(interceptor.health)
  play(clock, [fighter], 5)
  assert.equal(fighter.airborne, false)
  near(fighter.y, 3 + fighter.size.height / 2)
  const shots = fighter.shotsFired
  play(clock, [fighter], 1)
  assert.equal(fighter.shotsFired, shots, 'a wreck does not fire')
})

test('the bomber\'s guns fire only while held, lead a crossing fighter and shoot it down', () => {
  const clock = new GameClock(), bomber = new Warplane({ clock })
  // a fighter crossing ahead of the bomber, not turning, so only a lead can meet it
  const fighter = new Interceptor({ target: bomber, clock, x: -60, y: bomber.y, z: -80 })
  fighter.setState('extend')
  fighter.goal = { x: 1000, y: bomber.y, z: -80 }
  const guns = new GunTurrets({ plane: bomber, targets: [fighter], clock })
  const keys = new WarplaneKeys(bomber, { attack2: false }, guns)
  keys.update()
  play(clock, [fighter, guns], .5)
  assert.equal(guns.shotsFired, 0, 'they hold their fire until the player fires')
  keys.input.attack2 = true
  keys.update()
  play(clock, [fighter, guns], 3)
  assert.ok(guns.shotsFired > 0)
  assert.ok(fighter.dead, `the lead brings it down: ${fighter.health.current}`)
})

test('the guns aim only at a living fighter within their range', () => {
  const clock = new GameClock(), bomber = new Warplane({ clock })
  const far = new Interceptor({ target: bomber, clock, z: -gunTurrets.range - 50 })
  const guns = new GunTurrets({ plane: bomber, targets: [far], clock })
  assert.equal(guns.target, null)
  far.z = -50
  assert.equal(guns.target, far)
  far.takeHit(interceptor.health)
  assert.equal(guns.target, null)
})
