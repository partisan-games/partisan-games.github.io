import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let Tank, tankKinds, TankSprite, sideProjection, vehicleArt, GameClock, looks
const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ default: Tank, tankKinds } = await import('/core/gameplay/bodies/vehicles/Tank.js'))
  ;({ default: TankSprite } = await import('/core/actor/vehicles/TankSprite.js'))
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  ;({ default: vehicleArt } = await import('/core/actor/vehicleArt.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
  looks = await import('/core/actor/tankLooks.js')
})

for (const [name, kindName, artName, width, height, yaw] of [
  ['partisan', 'partisan', 'partisanTank', 300, 129, 0],
  ['German', 'german', 'germanTank', 327, 137, Math.PI],
  ['Somua', 'somua', 'somuaS35', 379, 166, Math.PI],
  ['M15/42', null, 'm15', 202, 102, Math.PI],
  ['StuG III', null, 'stug', 216, 89, Math.PI],
  ['Hotchkiss', null, 'hotchkiss', 169, 88, Math.PI],
]) test(`${name} tank view fits the atlas to the body and rolls both ways`, t => {
  const look = kindName ? null : looks[artName]
  const kind = look?.kind ?? tankKinds[kindName]
  const art = look?.art ?? vehicleArt[artName]
  assert.equal(art.gutter, 4)
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  const tank = new Tank({ kind, yaw, x: 20, clock: new GameClock() })
  const view = new TankSprite(tank, { art, barrel: { src: 'barrel.png' }, projection })
  loadAtlas(view, (width + 8) * 4, (height + 8) * (art.wreckRow === undefined ? 6 : 7))
  assert.deepEqual([view.width, view.height, view.y], [kind.size.length * 22, kind.size.height * 22, 300],
    'a loaded atlas keeps the body size before the game moves anything')
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  const roll = (way, dt) => {
    tank.vx = way * 2
    tank.update(dt)
    view.update(dt)
    view.render(context)
  }
  roll(tank.forward, .16)
  assert.deepEqual(draws.at(-1).slice(1, 5), [width + 12, height + 12, width, height])
  assert.equal(draws.at(-2)[2], (height + 8) * 3 + 4, 'forward turret over the rolling hull')
  tank.aimAt({ x: tank.x - tank.forward * 12, y: tank.y })
  view.render(context)
  assert.equal(draws.at(-2)[2], (height + 8) * 5 + 4, 'only the turret switches to its opposite side')
  assert.deepEqual(draws.at(-1).slice(1, 5), [width + 12, height + 12, width, height])
  const { clipTime } = view
  view.update(0)
  assert.equal(view.clip, 'drive', 'the first zero-time tick after resuming preserves the pose')
  assert.equal(view.clipTime, clipTime, 'pause/resume preserves the held drive phase')
  view.clipTime = 0
  roll(-tank.forward, .16)
  assert.deepEqual(draws.at(-1).slice(1, 5), [(width + 8) * 3 + 4, height + 12, width, height])
  roll(0, .1)
  assert.equal(draws.at(-1)[2], 4, 'stopping uses the padded static idle row')
  tank.setState('dead')
  tank.update(1)
  view.update(1)
  assert.equal(view.clip, 'idle')
  assert.equal(view.frameIndex, 0)
  if (art.wreckRow !== undefined) {
    const before = [view.width, view.height, view.y]
    view.flammable = false
    view.render(context)
    assert.deepEqual(draws.at(-1).slice(1, 5), [4, (height + 8) * 6 + 4, width, height])
    assert.deepEqual([view.width, view.height, view.y], before, 'padding does not resize embedded wrecks')
  }
})

test('a tank barrel leads with its mouth: art pointing left is mirrored, never turned upside down', () => {
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  for (const [kind, yaw, facing, flips] of [['partisan', 0, 1, []], ['german', Math.PI, -1, [['scale', -1, 1]]]]) {
    const tank = new Tank({ kind: tankKinds[kind], yaw, x: 20, clock: new GameClock() })
    const view = new TankSprite(tank, { art: vehicleArt.partisanTank, barrel: { src: 'barrel.png', facing }, projection })
    loadAtlas(view.barrel, 194, 28)
    const calls = []
    const ctx = { save() {}, restore() {}, translate() {},
      drawImage: (image, ...source) => calls.push(['draw', Math.sign(source[4])]),
      rotate: angle => calls.push(['rotate', angle]), scale: (...args) => calls.push(['scale', ...args]) }
    view.barrel.render(ctx)
    assert.deepEqual(calls, [['rotate', projection.angle(yaw, tank.elevation)], ...flips, ['draw', facing < 0 ? -1 : 0]], kind)
  }
})

test('a tank view mirrors its art only when the body faces the other way than the art points', () => {
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  const flip = (yaw, facing) => new TankSprite(new Tank({ yaw, clock: new GameClock() }),
    { art: vehicleArt.germanTank, facing, barrel: { src: 'barrel.png' }, projection }).flipY
  assert.deepEqual([flip(Math.PI, -1), flip(0, -1), flip(0, 1), flip(Math.PI, 1)], [1, -1, 1, -1])
})
