import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameSession from '/core/runtime/GameSession.js'

let Avionce, inputOptions, playerPlane, Enemy, Input, attackLabels, Flame

before(async() => {
  createPageElements()
  globalThis.Audio = class {
    play() {
      return Promise.resolve()
    }
  }
  ;({ Avionce, inputOptions, playerPlane } = await import('/scenes/vis/Avionce.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Input = (await import('/core/io/Input.js')).default
  Flame = (await import('/core/actor/Flame.js')).default
  ;({ attackLabels } = await import('/core/io/keys.js'))
})

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

test('choosing a Vis aircraft loads its image while keeping the player, input and weapons', async t => {
  const player = new Avionce({ session: new GameSession() })
  t.after(() => player.end())
  const { input, weapon, session } = player
  assert.equal(player.aircraftId, 'spitfire')
  const loaded = player.selectAircraft('hurricane')
  Object.defineProperties(player.image, {
    naturalWidth: { value: 300 }, naturalHeight: { value: 255 },
  })
  player.image.onload()
  await loaded
  assert.equal(player.aircraftId, 'hurricane')
  assert.ok(player.image.src.endsWith('/hurricane-mkiv-realistic.png'))
  assert.deepEqual([player.width, player.height], [150, 127.5])
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
  player.width = player.height = 80 // as its image would give
  const enemy = new Enemy({ session })
  enemy.x = enemy.y = 5000
  player.targets = [enemy]
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
  player.takeHit()
  fly(player, playerPlane.respawnTime + .05)
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

test('the vis player plane comes back where its start is, which knows its size', t => {
  const { player } = createPlayer(t)
  player.startAt = plane => ({ x: 300, y: 700 - plane.height })

  loseLife(player)

  assert.equal(player.alive, true)
  assert.equal(player.x, 300)
  assert.equal(player.y, 700 - player.height)
})

test('without a start of its own, the vis player plane starts where it is made', () => {
  const player = new Avionce({ session: new GameSession(), x: 200, y: 150 })
  player.x = player.y = 0
  player.toStart()
  assert.deepEqual([player.x, player.y], [200, 150])
  player.end()
})

test('for 2 s after coming back, neither a bullet nor a crash takes a life of the vis player', t => {
  const { player, enemy } = createPlayer(t)
  const { lives, shieldTime } = playerPlane

  loseLife(player)
  player.takeHit()
  crashInto(player, enemy)
  assert.equal(player.alive, true)
  assert.equal(player.zivoti, lives - 1)

  fly(player, shieldTime)
  player.takeHit()
  assert.equal(player.zivoti, lives - 2, 'then a bullet takes one')

  loseLife(player)
  fly(player, shieldTime)
  crashInto(player, enemy)
  assert.equal(player.zivoti, lives - 3, 'and so does a crash')
})

test('during a loop a bullet does not take a life of the vis player, after it does', t => {
  const { player } = createPlayer(t)

  pressLoop(player)
  fly(player, playerPlane.loop.duration / 2)
  player.takeHit()
  assert.equal(player.alive, true)

  fly(player, playerPlane.loop.duration)
  player.takeHit()
  assert.equal(player.alive, false)
})

test('a loop ends where it began, at the plane\'s own size', t => {
  const { player } = createPlayer(t)

  pressLoop(player)
  fly(player, playerPlane.loop.duration / 2)
  assert.ok(player.scaleY < 0, 'halfway the plane is on its back')

  fly(player, playerPlane.loop.duration)
  assert.equal(player.looping, false)
  assert.equal(player.scaleX, 1)
  assert.equal(player.scaleY, 1)
  assert.ok(Math.abs(player.y - 400) < 1)
})

test('holding C makes one loop, and the vis player has three per life', t => {
  const { player } = createPlayer(t)
  const { loops, loop } = playerPlane

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
  player.shoot()
  return player.bullets.projectiles.filter(bullet => bullet.visible).length
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
    return player.bullets.projectiles.filter(bullet => bullet.visible).length
  }

  assert.equal(shotsWhileHeld(inputOptions.attackKey), 1)
  assert.ok(attackLabels[inputOptions.attackKey])
  assert.equal(shotsWhileHeld('Enter'), 0)
})

test('the vis player fires again only after the reload, by game time', t => {
  const { player } = createPlayer(t)

  player.shoot()
  player.shoot()
  assert.equal(player.bullets.projectiles.filter(bullet => bullet.visible).length, 1)

  fly(player, playerPlane.reloadTime + .01)
  player.shoot()
  assert.equal(player.bullets.projectiles.filter(bullet => bullet.visible).length, 2)
})

test('set to fire, the vis player fires straight up as often as it reloads, and only at a point above it', t => {
  const { player } = createPlayer(t)
  const shown = () => player.bullets.projectiles.filter(bullet => bullet.visible)
  assert.deepEqual(player.states, ['fly', 'fire'])
  assert.equal(player.aimAt({ x: player.x, y: player.y + 100 }), false, 'not below')
  assert.equal(player.aimAt({ x: player.x + player.forward * player.shots.up.x, y: player.y + player.shots.up.y }), true)

  fly(player, .5)
  assert.equal(shown().length, 0, 'flying, it does not fire')
  player.setState('fire')
  fly(player, playerPlane.reloadTime * 3.5)
  assert.ok(shown().length >= 3, 'again after each reload')
  assert.ok(shown().every(bullet => Math.abs(bullet.dx) < 1e-9 && bullet.dy < 0), 'straight up')
})

test('the player scores the points of a plane when it goes down, not for every hit', t => {
  const { player } = createPlayer(t)
  const heavy = new Enemy({ session: player.session, type: 'heavy' })
  player.targets = [heavy]
  const hit = () => {
    player.bullets.fire({ x: 0, y: 0 }, 0, 0)
    const bullet = player.bullets.projectiles.find(shot => shot.visible)
    bullet.checkHit = (target, callback) => bullet.hit(target, callback)
    player.bullets.checkHits([heavy], plane => player.scoreIfDown(plane))
  }

  for (let i = 0; i < 4; i++) hit()
  assert.equal(player.poeni, 0)
  hit()
  assert.equal(player.poeni, 500)
  hit() // a bullet into the falling plane
  assert.equal(player.poeni, 500, 'a plane scores once')
})

test('a new player life cannot show fire particles at the previous crash site', t => {
  const { player } = createPlayer(t)
  player.flame = new Flame()
  player.setPosition(100, 150)
  player.die()
  player.updateFlame(1 / 60)
  assert.ok(player.flame.sparks.length > 0)

  player.height = 100
  player.reset()
  assert.equal(player.flame.sparks.length, 0)
  player.setPosition(600, 450)
  player.die()
  assert.deepEqual([player.flame.x, player.flame.y], [600, 450])
  assert.equal(player.flame.sparks.length, 0, 'nothing from the old fire can render before the next update')
  player.updateFlame(1 / 60)
  assert.ok(player.flame.sparks.length > 0)
  for (const spark of player.flame.sparks) {
    assert.ok(Math.abs(spark.x - 600) <= 1)
    assert.ok(Math.abs(spark.y - 450) <= 4)
  }
})
