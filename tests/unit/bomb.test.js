import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import * as timers from '/core/timers.js'

let Avionce, inputOptions, Enemy, Input, settings, platno, Explosion

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }
  }
  ;({ Avionce, inputOptions } = await import('/scenes/vis/Avionce.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Input = (await import('/core/io/Input.js')).default
  ;({ settings } = await import('/scenes/vis/settings.js'))
  platno = (await import('/core/io/platno.js')).default
  Explosion = (await import('/scenes/vis/Explosion.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** The vis player plane in the middle of the screen, an enemy plane close to it and one far away. */
function createBattle(t) {
  const player = new Avionce()
  player.input.end()
  player.input = new Input({ ...inputOptions, useKeyboard: true, useJoystick: false })
  player.x = 500
  player.y = 400
  const near = new Enemy()
  const far = new Enemy()
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

test('a bomb in vis shoots down the enemy fighters around the player, with their points', t => {
  const { player, near, far } = createBattle(t)

  dropBomb(player)

  assert.equal(near.alive, false, 'the near plane goes down')
  assert.equal(far.alive, true, 'the far plane flies on')
  assert.equal(player.poeni, 100)
  assert.equal(player.bombs, settings.player.bombs - 1, 'holding the key drops one bomb')
})

test('a bomb in vis also shoots down a plane at the edge of its fire, but not one past it', t => {
  const { player, near, far } = createBattle(t)
  const radius = settings.player.bombRadius * Math.min(platno.width, platno.height)
  near.x = player.x + radius + Explosion.reach - 10
  near.y = player.y
  far.x = player.x + radius + Explosion.reach + 10
  far.y = player.y

  dropBomb(player)

  assert.equal(near.alive, false, 'the fire reaches it')
  assert.equal(far.alive, true)
})

test('a bomb in vis also takes out the enemy bullets in its fire, but not those past it', t => {
  const { player, near, far } = createBattle(t)
  near.pali({ x: player.x, y: player.y - 100 }, Math.PI / 2)
  far.pali({ x: far.x, y: far.y }, Math.PI / 2)

  dropBomb(player)

  assert.equal(near.meci[0].vidljiv, false, 'the bullet close to the player is gone')
  assert.equal(far.meci[0].vidljiv, true)
})

test('the vis player has three bombs per game', t => {
  const { player, near } = createBattle(t)

  for (let i = 0; i < 3; i++) {
    near.alive = true
    dropBomb(player)
  }
  near.alive = true
  dropBomb(player)

  assert.equal(player.bombs, 0)
  assert.equal(near.alive, true, 'no bomb is left for the fourth try')
  assert.equal(player.poeni, 300)
})

test('a bomb in vis bursts on the plane it hits and over the blast, and the bursts go out', t => {
  const { player, near } = createBattle(t)
  const { bombBursts, bombSpread } = settings.player
  const shown = () => player.explosions.filter(burst => burst.vidljiv)

  dropBomb(player)
  assert.deepEqual(shown().map(({ x, y }) => ({ x, y })), [{ x: near.x, y: near.y }], 'at once on the hit plane')

  timers.update(bombSpread)
  assert.equal(shown().length, 1 + bombBursts, 'the bursts over the blast follow')

  player.explosions.forEach(burst => burst.update(settings.explosion.duration))
  assert.equal(shown().length, 0)
})
