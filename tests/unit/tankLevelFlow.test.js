import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Health from '/core/gameplay/Health.js'

test('the complete level keeps scrolling through ground combat, aircraft passes, pause and the finish', async t => {
  createPageElements()
  const draws = []
  const ctx = { createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {},
    drawImage(...args) { draws.push(args) }, save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo() {}, lineTo() {}, fill() {}, stroke() {}, ellipse() {} }
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ctx)
  // Asset stand-ins let the real scene finish init without a browser or actual rasterization.
  class LoadedImage {
    naturalWidth = 256
    naturalHeight = 128
    set src(value) {
      this.url = value
      if (value.endsWith('/items/granata.gif')) { this.naturalWidth = 32; this.naturalHeight = 8 }
      if (value.endsWith('/plamen.gif')) { this.naturalWidth = 75; this.naturalHeight = 98 }
      queueMicrotask(() => { this.complete = true; this.onload?.() })
    }
    get src() { return this.url }
    decode() { return Promise.resolve() }
  }
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  Object.defineProperty(globalThis, 'Image', { value: LoadedImage, configurable: true, writable: true })
  t.after(() => Object.defineProperty(globalThis, 'Image', imageDescriptor))
  const Scene = (await import('/scenes/2d-tank/Main.js')).default
  const scene = new Scene()
  t.after(() => scene.end())
  await scene.init()
  t.mock.method(scene.ui, 'showMessage', () => {})
  // Isolate world progression from survival skill; weapon/health behavior has separate checks.
  scene.tenk.health = new Health({ maximum: 1_000_000 })
  scene.session.ready()
  scene.session.start()
  const ids = new Map(scene.airRaids.planes.map(p => [p, p.lifeId]))
  let passes = 0, shots = 0, paused = false
  let roadX
  const step = 1 / 60
  for (let frame = 0; frame < 12_000 && scene.session.state === 'running'; frame++) {
    if (!paused && scene.distance > scene.levelLength / 3) {
      const distance = scene.distance, now = scene.session.clock.now
      scene.session.pause()
      scene.session.update(2)
      scene.update(2)
      assert.equal(scene.distance, distance)
      assert.equal(scene.session.clock.now, now)
      scene.session.resume()
      paused = true
    }
    if (frame % 72 === 0) { scene.tenk.pucaj(scene.tenk.vrhCevi, scene.tenk.cev.ugao); shots++ }
    const before = scene.distance
    scene.session.update(step)
    scene.update(step)
    assert.ok(scene.distance > before, 'air raids and combat must not suspend the world')
    assert.equal(scene.battlefield.distance(), scene.distance)
    if (frame % 120 === 0) {
      draws.length = 0
      scene.battlefield.render()
      const currentX = draws.find(draw => draw[0] === scene.battlefield.road)[1]
      if (roadX !== undefined) assert.notEqual(currentX, roadX, 'the rendered road must move during ground and air combat')
      roadX = currentX
    }
    assert.ok(scene.airRaids.planes.filter(p => p.active).length <= 1)
    for (const plane of scene.airRaids.planes) if (ids.get(plane) !== plane.lifeId) {
      passes++
      ids.set(plane, plane.lifeId)
    }
  }
  assert.ok(paused && shots > 100 && passes >= 4)
  assert.equal(scene.distance, scene.levelLength)
  assert.equal(scene.session.state, 'finished')
  const distance = scene.distance
  scene.session.update(1)
  scene.update(1)
  assert.equal(scene.distance, distance)
  scene.end()
  const replay = new Scene()
  t.after(() => replay.end())
  await replay.init()
  assert.equal(replay.distance, 0)
  assert.equal(replay.session.clock.now, 0)
  assert.ok(replay.airRaids.planes.every(plane => !plane.active && !plane.vidljiv))
})
