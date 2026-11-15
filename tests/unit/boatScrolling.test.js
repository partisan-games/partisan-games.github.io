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

test('boat and camera travel past either screen edge, reverse, and stop together', t => {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.player.sirina = 60
  scene.player.visina = 25
  scene.session.ready()
  scene.session.start()
  for (const x of [platno.width * 3, -platno.width * 2]) {
    scene.player.x = x
    scene.player.dx = x > 0 ? 120 : -120
    const speed = scene.player.dx
    scene.update(.1)
    assert.ok(Math.abs(scene.player.x - (x + speed * .1)) < 1e-8)
    assert.ok(Math.abs(scene.player.x - scene.cameraX - platno.width / 3) < 1e-8)
    assert.equal(scene.player.prikazan, true, 'world coordinates must not hide the tracked boat')
  }
  scene.player.stani()
  const camera = scene.cameraX
  scene.update(.1)
  assert.equal(scene.cameraX, camera, 'without displacement the bank does not scroll')
  scene.session.pause()
  const x = scene.player.x
  scene.update(1)
  assert.equal(scene.player.x, x)
  assert.equal(scene.cameraX, camera)
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
