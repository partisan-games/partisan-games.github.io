import { test } from 'node:test'
import assert from 'node:assert/strict'
import Tank from '/core/gameplay/bodies/vehicles/Tank.js'
import TankKeys from '/core/gameplay/controllers/TankKeys.js'
import GameClock from '/core/runtime/GameClock.js'
import { leftPlayerKeys } from '/core/io/keys.js'

/** A keyboard whose held keys the test chooses. */
const fakeKeyboard = () => {
  const held = new Set()
  return { held, isDown: key => held.has(key) }
}

/** A left tank that the left player's keys drive, on a fake keyboard. */
function driven(clock = new GameClock()) {
  const keyboard = fakeKeyboard()
  const tank = new Tank({ x: 10, clock })
  const keys = new TankKeys(tank, { keyboard, keys: leftPlayerKeys })
  /** Holds `key` for one input, then lets it go. */
  const tap = key => {
    keyboard.held.add(key)
    keys.handleInput(1 / 30)
    keyboard.held.delete(key)
    keys.handleInput(1 / 30)
  }
  return { tank, keys, keyboard, tap }
}

test('the tank fires on the release of the fire key, from its muzzle, and recoils', () => {
  const { tank, keys, keyboard } = driven()
  keyboard.held.add(leftPlayerKeys.shoot)
  keys.handleInput(1 / 30)
  assert.equal(tank.shotsFired, 0, 'not while it is held')
  keyboard.held.delete(leftPlayerKeys.shoot)
  keys.handleInput(1 / 30)
  assert.equal(tank.shotsFired, 1)
  assert.ok(tank.vx < 0)
})

test('during the reload a release fires nothing, and the reload waits on game time', () => {
  const clock = new GameClock()
  const { tank, tap } = driven(clock)
  tap(leftPlayerKeys.shoot)
  tap(leftPlayerKeys.shoot)
  assert.equal(tank.shotsFired, 1)
  clock.advance(1)
  tap(leftPlayerKeys.shoot)
  assert.equal(tank.shotsFired, 2)
})

test('left and right drive the tank, up and down raise and lower the barrel', () => {
  const { tank, tap } = driven()
  tap(leftPlayerKeys.right)
  assert.ok(tank.vx > 0)
  tank.vx = 0
  tap(leftPlayerKeys.left)
  assert.ok(tank.vx < 0)
  const start = tank.elevation
  tap(leftPlayerKeys.up)
  assert.ok(tank.elevation > start)
  tap(leftPlayerKeys.down)
  tap(leftPlayerKeys.down)
  assert.ok(tank.elevation < start)
})
