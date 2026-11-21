import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leftPlayerKeys } from '/core/io/keys.js'
import CannonKeys from '/core/gameplay/controllers/CannonKeys.js'
import FieldGun, { fieldGun } from '/core/gameplay/bodies/artillery/FieldGun.js'

/** A gun and its player's keys on a keyboard whose held keys the test chooses. */
const played = options => {
  const held = new Set()
  const keyboard = { isDown: key => key.codes.some(code => held.has(code)) }
  const cannon = new FieldGun(options)
  return { cannon, held, player: new CannonKeys(cannon, { keyboard, keys: leftPlayerKeys }) }
}

test('holding fire charges by elapsed time up to the most, and up raises either barrel alike', () => {
  const a = played({ x: 20 }), b = played({ x: 80, yaw: Math.PI })
  a.held.add('Space')
  b.held.add('Space')
  for (let i = 0; i < 30; i++) a.player.handleInput(1 / 30)
  for (let i = 0; i < 60; i++) b.player.handleInput(1 / 60)
  assert.ok(Math.abs(a.cannon.force - b.cannon.force) < 1e-9)
  a.player.handleInput(100)
  assert.equal(a.cannon.force, fieldGun.maxForce)
  a.held.add('KeyW')
  b.held.add('KeyW')
  a.player.handleInput(.1)
  b.player.handleInput(.1)
  assert.ok(Math.abs(a.cannon.elevation - b.cannon.elevation) < 1e-9)
})

test('letting fire go fires the charged shot once, and a release without charge fires nothing', () => {
  const { cannon, held, player } = played({ x: 20 })
  player.handleInput(.1)
  assert.equal(cannon.hasActiveShot, false, 'nothing was held')
  held.add('Space')
  player.handleInput(.5)
  assert.equal(cannon.hasActiveShot, false, 'not while it is held')
  held.delete('Space')
  player.handleInput(.01)
  assert.equal(cannon.shotsFired, 1)
  assert.equal(cannon.force, fieldGun.minForce)
})
