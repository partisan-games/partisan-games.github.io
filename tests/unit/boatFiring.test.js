import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene, platno
before(async t => {
  createPageElements()
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ fillRect() {} }))
  Scene = (await import('/scenes/camac/Main.js')).default
  platno = (await import('/core/io/platno.js')).default
})

function sceneFor(t) {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.sirina = 60
  scene.player.visina = 24
  scene.session.ready()
  scene.session.start()
  return scene
}

test('boat fire starts at its rotated bow in world coordinates and does not follow later turns', t => {
  const scene = sceneFor(t)
  const boat = scene.player
  boat.x = platno.width * 4
  scene.cameraX = boat.x - platno.width / 3
  boat.ugao = Math.PI / 4
  const muzzle = boat.muzzle
  assert.equal(boat.puca(), true)
  const shot = boat.bullets.projectiles.find(p => p.vidljiv)
  assert.equal(shot.x, muzzle.x)
  assert.equal(shot.y, muzzle.y)
  assert.ok(shot.dx > 0 && shot.dy > 0)
  assert.ok(Math.abs(shot.dx - shot.dy) < 1e-8)
  const dx = shot.dx, dy = shot.dy, angle = shot.ugao
  boat.ugao = Math.PI
  scene.cameraX += 10
  shot.update(.1)
  assert.equal(shot.dx, dx)
  assert.equal(shot.dy, dy)
  assert.equal(shot.ugao, angle)
  assert.ok(Math.abs(shot.x - muzzle.x - dx * .1) < 1e-8)
  assert.ok(Math.abs(shot.y - muzzle.y - dy * .1) < 1e-8)
})

test('boat firing respects cooldown, pause and death, and recycles camera-exited shots', t => {
  const scene = sceneFor(t)
  const boat = scene.player
  assert.equal(boat.puca(), true)
  assert.equal(boat.puca(), false)
  const shot = boat.bullets.projectiles[0]
  const count = boat.bullets.projectiles.length
  scene.session.pause()
  scene.session.update(2)
  assert.equal(boat.puca(), false)
  scene.session.resume()
  assert.equal(boat.puca(), false, 'pause does not consume the firing cooldown')
  scene.session.update(.2)
  shot.x = scene.cameraX - 100
  shot.update(.1)
  assert.equal(shot.vidljiv, false)
  assert.equal(boat.puca(), true)
  assert.equal(boat.bullets.projectiles[0], shot)
  assert.equal(boat.bullets.projectiles.length, count)
  assert.equal(shot.vidljiv, true)
  boat.alive = false
  scene.session.update(.2)
  assert.equal(boat.puca(), false)
})
