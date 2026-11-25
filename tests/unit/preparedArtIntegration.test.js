import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let ArtClip, art, Crew, CrewView, Skirmisher, SkirmisherView, Rifleman, RiflemanView, Hummel, VehicleView, Gun, GunView
let sideProjection, spriteArt, Clock
before(async() => {
  createPageElements()
  ;[ArtClip, Crew, CrewView, Skirmisher, SkirmisherView, Rifleman, RiflemanView, Hummel, VehicleView, Gun, GunView, Clock] = await Promise.all([
    import('/core/actor/ArtClip.js'), import('/core/gameplay/bodies/soldiers/CannonCrew.js'), import('/core/actor/soldiers/CannonCrewSprite.js'),
    import('/core/gameplay/bodies/soldiers/Skirmisher.js'), import('/core/actor/soldiers/SkirmisherSprite.js'),
    import('/core/gameplay/bodies/soldiers/Rifleman.js'), import('/core/actor/soldiers/RiflemanSprite.js'),
    import('/core/gameplay/bodies/vehicles/Hummel.js'), import('/core/actor/vehicles/VehicleSprite.js'),
    import('/core/gameplay/bodies/artillery/FieldGun.js'), import('/core/actor/artillery/FieldGunSprite.js'),
    import('/core/runtime/GameClock.js'),
  ]).then(modules => modules.map(module => module.default))
  art = await import('/core/actor/actionArt.js')
  ;({ sideProjection } = await import('/core/actor/projection.js'))
  ;({ default: spriteArt } = await import('/core/actor/spriteArt.js'))
})

const viewOptions = () => ({ projection: sideProjection({ pxPerMeter: 40, groundY: 400 }) })
const context = () => {
  const draws = []
  return { draws, save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
    drawImage: (...args) => draws.push(args) }
}

test('separate clips honour unequal frame times, loops, reverse order and a long final step', () => {
  const clip = new ArtClip(art.hummelFire)
  assert.deepEqual(clip.sample('fire', .039), { row: 0, frame: 0 })
  assert.deepEqual(clip.sample('fire', .04), { row: 0, frame: 1 })
  assert.deepEqual(clip.sample('fire', 30), { row: 0, frame: 5 })
  const walk = new ArtClip(art.partisanMovement)
  assert.deepEqual(walk.sample('walk', .85), { row: 1, frame: 0 })
  assert.deepEqual(walk.sample('standUp', 0, true), { row: 0, frame: 3 })
})

for (const italian of [false, true]) test(`${italian ? 'Italian' : 'partisan'} crew cancels loading and holds its actual fall atlas`, t => {
  const body = new Crew({ x: 5, yaw: italian ? Math.PI : 0 })
  const view = new CrewView(body, { italian, ...viewOptions() })
  loadAtlas(view, 1280, 1280)
  loadAtlas(view.deathArt, 960, 128)
  const stopped = t.mock.method(view.loadSound, 'stop', () => {})
  body.setState('load')
  view.update(.1)
  body.takeHit(100)
  body.update(2)
  view.update(2)
  const ctx = context()
  view.render(ctx)
  assert.equal(ctx.draws.length, 1)
  assert.equal(ctx.draws[0][0], view.deathArt.image)
  assert.deepEqual(ctx.draws[0].slice(1, 5), [800, 0, 160, 128])
  assert.ok(stopped.mock.callCount() > 0)
  body.setState('load')
  assert.equal(body.state, 'dead', 'only a fresh body returns from the terminal pose')
  view.update(0)
  view.render(ctx)
  assert.deepEqual(ctx.draws[1], ctx.draws[0], 'pause and later renders keep the same grounded final frame')
})

test('the partisan rises before walking, kneels before firing, and uses the standing death after walking', () => {
  const body = new Skirmisher({ x: 5 })
  const view = new SkirmisherView(body, viewOptions())
  loadAtlas(view, 1774, 887)
  loadAtlas(view.movementArt, 1280, 640)
  body.setState('move')
  assert.equal(body.state, 'standUp')
  body.update(.3)
  assert.equal(body.x, 5, 'the rise does not slide along the ground')
  body.update(.31)
  assert.equal(body.state, 'move')
  body.update(.2)
  view.update(.2)
  assert.ok(body.x > 5)
  body.setState('attack')
  assert.equal(body.state, 'kneel')
  body.update(.61)
  assert.equal(body.state, 'attack')
  assert.equal(body.standing, false)
  body.setState('move')
  body.update(.61)
  body.takeHit(100)
  body.update(3)
  view.update(3)
  const ctx = context()
  view.render(ctx)
  assert.equal(ctx.draws[0][0], view.movementArt.image)
  assert.deepEqual(ctx.draws[0].slice(1, 5), [800, 480, 160, 160])
  const kneeling = new Skirmisher()
  const kneelingView = new SkirmisherView(kneeling, viewOptions())
  loadAtlas(kneelingView.movementArt, 1280, 640)
  kneeling.takeHit(100)
  kneeling.update(3)
  kneelingView.update(3)
  kneelingView.render(ctx)
  assert.deepEqual(ctx.draws[1].slice(1, 5), [800, 320, 160, 160])
})

test('a rifleman shows the reload during his existing shot cooldown and cannot shoot in an explicit reload', () => {
  const clock = new Clock()
  const body = new Rifleman({ clock, random: () => 0 })
  const view = new RiflemanView(body, { art: spriteArt.rifleman, ...viewOptions() })
  loadAtlas(view, 512, 768)
  loadAtlas(view.reloadArt, 1024, 128)
  body.setState('attack')
  clock.advance(.1)
  body.update(.1)
  view.update(.1)
  clock.advance(.4)
  body.update(.4)
  view.update(.4)
  const ctx = context()
  view.render(ctx)
  assert.equal(body.shotsFired, 1, 'the existing two-second fire rate is unchanged')
  assert.equal(ctx.draws[0][0], view.reloadArt.image)
  body.setState('reload')
  assert.equal(body.shoot(), false)
  body.update(1.4)
  view.update(1.4)
  view.render(ctx)
  assert.equal(ctx.draws.at(-1)[0], view.reloadArt.image)
  assert.equal(ctx.draws.at(-1)[1], 896, 'the final reload phase is sampled at its measured action time')
  body.update(.21)
  assert.equal(body.state, 'idle')
  body.setState('dead')
  view.update(0)
  view.render(ctx)
  assert.equal(ctx.draws.at(-1)[0], view.image, 'death cancels the reload presentation')
  assert.equal(ctx.draws.at(-1)[2], 256)
})

for (const yaw of [0, Math.PI]) test(`Hummel fires a real shell at the drawn muzzle and then returns to idle, yaw ${yaw}`, t => {
  const body = new Hummel({ x: 6, y: 1.68, yaw })
  const options = viewOptions()
  const view = new VehicleView(body, { art: spriteArt.hummel, attack: art.hummelFire, facing: 1, ...options })
  loadAtlas(view, 1312, 336)
  loadAtlas(view.fireArt, 2352, 184)
  const sound = t.mock.method(view.shotSound, 'play', () => {})
  assert.equal(body.shoot(), true)
  assert.equal(body.shoot(), false)
  assert.equal(body.shotsFired, 1)
  assert.equal(body.shells.projectiles.length, 1)
  const point = options.projection.point(body.muzzle)
  const { muzzle, anchor } = art.hummelFire
  assert.ok(Math.abs(point.x - (view.x + body.forward * (muzzle.x - anchor.x) * view.artScale)) < 1e-8)
  assert.ok(Math.abs(point.y - (view.y + view.height / 2 - (anchor.y - muzzle.y) * view.artScale)) < 1e-8)
  view.update(.01)
  const ctx = context()
  view.render(ctx)
  assert.equal(ctx.draws[0][0], view.fireArt.image)
  assert.deepEqual(ctx.draws[0].slice(1, 5), [4, 4, 384, 176], 'recoil starts inside its padded cell')
  view.update(0)
  assert.equal(sound.mock.callCount(), 1)
  body.update(.9)
  view.update(.9)
  assert.equal(body.state, 'idle')
  view.render(ctx)
  assert.equal(ctx.draws.at(-1)[0], view.image)
  assert.deepEqual(ctx.draws.at(-1).slice(1, 5), [4, 4, 320, 160], 'idle uses the hull cell inside its gutter')
  body.takeHit(1000)
  assert.equal(body.shoot(), false)
})

for (const yaw of [0, Math.PI]) test(`BP-42 fires once from the prepared barrel, yaw ${yaw}`, async t => {
  const { default: Train } = await import('/core/gameplay/bodies/vehicles/BP42.js')
  const body = new Train({ x: 10, yaw })
  body.y = body.size.height / 2
  const options = viewOptions()
  const view = new VehicleView(body, { art: spriteArt.bp42, attack: art.bp42Fire, facing: -1, ...options })
  loadAtlas(view, 2304, 512)
  loadAtlas(view.fireArt, 4224, 256)
  t.mock.method(view.shotSound, 'play', () => {})
  body.setState('move')
  body.update(.25)
  body.setState('attack')
  body.setState('attack')
  view.update(0)
  const { x, y } = body.muzzle
  assert.equal(body.shells.projectiles.length, 1)
  assert.equal(body.shells.projectiles[0].x, x)
  assert.equal(body.shells.projectiles[0].y, y)
  assert.equal(body.vx, 0)
  assert.equal(body.shotsFired, 1)
  assert.ok(Math.abs(view.muzzleFlash.x - (view.x + body.forward * 278 * view.artScale)) < 1e-8)
  assert.ok(Math.abs(view.muzzleFlash.y - (view.y + view.height / 2 - 175 * view.artScale)) < 1e-8)
  const flashX = view.muzzleFlash.x
  const flashY = view.muzzleFlash.y
  view.update(.08)
  assert.equal(view.muzzleFlash.x, flashX + 6 * view.artScale * view.flipY)
  view.update(.04)
  assert.equal(view.muzzleFlash.x, flashX - 5 * view.artScale * view.flipY)
  assert.equal(view.muzzleFlash.y, flashY - 4 * view.artScale)
  view.update(.23)
  assert.equal(view.muzzleFlash.visible, false)
  body.update(.8)
  assert.equal(body.state, 'idle')
  body.setState('dead')
  body.setState('move')
  view.update(0)
  assert.equal(body.state, 'dead')
  assert.equal(view.muzzleFlash.visible, false)
})

for (const yaw of [0, Math.PI]) test(`gun carriage keeps the same scale from image load through first update, yaw ${yaw}`, () => {
  for (const order of [['barrel', 'carriage'], ['carriage', 'barrel']]) {
    const body = new Gun({ x: 8, yaw })
    const view = new GunView(body, viewOptions())
    const dimensions = () => [view.carriage.width, view.carriage.height]
    assert.deepEqual(dimensions(), [300, 74.25])
    for (const part of order) {
      if (part === 'barrel') loadAtlas(view, 274, 52)
      else loadAtlas(view.carriage, 400, 99)
      assert.deepEqual(dimensions(), [300, 74.25], `${part} load must not replace projected dimensions with native pixels`)
    }
    view.update(1 / 60)
    assert.deepEqual(dimensions(), [300, 74.25], 'Start must not change the loaded carriage size')
  }
})

for (const yaw of [0, Math.PI]) test(`redrawn gun aligns its projectile and wreck with the art, yaw ${yaw}`, () => {
  const body = new Gun({ x: 8, yaw })
  const options = viewOptions()
  const view = new GunView(body, options)
  loadAtlas(view, 274, 52)
  loadAtlas(view.carriage, 400, 99)
  loadAtlas(view.wreckArt, 500, 260)
  for (const elevation of [.0832, .6032]) {
    body.elevation = elevation
    view.update(0)
    const dx = 173 * .75, dy = -8 * .75 * body.forward
    const muzzle = { x: view.x + dx * Math.cos(view.angle) - dy * Math.sin(view.angle),
      y: view.y + dx * Math.sin(view.angle) + dy * Math.cos(view.angle) }
    const actual = options.projection.point(body.muzzle)
    assert.ok(Math.abs(muzzle.x - actual.x) < 1e-8)
    assert.ok(Math.abs(muzzle.y - actual.y) < 1e-8)
  }
  assert.ok(Math.abs(view.carriage.y + (96 - 49.5) * .75 - 400) < 1e-8)
  body.takeHit(1000)
  view.update(1)
  assert.equal(view.carriage.visible, false)
  const ctx = context()
  view.render(ctx)
  assert.equal(ctx.draws[0][0], view.wreckArt.image)
  assert.ok(Math.abs(options.projection.point(body.carriage).y + (211 - 164.5) * .75 - 400) < 1e-8)
})
