import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }
let AircraftPropellers, DiveBomber, Aircraft, Enemy, Boss, GameSession, enemyAircraftArt, Renderer2D

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  AircraftPropellers = (await import('/core/actor/aircraft/AircraftPropellers.js')).default
  DiveBomber = (await import('/core/actor/aircraft/DiveBomber.js')).default
  Aircraft = (await import('/scenes/to-trieste/Aircraft.js')).default
  ;({ enemyAircraftArt } = await import('/scenes/to-trieste/enemyArt.js'))
  Enemy = (await import('/scenes/vis/Enemy.js')).default
  Boss = (await import('/scenes/vis/Boss.js')).default
  GameSession = (await import('/core/runtime/GameSession.js')).default
  Renderer2D = (await import('/core/Renderer2D.js')).default
  new Renderer2D({ canvas: document.createElement('canvas') })
})

test('blade phases advance with game time and hold for stopped engines and zero time', () => {
  const propellers = new AircraftPropellers('armies/game-ready/avioni/ju87.svg')
  propellers.update(.031)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(0)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(1, false)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(.03)
  assert.equal(propellers.frameIndex, 2)
})

test('both twin-engine hubs draw from the same atlas phase in the unchanged body coordinates', () => {
  for (const [src, size, hubs] of [
    ['bf-110', [354, 265], [[126.5, 29], [226.5, 29]]],
    ['he-111', [820, 591], [[310, 28], [497, 28]]],
  ]) {
    const propellers = new AircraftPropellers(`armies/nemci/avioni/${src}-odozgo.png`)
    Object.defineProperties(propellers.image, { complete: { value: true }, naturalWidth: { value: 256 } })
    propellers.update(.031)
    const draws = []
    propellers.renderLocal({ drawImage: (...args) => draws.push(args) }, { width: size[0] / 2, height: size[1] / 2 })
    assert.equal(draws.length, 2)
    for (const [i, draw] of draws.entries()) {
      assert.deepEqual(draw.slice(1, 5), [64, 0, 64, 12])
      assert.equal(draw[5] + draw[7] / 2, (hubs[i][0] - size[0] / 2) / 2)
      assert.equal(draw[6] + draw[8] / 2, (hubs[i][1] - size[1] / 2) / 2)
    }
  }
})

test('Kluz, Do Trsta and Vis use the same propeller view on their real actors without enlarging colliders', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const camera = { cameraX: 0, cameraY: 0 }
  const bomber = new DiveBomber({ camera, groundY: 700, session })
  loadAtlas(bomber, 200, 74)
  bomber.enter({ x: 300, y: 100, fromBehind: false })
  bomber.update(.031)
  assert.equal(bomber.propellers.frameIndex, 1)
  assert.deepEqual([bomber.width, bomber.height], [250, 92.5])
  for (const kind of ['diveBomber', 'fighter']) {
    const art = enemyAircraftArt[kind]
    const plane = new Aircraft({ kind, art, clock: session.clock, target: { x: 0, y: 500 }, groundY: 500 })
    plane.launch()
    plane.update(.031)
    assert.equal(plane.propellers.frameIndex, 1)
    assert.deepEqual([plane.width, plane.height], [art.width, art.height])
  }
  for (const plane of [new Enemy({ session }), new Enemy({ session, type: 'heavy' }), new Boss({ session })]) {
    assert.ok(plane.propellers.art)
    const [w, h] = plane.propellers.art.bodySize
    loadAtlas(plane, w, h)
    plane.update(.031)
    assert.equal(plane.propellers.frameIndex, 1)
    assert.deepEqual([plane.width, plane.height], [w / 2, h / 2])
    plane.engineRunning = false
    plane.update(.04)
    assert.equal(plane.propellers.frameIndex, 1)
  }
})
