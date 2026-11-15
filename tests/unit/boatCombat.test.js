import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'

let Scene, CombatTarget, BoatBullet, platno
before(async() => {
  createPageElements()
  Scene = (await import('/scenes/camac/Main.js')).default
  CombatTarget = (await import('/scenes/camac/CombatTarget.js')).default
  BoatBullet = (await import('/scenes/camac/BoatBullet.js')).default
  platno = (await import('/core/io/platno.js')).default
})

function setup(t) {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.sirina = 60
  scene.player.visina = 24
  scene.player.postavi(100, 200)
  scene.cameraX = 100 - platno.width / 3
  scene.session.ready()
  scene.session.start()
  return scene
}

function targetFor(scene, { x = 260, y = 200, maximum = 20, team = 'axis' } = {}) {
  const target = new CombatTarget({ session: scene.session, viewLeft: () => scene.cameraX,
    src: null, sirina: 40, visina: 20, x, y, maximum })
  scene.addCombatant(target, team)
  return target
}

test('a fast shot damages only the first enemy, once, and ignores friendly actors', t => {
  const scene = setup(t)
  const friend = targetFor(scene, { x: 180, team: 'partisan' })
  const near = targetFor(scene)
  const far = targetFor(scene, { x: 380 })
  scene.player.bullets.fire(scene.player.muzzle, 0, 3000)
  scene.update(.2)
  assert.equal(friend.energija, 20)
  assert.equal(near.energija, 10)
  assert.equal(far.energija, 20)
  assert.equal(scene.player.bullets.projectiles[0].vidljiv, false)
  scene.update(.1)
  assert.equal(near.energija, 10, 'the consumed shot cannot hit twice')
  scene.player.bullets.fire(scene.player.muzzle, 0, 3000)
  scene.update(.2)
  assert.equal(near.dead, true)
  assert.equal(near.energija, 0)
  assert.equal(far.energija, 20)
})

test('hit resolution preserves a crossing even when the shot exits the viewport', t => {
  const scene = setup(t)
  const target = targetFor(scene)
  scene.player.bullets.fire(scene.player.muzzle, 0, platno.width * 20)
  scene.update(.2)
  assert.equal(target.energija, 10)
  assert.equal(scene.player.bullets.projectiles[0].vidljiv, false)
})

test('damage respects pause and new target lives reject old frame hits', t => {
  const scene = setup(t)
  const target = targetFor(scene)
  const oldLife = target.lifeId
  scene.session.pause()
  assert.equal(target.reagujNaPogodak(10), false)
  assert.equal(scene.player.reagujNaPogodak(10), false)
  scene.session.resume()
  target.reset()
  assert.equal(target.lifeId, oldLife + 1)
  assert.equal(target.reagujNaPogodak(20, oldLife), false)
  assert.equal(target.energija, 20)
  scene.player.bullets.fire(scene.player.muzzle, 0, 3000)
  t.mock.method(target, 'update', () => target.reset())
  scene.update(.2)
  assert.equal(target.energija, 20, 'a target recycled after the frame snapshot does not receive an old-life hit')
})

test('sweeps account for target movement and orientation', t => {
  const scene = setup(t)
  const target = targetFor(scene, { x: 260, y: 150 })
  target.dy = 500
  scene.player.bullets.fire(scene.player.muzzle, 0, 1300)
  scene.update(.2)
  assert.equal(target.energija, 10, 'the moving target crosses the bullet between endpoints')
  target.reset()
  target.postavi(260, 200)
  target.sirina = 100
  target.visina = 10
  target.ugao = Math.PI / 2
  scene.player.postavi(100, 230)
  scene.player.stani()
  scene.player.bullets.fire(scene.player.muzzle, 0, 1500)
  scene.update(.2)
  assert.equal(target.energija, 10, 'a rotated long hull is tested in its own coordinate frame')
})

test('enemy shots destroy the player and the existing defeat flow stops further damage and firing', t => {
  const scene = setup(t)
  const enemy = targetFor(scene, { x: 400 })
  enemy.bullets = new ProjectilePool({ owner: enemy, create: () => new BoatBullet(() => scene.cameraX) })
  scene.player.reagujNaPogodak(90)
  enemy.bullets.fire(enemy, Math.PI, 1500)
  scene.update(.2)
  assert.equal(scene.player.energija, 0)
  assert.equal(scene.player.dead, true)
  assert.equal(scene.player.brzina, 0)
  assert.equal(scene.session.state, 'finished')
  assert.equal(scene.player.puca(), false)
  assert.equal(enemy.reagujNaPogodak(10), false)
  scene.end()
  const replay = new Scene()
  t.after(() => replay.end())
  replay.init()
  assert.equal(replay.player.energija, 100)
  assert.equal(replay.player.alive, true)
  assert.equal(replay.player.lifeId, 1)
})
