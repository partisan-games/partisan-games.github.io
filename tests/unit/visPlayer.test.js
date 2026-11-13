import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Avionce, inputOptions, Enemy, Input, settings, platno, PowerUps, attackLabels

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
  PowerUps = (await import('/scenes/vis/PowerUps.js')).default
  ;({ attackLabels } = await import('/core/io/keys.js'))
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

test('choosing a Vis aircraft loads its image while keeping the player, input and weapons', async t => {
  const player = new Avionce({ session: new GameSession() })
  t.after(() => player.end())
  const { input, weapon, session } = player
  assert.equal(player.aircraftId, 'spitfire')
  const loaded = player.selectAircraft('hurricane')
  Object.defineProperties(player.slika, {
    naturalWidth: { value: 300 }, naturalHeight: { value: 255 },
  })
  player.slika.onload()
  await loaded
  assert.equal(player.aircraftId, 'hurricane')
  assert.ok(player.slika.src.endsWith('/hurricane-mkiv-realistic.png'))
  assert.deepEqual([player.sirina, player.visina], [150, 127.5])
  assert.equal(player.input, input)
  assert.equal(player.weapon, weapon)
  assert.equal(player.session, session)
  assert.throws(() => player.selectAircraft('unknown'), /Unknown aircraft/)
  assert.equal(player.aircraftId, 'hurricane')
})

/** The vis player plane with the keyboard, and an enemy plane far away. */
function createPlayer(t) {
  const session = new GameSession()
  session.start()
  const player = new Avionce({ session })
  player.input.end()
  player.input = new Input({ ...inputOptions, useKeyboard: true, useJoystick: false })
  player.x = 500
  player.y = 400
  player.sirina = player.visina = 80 // as its image would give
  const enemy = new Enemy({ session })
  enemy.x = enemy.y = 5000
  player.ciljevi = [enemy]
  t.after(() => player.end())
  return { player, enemy }
}

/** Flies the player plane, and the game clock with it. */
function fly(player, seconds, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) {
    player.session.update(1 / fps)
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

/* V3-01 · power-ups */

/** How many bullets one press of fire sends out. */
function bulletsPerShot(player) {
  player.bullets.projectiles.forEach(bullet => bullet.reset())
  player.weapon.cooldown.start(0)
  player.puca()
  return player.bullets.projectiles.filter(bullet => bullet.vidljiv).length
}

test('the vis player starts with one bullet a shot; fire power-ups bring two, then three, until a life is lost', t => {
  const { player } = createPlayer(t)

  assert.equal(bulletsPerShot(player), 1)
  player.powerUp('fire')
  assert.equal(bulletsPerShot(player), 2)
  player.powerUp('fire')
  assert.equal(bulletsPerShot(player), 3)
  player.powerUp('fire')
  assert.equal(bulletsPerShot(player), 3, 'three is the most')

  loseLife(player)
  assert.equal(bulletsPerShot(player), 1)
})

test('the vis player fires with its attack key, which the controls window can name, and not with Enter', t => {
  const { player } = createPlayer(t)
  const shotsWhileHeld = code => {
    player.bullets.projectiles.forEach(bullet => bullet.reset())
    player.weapon.cooldown.start(0)
    key('keydown', code)
    player.handleInput(1 / 60)
    key('keyup', code)
    return player.bullets.projectiles.filter(bullet => bullet.vidljiv).length
  }

  assert.equal(shotsWhileHeld(inputOptions.attackKey), 1)
  assert.ok(attackLabels[inputOptions.attackKey])
  assert.equal(shotsWhileHeld('Enter'), 0)
})

test('the vis player fires again only after the reload, by game time', t => {
  const { player } = createPlayer(t)

  player.puca()
  player.puca()
  assert.equal(player.bullets.projectiles.filter(bullet => bullet.vidljiv).length, 1)

  fly(player, settings.player.reloadTime + .01)
  player.puca()
  assert.equal(player.bullets.projectiles.filter(bullet => bullet.vidljiv).length, 2)
})

test('power-ups drop in their order, the player picks up the one it touches, and one past the bottom is gone', t => {
  const { player } = createPlayer(t)
  const scene = { predmeti: [], add(...items) {
    this.predmeti.push(...items)
  }, remove(...items) {
    this.predmeti = this.predmeti.filter(item => !items.includes(item))
  } }
  const powerUps = new PowerUps({ scene, player })
  const { order } = settings.powerUps

  order.forEach(() => powerUps.drop({ x: 100, y: 100 }))
  powerUps.drop({ x: player.x, y: player.y })
  powerUps.items.forEach(item => {
    item.sirina = item.visina = 40
  })
  assert.deepEqual(powerUps.items.map(item => item.kind), [...order, order[0]], 'round and round')

  const { bombs } = player
  powerUps.update()
  assert.equal(powerUps.items.length, order.length, 'the touched one is picked up')
  assert.equal(player.fireLevel, 1, `the first is ${order[0]}`)
  assert.equal(scene.predmeti.length, order.length)

  player.powerUp('bomb')
  player.powerUp('life')
  assert.equal(player.bombs, bombs + 1)
  assert.equal(player.zivoti, settings.player.lives + 1)

  powerUps.items.forEach(item => {
    item.y = platno.height + 200
  })
  powerUps.update()
  assert.deepEqual(scene.predmeti, [])
})
