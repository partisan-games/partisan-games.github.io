import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }
let wreckFor, bodyImage, Tank, tankKinds, TankSprite, vehicleArt, AntiTankGun, AntiTankGunSprite, Bunker, bunkerKinds,
  BunkerSprite, Vehicle, vehicleKinds, VehicleSprite, kinds, Flak, FlakSprite, projection, GameSession

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ wreckFor, bodyImage } = await import('/core/actor/wreckView.js'))
  ;({ default: Tank, tankKinds } = await import('/core/gameplay/bodies/vehicles/Tank.js'))
  TankSprite = (await import('/core/actor/vehicles/TankSprite.js')).default
  vehicleArt = (await import('/core/actor/vehicleArt.js')).default
  AntiTankGun = (await import('/core/gameplay/bodies/artillery/AntiTankGun.js')).default
  AntiTankGunSprite = (await import('/core/actor/artillery/AntiTankGunSprite.js')).default
  ;({ default: Bunker, bunkerKinds } = await import('/core/gameplay/bodies/artillery/Bunker.js'))
  BunkerSprite = (await import('/core/actor/artillery/BunkerSprite.js')).default
  ;({ groundUnitLooks: kinds } = await import('/core/actor/groundUnitLooks.js'))
  ;({ default: Vehicle, vehicleKinds } = await import('/core/gameplay/bodies/vehicles/Vehicle.js'))
  VehicleSprite = (await import('/core/actor/vehicles/VehicleSprite.js')).default
  Flak = (await import('/core/gameplay/bodies/artillery/Flak.js')).default
  FlakSprite = (await import('/core/actor/artillery/FlakSprite.js')).default
  projection = (await import('/core/actor/projection.js')).sideProjection({ pxPerMeter: 22, groundY: 500 })
  GameSession = (await import('/core/runtime/GameSession.js')).default
})

function readyWreck(body, width) {
  const image = wreckFor(body.image.src)
  assert.ok(image, `${body.image.src} has its own wreck`)
  Object.defineProperties(image, { complete: { value: true, configurable: true }, naturalWidth: { value: width, configurable: true } })
  return image
}

test('both Potez markings keep their airframe while falling and show a level wreck only after impact', async t => {
  const { default: Potez } = await import('/core/gameplay/bodies/aircraft/Potez.js')
  const { default: PotezSprite, markings } = await import('/core/actor/aircraft/PotezSprite.js')
  const session = new GameSession()
  t.after(() => session.dispose())
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  for (const src of Object.values(markings)) {
    const body = new Potez({ clock: session.clock, x: 10, y: 60 })
    const view = new PotezSprite(body, { src, projection })
    loadAtlas(view, 400, 173)
    Object.defineProperties(view.crew.image, { naturalWidth: { value: 1600 }, naturalHeight: { value: 173 } })
    view.update(0)
    const geometry = [view.width, view.height]
    const wreck = readyWreck(view, 400)
    assert.equal(view.picture, view.image, 'a living plane keeps its intact airframe')
    body.setState('dead')
    view.update(0)
    view.flammable = false
    assert.equal(body.state, 'falling')
    assert.equal(view.picture, view.image, 'the airframe does not become a ground wreck in mid-air')
    assert.equal(view.propeller.visible, true)
    assert.equal(view.rearGunPart.visible, true)
    for (let i = 0; i < 600 && !body.wrecked; i++) {
      body.update(1 / 60)
      view.update(1 / 60)
    }
    assert.equal(body.wrecked, true)
    assert.equal(view.picture, wreck, 'impact selects the correct marked wreck')
    for (let i = 0; i < 60; i++) {
      body.update(1 / 60)
      view.update(1 / 60)
    }
    const before = draws.length
    view.render(context)
    assert.ok(draws.slice(before).some(args => args[0] === wreck), src)
    assert.ok(!draws.slice(before).some(args => args[0] === view.crew.image), 'dead crew never breathes over the wreck')
    assert.equal(view.propeller.visible, false)
    assert.equal(view.rearGunPart.visible, false)
    assert.deepEqual([view.width, view.height], geometry)
    assert.equal(view.angle, 0)
    assert.ok(Math.abs(view.y + view.height / 2 - 500) < 1e-9, 'the level wreck rests on the visible ground')
  }
})

test('a tank wreck uses one complete frame, keeps the body size and hides its barrel', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const tank = new Tank({ kind: tankKinds.partisan, clock: session.clock, x: 10, y: 1.45 })
  const view = new TankSprite(tank, { art: vehicleArt.partisanTank, barrel: { src: 'barrel.png' }, projection })
  loadAtlas(view, 1200, 258)
  const before = [view.width, view.height, view.y]
  const wreck = readyWreck(view, 300)
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  tank.setState('dead')
  view.update(0)
  view.flammable = false
  view.render(context)
  assert.equal(draws.at(-1)[0], wreck)
  assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, 300, 129])
  assert.deepEqual([view.width, view.height, view.y], before)
  const barrelDraws = draws.length
  view.barrel.render(context)
  assert.equal(draws.length, barrelDraws, 'the wreck has no barrel')
})

test('all four Kluz vehicles draw their own wreck on the unchanged live ground anchor', t => {
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  for (const name of ['truck', 'legionTruck', 'tank', 'train']) {
    const kind = vehicleKinds[name]
    const body = new Vehicle({ kind, x: 14, y: kind.size.height / 2 })
    const view = new VehicleSprite(body, { ...kinds[name], projection })
    const { width, height } = view.art.frame
    loadAtlas(view, width * 4, height * 2)
    const wreck = readyWreck(view, width)
    view.flammable = false
    view.update(0)
    view.render(context)
    const destination = draws.at(-1).slice(5)
    body.setState('dead')
    view.update(0)
    view.render(context)
    assert.equal(draws.at(-1)[0], wreck)
    assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, width, height])
    assert.deepEqual(draws.at(-1).slice(5), destination)
    assert.ok(Math.abs(view.y + view.height / 2 - 500) < 1e-9)
  }
})

test('the Do Trsta gun and both bunkers draw their own wreck at their live size', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  const gun = new AntiTankGun({ clock: session.clock, x: 10, y: .73, yaw: Math.PI })
  const views = [[gun, new AntiTankGunSprite(gun, { projection }), 233]]
  for (const [kind, width] of [['house', 428], ['pillbox', 246]]) {
    const bunker = new Bunker({ kind: bunkerKinds[kind], clock: session.clock, x: 10, y: 3, yaw: Math.PI })
    views.push([bunker, new BunkerSprite(bunker, { kind, projection }), width])
  }
  for (const [body, view, width] of views) {
    const wreck = readyWreck(view, width)
    const geometry = [view.width, view.height, view.y]
    view.flammable = false
    body.setState('dead')
    view.update(0)
    view.render(context)
    assert.equal(draws.find(args => args[0] === wreck) !== undefined, true)
    assert.deepEqual([view.width, view.height, view.y], geometry)
  }
})

test('destroying a Flak removes its operational tube and flash while preserving the base dimensions', t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const gun = new Flak({ clock: session.clock, x: 10, y: 2.08 })
  const view = new FlakSprite(gun, { projection, camera: { cameraX: 0, cameraY: 0 } })
  loadAtlas(view, 204, 122)
  const wreck = readyWreck(view, 204)
  const geometry = [view.width, view.height, view.y]
  gun.setState('dead')
  view.update(0)
  assert.equal(bodyImage(view), wreck)
  assert.equal(view.barrel.visible, false)
  assert.equal(view.muzzleFlash.visible, false)
  assert.deepEqual([view.width, view.height, view.y], geometry)
})

test('the player boat shows its wreck once lost, at its live size', async t => {
  const session = new GameSession()
  t.after(() => session.dispose())
  const { default: Boat } = await import('/core/gameplay/bodies/boats/Boat.js')
  const { default: BoatSprite } = await import('/core/actor/boats/BoatSprite.js')
  const { topProjection } = await import('/core/actor/projection.js')
  const boat = new Boat({ clock: session.clock })
  const view = new BoatSprite(boat, { projection: topProjection({ pxPerMeter: 10 }) })
  loadAtlas(view, 355, 152)
  const wreck = readyWreck(view, 355)
  const size = [view.width, view.height]
  boat.setState('dead')
  view.update(0)
  assert.equal(bodyImage(view), wreck)
  assert.deepEqual([view.width, view.height], size)
})
