import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { leftPlayerKeys } from '/core/io/keys.js'
import CannonKeys from '/core/io/controllers/CannonKeys.js'

let Top, keyboard

before(async() => {
  createPageElements()
  Top = (await import('/scenes/ustanak/Top.js')).default
  ;({ keyboard } = await import('/core/io/Keyboard.js'))
})

/** A cannon and its player's keys, the way the scene pairs them. */
const played = options => {
  const cannon = new Top(options)
  return { cannon, player: new CannonKeys(cannon, leftPlayerKeys) }
}

test('charging depends on elapsed time, has a maximum and uses the same aiming direction on either side', t => {
  t.after(() => keyboard.reset())
  keyboard.pressed.Space = true
  const a = played({ x: 200, y: 300 })
  const b = played({ x: 800, y: 300, direction: -1 })
  for (let i = 0; i < 30; i++) a.player.handleInput(1 / 30)
  for (let i = 0; i < 60; i++) b.player.handleInput(1 / 60)
  assert.ok(Math.abs(a.cannon.sila - b.cannon.sila) < 1e-9)
  a.player.handleInput(100)
  assert.equal(a.cannon.sila, a.cannon.maxForce)
  keyboard.pressed.KeyW = true
  a.player.handleInput(.1)
  b.player.handleInput(.1)
  assert.ok(Math.abs(a.cannon.elevation - b.cannon.elevation) < 1e-9)
})

test('letting fire go fires the charged shot once, and a release without charge fires nothing', t => {
  t.after(() => keyboard.reset())
  const { cannon, player } = played({ x: 200, y: 300 })
  cannon.width = 100
  player.handleInput(.1)
  assert.equal(cannon.hasActiveShot, false, 'nothing was held')
  keyboard.pressed.Space = true
  player.handleInput(.5)
  assert.equal(cannon.hasActiveShot, false, 'not while it is held')
  keyboard.pressed.Space = false
  player.handleInput(.01)
  assert.equal(cannon.granate.projectiles.filter(shell => shell.visible).length, 1)
  assert.equal(cannon.sila, cannon.minSila)
})
