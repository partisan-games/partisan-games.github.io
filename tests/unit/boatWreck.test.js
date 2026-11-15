import { test, before, after, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scene, collideWithWreck, ctx
before(async() => {
  createPageElements()
  const context = Object.fromEntries(['save', 'restore', 'fill', 'stroke', 'beginPath', 'translate',
    'rotate', 'ellipse', 'arc', 'fillRect', 'clearRect'].map(name => [name, () => {}]))
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  Scene = (await import('/scenes/camac/Main.js')).default
  collideWithWreck = (await import('/scenes/camac/wreckCollision.js')).default
  ;({ ctx } = await import('/core/io/platno.js'))
})
after(() => mock.restoreAll())

function setup(t) {
  const scene = new Scene()
  t.after(() => scene.end())
  scene.init()
  scene.session.start()
  scene.player.sirina = 60
  scene.player.visina = 24
  scene.player.postavi(100, 200)
  const enemy = scene.encounter.boat
  enemy.launch(1)
  enemy.postavi(400, 200)
  enemy.reagujNaPogodak(60)
  return { scene, player: scene.player, enemy }
}

test('a fast player cannot cross a surface wreck, loses speed and is gently reflected without damage', t => {
  const { scene, player, enemy } = setup(t)
  player.dx = 1000
  scene.update(.5)
  assert.ok(player.x + player.sirina / 2 < enemy.x - enemy.sirina / 2)
  assert.ok(player.dx < 0 && Math.abs(player.dx) < 200)
  assert.equal(player.energija, 100)
  assert.equal(enemy.dead, true)
  assert.equal(scene.cameraX, player.x - scene.canvas.width / 3)
})

test('sinking is gradual, pauses, releases the surface obstacle and clears fully before reuse', t => {
  const { scene, player, enemy } = setup(t)
  assert.equal(enemy.wreck.solid, true)
  assert.equal(enemy.wreck.progress, 0)
  scene.session.update(1)
  enemy.update(0)
  assert.ok(enemy.wreck.progress > 0 && enemy.wreck.progress < 1)
  const progress = enemy.wreck.progress
  scene.session.pause()
  scene.session.update(10)
  enemy.update(1)
  assert.equal(enemy.wreck.progress, progress)
  scene.session.resume()
  scene.session.update(2)
  enemy.update(0)
  assert.equal(enemy.wreck.solid, false)
  assert.ok(enemy.polozaj.z > player.polozaj.z, 'the submerged hull renders behind the player')
  const previous = { x: 100, y: 200 }
  player.x = 600
  assert.equal(collideWithWreck(player, enemy, previous, enemy), false)
  assert.equal(player.x, 600)
  scene.session.update(1)
  assert.equal(enemy.wreck.progress, 1)
  assert.equal(enemy.wreck.finished, false, 'bubbles outlast the disappearing hull')
  scene.session.update(1.1)
  scene.encounter.update()
  assert.equal(enemy.vidljiv, false)
  enemy.launch(-1)
  assert.equal(enemy.wreck.startedAt, null)
  assert.equal(enemy.wreck.solid, false)
  assert.equal(enemy.polozaj.z, 0)
})

test('surface collision respects rotated hulls and lets an overlapping player move away', () => {
  const angle = Math.PI / 4, cos = Math.cos(angle), sin = Math.sin(angle)
  const enemy = { x: 400, y: 400, ugao: angle, sirina: 220, visina: 40,
    vidljiv: true, wreck: { solid: true } }
  const previous = { x: 400 - cos * 300, y: 400 - sin * 300 }
  const player = { x: 400 + cos * 300, y: 400 + sin * 300, ugao: angle,
    sirina: 60, visina: 24, dx: cos * 1000, dy: sin * 1000, dead: false }
  assert.equal(collideWithWreck(player, enemy, previous, enemy), true)
  assert.ok((player.x - 400) * cos + (player.y - 400) * sin < -140)
  assert.ok(player.dx * cos + player.dy * sin < 0)
  const overlapping = { x: 400, y: 400 }
  player.x = 400 - cos * 300
  player.y = 400 - sin * 300
  assert.equal(collideWithWreck(player, enemy, overlapping, enemy), false)
})

test('smoke and bubbles draw only for the current visible wreck', t => {
  const { scene, enemy } = setup(t)
  const circles = []
  for (const method of ['save', 'restore', 'fill', 'stroke', 'beginPath', 'translate', 'rotate', 'ellipse'])
    t.mock.method(ctx, method, () => {})
  t.mock.method(ctx, 'arc', (...args) => circles.push(args))
  scene.session.update(1)
  enemy.wreck.renderEffects()
  assert.ok(circles.length > 0)
  circles.length = 0
  enemy.sakrij()
  enemy.wreck.renderEffects()
  assert.equal(circles.length, 0)
})
