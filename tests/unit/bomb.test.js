import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Avionce, Neprijatelj, Input

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }
  }
  ;({ Avionce } = await import('/core/actor/derived/Avionce.js'))
  Neprijatelj = (await import('/scenes/vis/Neprijatelj.js')).default
  Input = (await import('/core/io/Input.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** The vis player plane in the middle of the screen, an enemy plane close to it and one far away. */
function createBattle(t) {
  const player = new Avionce()
  player.input.end()
  player.input = new Input({ useKeyboard: true, useJoystick: false })
  player.x = 500
  player.y = 400
  const near = new Neprijatelj('armies/nemci/avioni/avion-odozgo-01.png', { potisak: 150 })
  const far = new Neprijatelj('armies/nemci/avioni/avion-odozgo-03.png', { potisak: 150 })
  near.x = 600
  near.y = 350
  far.x = 5000
  far.y = 400
  player.ciljevi = [near, far]
  t.after(() => player.end())
  return { player, near, far }
}

/** Holds V for a few frames, as a player does. */
function dropBomb(player) {
  key('keydown', 'KeyV')
  for (let i = 0; i < 10; i++) player.handleInput(1 / 60)
  key('keyup', 'KeyV')
  player.handleInput(1 / 60)
}

test('a bomb in vis shoots down the enemy planes around the player, one point each', t => {
  const { player, near, far } = createBattle(t)

  dropBomb(player)

  assert.equal(near.alive, false, 'the near plane goes down')
  assert.equal(far.alive, true, 'the far plane flies on')
  assert.equal(player.poeni, 1)
  assert.equal(player.bombs, 1, 'holding the key drops one bomb')
})

test('the vis player has two bombs per game', t => {
  const { player, near } = createBattle(t)

  for (let i = 0; i < 2; i++) {
    near.alive = true
    dropBomb(player)
  }
  near.alive = true
  dropBomb(player)

  assert.equal(player.bombs, 0)
  assert.equal(near.alive, true, 'no bomb is left for the third try')
  assert.equal(player.poeni, 2)
})
