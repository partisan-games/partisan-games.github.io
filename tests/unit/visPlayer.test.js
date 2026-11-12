import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import * as timers from '/core/timers.js'

let Avionce, Enemy, Input, settings, platno

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }
  }
  ;({ Avionce } = await import('/scenes/vis/Avionce.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Input = (await import('/core/io/Input.js')).default
  ;({ settings } = await import('/scenes/vis/settings.js'))
  platno = (await import('/core/io/platno.js')).default
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

/** The vis player plane with the keyboard, and an enemy plane far away. */
function createPlayer(t) {
  const player = new Avionce()
  player.input.end()
  player.input = new Input({ useKeyboard: true, useJoystick: false })
  player.x = 500
  player.y = 400
  const enemy = new Enemy()
  enemy.x = enemy.y = 5000
  player.ciljevi = [enemy]
  t.after(() => player.end())
  return { player, enemy }
}

/** Flies the player plane, and the game clock with it. */
function fly(player, seconds, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) {
    timers.update(1 / fps)
    player.update(1 / fps)
  }
}

/** Shoots the plane down and waits until it is back. */
function loseLife(player) {
  player.reagujNaPogodak()
  fly(player, settings.player.respawnTime + .05)
}

/** Puts the enemy plane right on the player. */
function crashInto(player, enemy) {
  enemy.x = player.x
  enemy.y = player.y
  player.update(1 / 60)
}

/** Holds C for a few frames, as a player does. */
function pressLoop(player) {
  key('keydown', 'KeyC')
  for (let i = 0; i < 10; i++) player.handleInput(1 / 60)
  key('keyup', 'KeyC')
  player.handleInput(1 / 60)
}

test('the vis player plane comes back at the bottom middle of the screen', t => {
  const { player } = createPlayer(t)

  loseLife(player)

  assert.equal(player.alive, true)
  assert.equal(player.x, platno.width / 2)
  assert.equal(player.y, platno.height - player.visina)
})

test('for 2 s after coming back, neither a bullet nor a crash takes a life of the vis player', t => {
  const { player, enemy } = createPlayer(t)
  const { lives, shieldTime } = settings.player

  loseLife(player)
  player.reagujNaPogodak()
  crashInto(player, enemy)
  assert.equal(player.alive, true)
  assert.equal(player.zivoti, lives - 1)

  fly(player, shieldTime)
  player.reagujNaPogodak()
  assert.equal(player.zivoti, lives - 2, 'then a bullet takes one')

  loseLife(player)
  fly(player, shieldTime)
  crashInto(player, enemy)
  assert.equal(player.zivoti, lives - 3, 'and so does a crash')
})

test('during a loop a bullet does not take a life of the vis player, after it does', t => {
  const { player } = createPlayer(t)

  pressLoop(player)
  fly(player, settings.player.loop.duration / 2)
  player.reagujNaPogodak()
  assert.equal(player.alive, true)

  fly(player, settings.player.loop.duration)
  player.reagujNaPogodak()
  assert.equal(player.alive, false)
})

test('a loop ends where it began, at the plane\'s own size', t => {
  const { player } = createPlayer(t)

  pressLoop(player)
  fly(player, settings.player.loop.duration / 2)
  assert.ok(player.scaleY < 0, 'halfway the plane is on its back')

  fly(player, settings.player.loop.duration)
  assert.equal(player.looping, false)
  assert.equal(player.scaleX, 1)
  assert.equal(player.scaleY, 1)
  assert.ok(Math.abs(player.y - 400) < 1)
})

test('holding C makes one loop, and the vis player has three per life', t => {
  const { player } = createPlayer(t)
  const { loops, loop } = settings.player

  pressLoop(player)
  assert.equal(player.loopsLeft, loops - 1, 'holding the key makes one loop')

  for (let i = 1; i < loops; i++) {
    fly(player, loop.duration + .05)
    pressLoop(player)
  }
  fly(player, loop.duration + .05)
  pressLoop(player)
  assert.equal(player.looping, false, 'no loop is left for the fourth try')

  loseLife(player)
  assert.equal(player.loopsLeft, loops, 'a new life brings new loops')
})
