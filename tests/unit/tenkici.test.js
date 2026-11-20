import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Tenkici, TankKeys, TankAI, keys

before(async() => {
  createPageElements()
  const { installFakeFrames } = await import('./helpers/frames.js')
  installFakeFrames()
  ;({ default: Tenkici } = await import('/scenes/tenkici/Main.js'))
  ;({ default: TankKeys } = await import('/core/io/controllers/TankKeys.js'))
  ;({ default: TankAI } = await import('/core/gameplay/controllers/TankAI.js'))
  keys = await import('/core/io/keys.js')
})

function scene(t) {
  const game = new Tenkici()
  game.init()
  game.clear = () => {} // happy-dom has no 2D canvas to draw the background on
  t.after(() => game.end())
  return game
}

test('one player drives the left tank with the left keys against a tank that drives itself; two players get a tank each', t => {
  const game = scene(t)
  assert.ok(game.tenk.controller instanceof TankKeys)
  assert.equal(game.tenk.controller.keys, keys.leftPlayerKeys)
  assert.ok(game.tenk2.controller instanceof TankAI)

  const button = document.createElement('button')
  button.id = 'dva-igraca'
  game.handleClick({ target: button })
  assert.ok(game.tenk2.controller instanceof TankKeys)
  assert.equal(game.tenk2.controller.keys, keys.rightPlayerKeys)
})

test('when both tanks are destroyed at once, the victory stands', t => {
  const game = scene(t)
  game.start()
  game.tenk.alive = game.tenk2.alive = false

  game.update(0)
  assert.match(document.getElementById('modal').textContent, /German tank destroyed/)
  assert.doesNotMatch(document.getElementById('modal').textContent, /Game over/)
})
