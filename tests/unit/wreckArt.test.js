import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }
let wreckFor, bodyImage, TenkLevo, GroundEnemy, profiles, groundEnemyArt, Vehicle, kinds, Bunker, Flak, GameSession, Renderer2D

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ wreckFor, bodyImage } = await import('/core/actor/wreckView.js'))
  TenkLevo = (await import('/scenes/tenkici/TenkLevo.js')).default
  ;({ GroundEnemy, profiles } = await import('/scenes/to-trieste/GroundEnemies.js'))
  ;({ groundEnemyArt } = await import('/scenes/to-trieste/enemyArt.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
  Vehicle = (await import('/core/actor/vehicles/Vehicle.js')).default
  Bunker = (await import('/scenes/to-trieste/Bunker.js')).default
  Flak = (await import('/core/actor/artillery/Flak.js')).default
  GameSession = (await import('/core/runtime/GameSession.js')).default
  Renderer2D = (await import('/core/Renderer2D.js')).default
  new Renderer2D({ canvas: document.createElement('canvas') })
})

function readyWreck(body, width) {
  const image = wreckFor(body.image.src)
  assert.ok(image, `${body.image.src} has its own wreck`)
  Object.defineProperties(image, { complete: { value: true, configurable: true }, naturalWidth: { value: width, configurable: true } })
  return image
}

test('tank wreck uses one complete frame, keeps the collider, hides its tube and restores after revival', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const tank = new TenkLevo({ clock: session.clock, x: 200, y: 300, scale: .4, xLimit: Infinity })
  loadAtlas(tank, 1200, 258)
  const before = [tank.width, tank.height, tank.y]
  const wreck = readyWreck(tank, 300)
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  tank.setState('dead')
  tank.update(0)
  tank.flammable = false
  tank.render()
  assert.equal(draws.at(-1)[0], wreck)
  assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, 300, 129])
  assert.deepEqual([tank.width, tank.height, tank.y], before)
  assert.equal(tank.cev.visible, false)
  tank.alive = true
  tank.setState('idle')
  tank.update(0)
  tank.render()
  assert.equal(draws.at(-1)[0], tank.image)
  assert.equal(tank.cev.visible, true)
})

test('all four Kluz vehicles draw their own wreck on the unchanged live ground anchor', t => {
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  for (const name of ['truck', 'legionTruck', 'tank', 'train']) {
    const vehicle = new Vehicle({ ...kinds[name], camera: { cameraX: 0, cameraY: 0 }, groundY: 500, x: 300 })
    const { width, height } = vehicle.art.frame
    loadAtlas(vehicle, width * 4, height * 2)
    const wreck = readyWreck(vehicle, width)
    vehicle.flammable = false
    vehicle.render()
    const destination = draws.at(-1).slice(5)
    vehicle.die()
    vehicle.render()
    assert.equal(draws.at(-1)[0], wreck)
    assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, width, height])
    assert.deepEqual(draws.at(-1).slice(5), destination)
    assert.equal(vehicle.y + vehicle.height / 2, 500)
  }
})

test('Do Trsta ground enemies and both bunkers select wrecks, preserve scrolling and restore live views on reset', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const target = { x: 0, y: 300, width: 10, height: 10, alive: true }
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  for (const profile of profiles) {
    const art = groundEnemyArt[profile.kind]
    const object = new GroundEnemy({ ...profile, art, clock: session.clock, target, obstacles: [],
      groundY: 300, scrollSpeed: -160, x: 500, nextSpawnX: () => 2000 })
    if (art.sprite) loadAtlas(object, art.sprite.frame.width * 4, art.sprite.frame.height * 2)
    else loadAtlas(object, 233, 51)
    const geometry = [object.width, object.height, object.y]
    const wreck = readyWreck(object, art.sprite?.frame.width || 233)
    object.flammable = false
    object.die()
    object.render()
    assert.equal(draws.at(-1)[0], wreck)
    assert.deepEqual([object.width, object.height, object.y], geometry)
    assert.equal(object.dx, -160)
    object.reset()
    assert.equal(bodyImage(object), object.image)
    assert.equal(object.alive, true)
  }
  for (const [src, width, height] of [['buildings/kuca-bunker.png', 428, 286], ['buildings/bunker-02.png', 246, 93]]) {
    const bunker = new Bunker({ src, clock: session.clock, target, groundY: 300, width, height, x: 200 })
    const wreck = readyWreck(bunker, width)
    bunker.die()
    Renderer2D.instance.drawObject(bunker)
    assert.equal(draws.at(-1)[0], wreck)
    bunker.reset()
    assert.equal(bodyImage(bunker), bunker.image)
  }
})

test('destroying a Flak removes its operational tube and flash while preserving the base dimensions', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const gun = new Flak({ session, camera: { cameraX: 0, cameraY: 0 }, groundY: 500, x: 200 })
  loadAtlas(gun, 204, 122)
  const wreck = readyWreck(gun, 204)
  const geometry = [gun.width, gun.height, gun.y]
  gun.die()
  assert.equal(bodyImage(gun), wreck)
  assert.equal(gun.barrel.visible, false)
  assert.equal(gun.muzzleFlash.visible, false)
  assert.deepEqual([gun.width, gun.height, gun.y], geometry)
})

test('the real player boat shows damage after defeat and returns to the intact view on reset', async t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const Boat = (await import('/scenes/camac/Boat.js')).default
  const boat = new Boat(() => 0, session)
  loadAtlas(boat, 355, 152)
  const wreck = readyWreck(boat, 355)
  const size = [boat.width, boat.height]
  boat.setState('dead')
  assert.equal(bodyImage(boat), wreck)
  assert.deepEqual([boat.width, boat.height], size)
  boat.reset()
  assert.equal(bodyImage(boat), boat.image)
})
