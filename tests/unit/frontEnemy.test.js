import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'
import World from '/core/World.js'
import Occupier, { occupier } from '/core/gameplay/bodies/soldiers/Occupier.js'
import kinds from '/core/gameplay/frontEnemyKinds.js'

let FrontEnemySprite, sideProjection
before(async() => {
  createPageElements()
  ;({ default: FrontEnemySprite } = await import('/core/actor/soldiers/FrontEnemySprite.js'))
  ;({ sideProjection } = await import('/core/actor/projection.js'))
})

function fixture(kind, yaw = 0) {
  const body = new Occupier({ x: 5, y: .9, yaw, shotInterval: kinds[kind].shotInterval })
  const projection = sideProjection({ pxPerMeter: 100, groundY: 600 })
  const view = new FrontEnemySprite(body, { kind, projection })
  const { width, height } = view.clip.art
  loadAtlas(view, width * 4, height * 6)
  loadAtlas(view.clip, width * 4, height * 6)
  Object.defineProperties(view.flash, { naturalWidth: { value: 19 }, naturalHeight: { value: 21 } })
  const world = new World()
  world.add(body, view)
  const draws = [], translations = []
  const ctx = { save() {}, restore() {}, scale() {},
    translate: (...args) => translations.push(args), drawImage: (...args) => draws.push(args) }
  const render = () => {
    draws.length = 0
    translations.length = 0
    view.render(ctx)
    return draws
  }
  return { body, view, world, render, translations }
}

test('frontal riflemen fire at their cadence and stop when killed', () => {
  for (const kind of Object.keys(kinds)) {
    const body = new Occupier({ shotInterval: kinds[kind].shotInterval })
    body.setState('attack')
    body.update(.5)
    assert.equal(body.shotsFired, 1)
    body.update(.7)
    assert.equal(body.shotsFired, 2)
    body.takeHit(1)
    const fired = body.shotsFired
    body.setState('attack')
    body.update(10)
    assert.equal(body.shotsFired, fired)
  }
})

test('all frontal roles use actual left/right walks, freeze hits in pause and hold the final corpse', t => {
  for (const kind of Object.keys(kinds)) for (const yaw of [0, Math.PI]) {
    const { body, view, world, render, translations } = fixture(kind, yaw)
    t.after(() => world.end())
    const { width, height } = view.clip.art
    assert.equal(view.clip.seconds('attack'), body.shotInterval, 'the firing animation follows actual shots')
    const collider = { ...body.size }
    body.setState('move')
    world.update(.2)
    let draws = render()
    assert.equal(draws[0][2], (yaw === 0 ? 2 : 1) * height)
    body.setState('attack')
    world.update(0)
    draws = render()
    assert.equal(draws[0][2], 3 * height)
    assert.ok(draws[1][0] === view.flash)
    const { muzzle, anchor } = view.clip.art
    const scale = view.height / view.clip.art.standingPixels
    const [x, y] = translations[0]
    assert.ok(Math.abs(draws[1][1] + draws[1][3] / 2 - (x + (muzzle[0] - anchor.x) * scale)) < 1e-8)
    assert.ok(Math.abs(draws[1][2] + draws[1][4] / 2 - (y + (muzzle[1] - anchor.y) * scale)) < 1e-8)
    body.takeHit(.1)
    world.update(0)
    draws = render()
    assert.equal(draws.length, 1, 'hit hides the shooting picture and flash')
    assert.equal(draws[0][2], 4 * height)
    world.update(.1)
    const paused = render()[0].slice(1)
    world.update(0)
    assert.deepEqual(render()[0].slice(1), paused)
    world.update(.23)
    assert.equal(render()[0][2], 3 * height, 'attack resumes after the finite hit')
    body.takeHit(1)
    world.update(2)
    draws = render()
    assert.equal(draws.length, 1)
    assert.deepEqual(draws[0].slice(1, 5), [3 * width, 5 * height, width, height])
    world.update(20)
    assert.deepEqual(render()[0].slice(1, 5), [3 * width, 5 * height, width, height])
    assert.equal(translations[0][1], view.y + view.height / 2, 'the anchor is on the physical ground')
    assert.deepEqual(body.size, collider)
  }
})

test('both retained frontal actors preserve physical figure and muzzle-flash size', t => {
  const rifleman = fixture('rifleman'), sentry = fixture('sentry')
  const flashes = []
  for (const actor of [rifleman, sentry]) {
    t.after(() => actor.world.end())
    actor.body.setState('attack')
    actor.world.update(0)
    flashes.push(actor.render()[1].slice(3))
  }
  assert.equal(rifleman.view.height, sentry.view.height)
  assert.deepEqual(flashes[0], flashes[1], 'source pixel density must not shrink the firing effect')
  assert.deepEqual(rifleman.body.size, sentry.body.size)
})

test('frontal walkers step as far as they go, so their feet do not slide', t => {
  for (const kind of Object.keys(kinds)) {
    const { body, view, world, render } = fixture(kind)
    t.after(() => world.end())
    body.setState('move')
    world.update(kinds[kind].stride / occupier.speed / 4 + .005)
    assert.equal(render()[0][1], view.clip.art.width, 'a quarter of the drawn stride walked shows the second walk frame')
  }
})
