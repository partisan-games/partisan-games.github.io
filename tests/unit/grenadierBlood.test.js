import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalImageSource } from '/core/actor/imageSources.js'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let Grenadier, GrenadierSprite, World, Renderer2D, topProjection
before(async() => {
  createPageElements()
  ;[Grenadier, GrenadierSprite, World, Renderer2D] = await Promise.all([
    import('/core/gameplay/bodies/soldiers/Grenadier.js'), import('/core/actor/soldiers/GrenadierSprite.js'),
    import('/core/World.js'), import('/core/Renderer2D.js'),
  ]).then(modules => modules.map(module => module.default))
  ;({ topProjection } = await import('/core/actor/projection.js'))
})

function scene() {
  const body = new Grenadier({ x: 2.5, z: 3 })
  const view = new GrenadierSprite(body, { projection: topProjection({ pxPerMeter: 40 }) })
  loadAtlas(view, 528, 216)
  loadAtlas(view.blood, 512, 64)
  loadAtlas(view.blood.stain, 96, 48)
  const world = new World()
  world.add(body, view)
  world.update(0, 0)
  return { body, view, world }
}

function live(world, seconds, fps) {
  for (let i = 0; i < Math.round(seconds * fps); i++) world.update(1 / fps, 0)
}

test('a nonlethal hit keeps the actual grenade pose before and after release, both directions', t => {
  for (const facing of [-1, 1]) for (const time of [null, .2, .5]) {
    const { body, view, world } = scene()
    t.after(() => world.end())
    body.facing = facing
    Object.defineProperties(view.throwImage, { naturalWidth: { value: 528 }, naturalHeight: { value: 72 } })
    if (time !== null) {
      body.shoot()
      world.update(time)
    }
    const expected = view.frame
    const flying = body.grenade.active
    body.takeHit(.1)
    world.update(0)
    view.update(.08)
    const draws = []
    view.render({ save() {}, restore() {}, translate() {}, scale() {}, drawImage: (...args) => draws.push(args) })
    assert.equal(draws[0][0], expected.image, 'the hit draws the real idle/throw image, including its equipment')
    assert.deepEqual(draws[0].slice(1, 5), [expected.x, expected.y, expected.width, expected.height])
    assert.equal(body.grenade.active, flying)
    assert.equal(view.hitReaction, undefined, 'the replacement atlas with the missing grenade is not loaded')
  }
})

test('the throw sounds once when the grenade actually leaves the hand', t => {
  const { body, view, world } = scene()
  const cue = t.mock.method(view.throwSound, 'play', () => {})
  body.shoot()
  live(world, .3, 30)
  assert.equal(cue.mock.callCount(), 0)
  live(world, .6, 30)
  assert.equal(cue.mock.callCount(), 1)
})

test('the original release hand and flying grenade coincide in both directions', t => {
  for (const facing of [-1, 1]) {
    const { body, view, world } = scene()
    body.facing = facing
    Object.defineProperties(view.throwImage, { naturalWidth: { value: 528 }, naturalHeight: { value: 72 } })
    let released
    const launch = body.grenade.launch.bind(body.grenade)
    t.mock.method(body.grenade, 'launch', (point, velocity) => {
      released = { ...point }
      launch(point, velocity)
    })
    body.shoot()
    world.update(.399, 0)
    assert.equal(released, undefined)
    assert.equal(view.frame.x, 66 * 3, 'the last held-grenade frame precedes release')
    world.update(.001, 0)
    assert.ok(released)
    assert.equal(view.frame.x, 66 * 4, 'release selects the empty-hand frame')
    const drawn = { x: view.x + facing * (48 / 66 - .5) * view.width,
      y: view.y + (3 / 72 - .5) * view.height }
    const ground = view.projection.point(released)
    assert.ok(Math.hypot(drawn.x - ground.x, drawn.y - (ground.y - view.projection.length(released.y))) < 1e-8)
    const flight = view.children.find(child => child.grenade === body.grenade)
    assert.ok(canonicalImageSource(flight.image.src).endsWith('/bombas-throw-right-sprites.png'), 'flight uses the original drawn grenade')
  }
})

test('grenadier blood descends during the fall and leaves only a stain on the ground', t => {
  const { body, view, world } = scene()
  const hit = t.mock.method(view.hitSound, 'play', () => {})
  assert.equal(view.blood.visible, false)
  assert.equal(view.blood.stain.visible, false)
  body.takeHit(1)
  world.update(0, 0)
  const startY = view.blood.y
  assert.equal(view.blood.visible, true)
  world.update(.15, 0)
  assert.ok(view.blood.y > startY, 'the airborne burst moves down, rather than holding its hit position')
  world.update(.2, 0)
  assert.equal(view.blood.stain.visible, true, 'a stain appears as the first drops meet the ground')
  const paused = [view.blood.y, view.blood.age, view.blood.stain.scaleX]
  world.update(0, 0)
  assert.deepEqual([view.blood.y, view.blood.age, view.blood.stain.scaleX], paused)
  world.update(.35, 0)
  assert.equal(view.blood.visible, false, 'no frozen airborne last frame remains after the body falls')
  assert.equal(view.blood.stain.visible, true)
  const stain = { x: view.blood.stain.x, y: view.blood.stain.y, scale: view.blood.stain.scaleY }
  assert.ok(Math.abs(stain.y + view.blood.stain.height / 3 - (view.y + view.height / 2)) < 1e-9,
    'the pool ground anchor rests on the same contact plane as the fallen body')
  world.update(3, 0)
  assert.deepEqual({ x: view.blood.stain.x, y: view.blood.stain.y, scale: view.blood.stain.scaleY }, stain)
  assert.equal(hit.mock.callCount(), 1, 'death and the blood effect are not restarted')
})

test('blood settles identically at 30/60/120 Hz or after one long step, and a fresh actor has no stain', () => {
  const settled = []
  for (const fps of [30, 60, 120, null]) {
    const { body, view, world } = scene()
    body.takeHit(1)
    world.update(0, 0)
    if (fps) live(world, .8, fps)
    else world.update(.8, 0)
    assert.equal(view.blood.visible, false)
    assert.equal(view.blood.stain.visible, true)
    assert.equal(view.clipTime, .6)
    settled.push([view.blood.stain.x, view.blood.stain.y, view.blood.stain.scaleX, view.blood.stain.scaleY])
  }
  for (const result of settled) assert.deepEqual(result, settled[0])
  const fresh = scene()
  assert.equal(fresh.view.blood.visible, false)
  assert.equal(fresh.view.blood.stain.visible, false)
})

test('the renderer clips falling drops at the contact plane and draws the pool underneath the body', () => {
  const { body, view, world } = scene()
  body.takeHit(1)
  world.update(.35, 0)
  const drawn = [], clips = []
  const ctx = {
    save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, beginPath() {}, clip() {},
    rect: (...args) => clips.push(args), drawImage: image => drawn.push(image),
  }
  const renderer = new Renderer2D({ canvas: { width: 800, height: 600, getContext: () => ctx } })
  renderer.drawObjects(world.objects)
  assert.deepEqual(drawn, [view.blood.stain.image, view.image, view.blood.image])
  assert.equal(clips.length, 1)
  const [, top, , height] = clips[0]
  assert.ok(top + height <= view.y + view.height / 2 + 1e-9, 'no drops are drawn below the ground')
  world.update(1, 0)
  drawn.length = 0
  renderer.drawObjects(world.objects)
  assert.deepEqual(drawn, [view.blood.stain.image, view.image], 'the settled state contains no suspended drops')
  const exposedEdge = (view.blood.stain.x - view.x) * body.facing + view.blood.stain.width / 2
  assert.ok(exposedEdge > view.width / 2,
    'the pool reaches beyond the head side of the corpse instead of being hidden underneath it')
  world.update(30, 0)
  drawn.length = 0
  renderer.drawObjects(world.objects)
  assert.deepEqual(drawn, [view.blood.stain.image, view.image], 'the ground stain still renders long after death')
})
