import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene, Obala, platno
before(async() => {
  createPageElements()
  Scene = (await import('/scenes/camac/Main.js')).default
  Obala = (await import('/scenes/camac/Obala.js')).default
  platno = (await import('/core/io/platno.js')).default
})

test('boat movement and throttle framing share world coordinates and pause together', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.sirina = 60
  scene.player.visina = 25
  scene.session.ready()
  scene.session.start()
  for (const speed of [120, -120]) {
    const x = platno.width * 3
    scene.player.x = x
    scene.player.dx = speed
    scene.update(.1)
    assert.ok(Math.abs(scene.player.x - (x + speed * .1)) < 1e-8)
    assert.ok(Math.abs(scene.player.x - scene.cameraX - scene.camera.screenX(platno.width, scene.player.sirina)) < 1e-8)
    assert.equal(scene.player.prikazan, true, 'world coordinates must not hide the tracked boat')
  }
  scene.player.stani()
  const stationaryX = scene.player.x
  scene.update(.1)
  assert.equal(scene.player.x, stationaryX, 'framing does not move the boat in the world')
  assert.equal(scene.cameraX, scene.camera.left(scene.player.x, platno.width, scene.player.sirina))
  const camera = scene.cameraX
  scene.session.pause()
  const x = scene.player.x
  scene.update(1)
  assert.equal(scene.player.x, x)
  assert.equal(scene.cameraX, camera)
})

test('initial rest stays still and returning left stops at the start of the route', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.sirina = 60
  scene.player.visina = 25
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
  const previous = [scene.renderer.kameraX, scene.renderer.kameraY]
  scene.cameraX = 500
  t.mock.method(scene.renderer, 'crtaPredmete', () => {
    assert.equal(scene.renderer.kameraX, 500)
    assert.equal(scene.renderer.kameraY, 0)
    throw new Error('draw interrupted')
  })
  assert.throws(() => scene.render(), /draw interrupted/)
  assert.deepEqual([scene.renderer.kameraX, scene.renderer.kameraY], previous)
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
