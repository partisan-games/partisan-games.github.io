import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let Tank, tankKinds, TankSprite, sideProjection, vehicleArt, GroundEnemy, groundEnemyArt, profiles, GameClock
const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  ;({ default: Tank, tankKinds } = await import('/core/gameplay/bodies/vehicles/Tank.js'))
  ;({ default: TankSprite } = await import('/core/actor/vehicles/TankSprite.js'))
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  ;({ default: vehicleArt } = await import('/core/actor/vehicleArt.js'))
  ;({ GroundEnemy, profiles } = await import('/scenes/to-trieste/GroundEnemies.js'))
  ;({ groundEnemyArt } = await import('/scenes/to-trieste/enemyArt.js'))
  ;({ default: GameClock } = await import('/core/runtime/GameClock.js'))
})

for (const [name, kindName, artName, width, height, yaw] of [
  ['partisan', 'partisan', 'partisanTank', 300, 129, 0],
  ['German', 'german', 'germanTank', 327, 137, Math.PI],
]) test(`${name} tank view fits the atlas to the body and rolls both ways`, t => {
  const kind = tankKinds[kindName]
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  const tank = new Tank({ kind, yaw, x: 20, clock: new GameClock() })
  const view = new TankSprite(tank, { art: vehicleArt[artName], barrel: { src: 'barrel.png' }, projection })
  loadAtlas(view, width * 4, height * 2)
  assert.deepEqual([view.width, view.height, view.y], [kind.size.length * 22, kind.size.height * 22, 300],
    'a loaded atlas keeps the body size before the game moves anything')
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  const roll = (way, dt) => {
    tank.vx = way * 2
    tank.update(dt)
    view.update(dt)
    view.render()
  }
  roll(tank.forward, .16)
  assert.deepEqual(draws.at(-1).slice(1, 5), [width, height, width, height])
  const { elapsed } = view.atlas
  view.update(0)
  assert.equal(view.atlas.name, 'drive', 'the first zero-time tick after resuming preserves the pose')
  assert.equal(view.atlas.elapsed, elapsed, 'pause/resume preserves the held drive phase')
  view.atlas.reset()
  roll(-tank.forward, .16)
  assert.deepEqual(draws.at(-1).slice(1, 5), [width * 3, height, width, height])
  roll(0, .1)
  assert.equal(draws.at(-1)[2], 0, 'stopping uses the static idle row')
  tank.setState('dead')
  tank.update(1)
  view.update(1)
  assert.equal(view.atlas.name, 'idle')
  assert.equal(view.atlas.frameIndex, 0)
})

for (const kind of ['germanTank', 'truck', 'tank']) test(`${kind} animates its own drive, not road scrolling, and resets after destruction`, () => {
  const art = groundEnemyArt[kind]
  const enemy = new GroundEnemy({ ...profiles.find(profile => profile.kind === kind),
    art, clock: new GameClock(), target: { x: 0, y: 300, width: 20, height: 20, alive: true },
    x: 500, groundY: 300, scrollSpeed: -160, nextSpawnX: () => 2000 })
  loadAtlas(enemy, art.sprite.frame.width * 4, art.sprite.frame.height * 2)
  assert.deepEqual([enemy.width, enemy.height], [art.width, art.height])
  assert.equal(enemy.y + enemy.height / 2, 305)
  enemy.update(.16)
  assert.equal(enemy.bodySprite.name, 'idle', 'scrolling alone must not rotate the wheels')
  enemy.setState('drive')
  enemy.update(.16)
  assert.equal(enemy.bodySprite.name, 'drive')
  assert.equal(enemy.bodySprite.frameIndex, 1)
  const { elapsed } = enemy.bodySprite
  enemy.update(0)
  assert.equal(enemy.bodySprite.elapsed, elapsed, 'zero game time cannot advance the loop')
  if (enemy.fire) {
    enemy.setState('fire')
    enemy.update(.16)
    assert.equal(enemy.bodySprite.name, 'drive', 'a moving tank still rolls while firing')
  }
  enemy.die()
  enemy.update(.16)
  assert.equal(enemy.dx, -160)
  assert.equal(enemy.bodySprite.frameIndex, 0)
  assert.equal(enemy.bodySprite.name, 'idle')
  enemy.reset()
  assert.equal(enemy.bodySprite.frameIndex, 0)
  assert.equal(enemy.alive, true)
})

test('the Do Trsta truck and the Kluz truck select the same atlas and clip definitions', async() => {
  const { default: spriteArt } = await import('/core/actor/spriteArt.js')
  const { sprite, width, height } = groundEnemyArt.truck
  assert.equal(sprite.src, spriteArt['opel-blitz'].src)
  assert.equal(sprite.clips, spriteArt['opel-blitz'].clips)
  assert.deepEqual([width, height], [137, 60])
})

test('a tank barrel leads with its mouth: art pointing left is mirrored, never turned upside down', () => {
  const projection = sideProjection({ pxPerMeter: 22, groundY: 300 })
  for (const [kind, yaw, facing, flips] of [['partisan', 0, 1, []], ['german', Math.PI, -1, [['scale', -1, 1]]]]) {
    const tank = new Tank({ kind: tankKinds[kind], yaw, x: 20, clock: new GameClock() })
    const view = new TankSprite(tank, { art: vehicleArt.partisanTank, barrel: { src: 'barrel.png', facing }, projection })
    loadAtlas(view.barrel, 194, 28)
    const calls = []
    const ctx = { save() {}, restore() {}, translate() {},
      drawImage: (image, x) => calls.push(['draw', Math.sign(x)]),
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
