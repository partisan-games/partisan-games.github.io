import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene, Obala, canvas2d
before(async t => {
  createPageElements()
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ fillRect() {} }))
  Scene = (await import('/scenes/camac/Main.js')).default
  Obala = (await import('/scenes/camac/Obala.js')).default
  canvas2d = (await import('/core/io/canvas2d.js')).default
})

test('boat movement and throttle framing share world coordinates and pause together', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.width = 60
  scene.player.height = 25
  scene.session.ready()
  scene.session.start()
  for (const speed of [120, -120]) {
    const x = canvas2d.width * 3
    scene.player.x = x
    scene.player.dx = speed
    scene.update(.1)
    assert.ok(Math.abs(scene.player.x - (x + speed * .1)) < 1e-8)
    assert.ok(Math.abs(scene.player.x - scene.cameraX - scene.camera.screenX(canvas2d.width, scene.player.width)) < 1e-8)
    assert.equal(scene.player.shown, true, 'world coordinates must not hide the tracked boat')
  }
  scene.player.stop()
  const stationaryX = scene.player.x
  scene.update(.1)
  assert.equal(scene.player.x, stationaryX, 'framing does not move the boat in the world')
  assert.equal(scene.cameraX, scene.camera.left(scene.player.x, canvas2d.width, scene.player.width))
  const camera = scene.cameraX
  scene.session.pause()
  const { x } = scene.player
  scene.update(1)
  assert.equal(scene.player.x, x)
  assert.equal(scene.cameraX, camera)
})

test('initial rest stays still and returning left stops at the start of the route', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.width = 60
  scene.player.height = 25
  scene.session.start()
  const startX = scene.player.x
  for (let i = 0; i < 60; i++) scene.update(1 / 60)
  assert.equal(scene.player.x, startX)
  assert.equal(scene.player.dx, 0)
  assert.equal(scene.cameraX, 0)
  scene.player.x = startX + 20
  scene.player.dx = -200
  scene.update(.5)
  assert.equal(scene.player.x, startX)
  assert.equal(scene.player.dx, 0)
  assert.equal(scene.cameraX, 0)
  scene.player.dx = 100
  scene.update(.1)
  assert.ok(scene.player.x > startX, 'the route boundary still allows forward travel')
})

test('boat rendering restores the shared camera even when drawing fails', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  const previous = [scene.renderer.cameraX, scene.renderer.cameraY]
  scene.cameraX = 500
  t.mock.method(scene.renderer, 'drawObjects', () => {
    assert.equal(scene.renderer.cameraX, 500)
    assert.equal(scene.renderer.cameraY, 0)
    throw new Error('draw interrupted')
  })
  assert.throws(() => scene.render(), /draw interrupted/)
  assert.deepEqual([scene.renderer.cameraX, scene.renderer.cameraY], previous)
})

test('banks remain continuous at segment boundaries and repeat on revisiting world positions', () => {
  const bank = new Obala()
  for (const x of [-7500, -75, 0, 75, 7500]) {
    const offset = bank.offsetAt(x)
    bank.offsetAt(x + 1_000_000)
    assert.equal(bank.offsetAt(x), offset)
    assert.ok(Math.abs(offset) <= bank.opsegSuma)
    assert.ok(Math.abs(bank.offsetAt(x - .001) - bank.offsetAt(x + .001)) < .001)
  }
})
