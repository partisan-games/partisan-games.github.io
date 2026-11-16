import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene, canvas2d
before(async t => {
  createPageElements()
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ fillRect() {} }))
  Scene = (await import('/scenes/camac/Main.js')).default
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

function sceneFor(t) {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.width = 60
  scene.player.height = 24
  scene.session.ready()
  scene.session.start()
  return scene
}

test('boat fire starts at its rotated bow in world coordinates and does not follow later turns', t => {
  const scene = sceneFor(t)
  const boat = scene.player
  boat.x = canvas2d.width * 4
  scene.cameraX = boat.x - canvas2d.width / 3
  boat.angle = Math.PI / 4
  const { muzzle } = boat
  assert.equal(boat.shoot(), true)
  const shot = boat.bullets.projectiles.find(p => p.visible)
  assert.equal(shot.x, muzzle.x)
  assert.equal(shot.y, muzzle.y)
  assert.ok(shot.dx > 0 && shot.dy > 0)
  assert.ok(Math.abs(shot.dx - shot.dy) < 1e-8)
  const { dx } = shot, { dy } = shot, { angle } = shot
  boat.angle = Math.PI
  scene.cameraX += 10
  shot.update(.1)
  assert.equal(shot.dx, dx)
  assert.equal(shot.dy, dy)
  assert.equal(shot.angle, angle)
  assert.ok(Math.abs(shot.x - muzzle.x - dx * .1) < 1e-8)
  assert.ok(Math.abs(shot.y - muzzle.y - dy * .1) < 1e-8)
})

test('boat firing respects cooldown, pause and death, and recycles camera-exited shots', t => {
  const scene = sceneFor(t)
  const boat = scene.player
  assert.equal(boat.shoot(), true)
  assert.equal(boat.shoot(), false)
  const shot = boat.bullets.projectiles[0]
  const count = boat.bullets.projectiles.length
  scene.session.pause()
  scene.session.update(2)
  assert.equal(boat.shoot(), false)
  scene.session.resume()
  assert.equal(boat.shoot(), false, 'pause does not consume the firing cooldown')
  scene.session.update(.2)
  shot.x = scene.cameraX - 100
  shot.update(.1)
  assert.equal(shot.visible, false)
  assert.equal(boat.shoot(), true)
  assert.equal(boat.bullets.projectiles[0], shot)
  assert.equal(boat.bullets.projectiles.length, count)
  assert.equal(shot.visible, true)
  boat.alive = false
  scene.session.update(.2)
  assert.equal(boat.shoot(), false)
})
