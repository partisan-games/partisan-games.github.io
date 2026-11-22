import { before, test } from 'node:test'
import assert from 'node:assert/strict'
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

test('the throw sounds once when the grenade actually leaves the hand', t => {
  const { body, view, world } = scene()
  const cue = t.mock.method(view.throwSound, 'play', () => {})
  body.shoot()
  live(world, .3, 30)
  assert.equal(cue.mock.callCount(), 0)
  live(world, .6, 30)
  assert.equal(cue.mock.callCount(), 1)
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
