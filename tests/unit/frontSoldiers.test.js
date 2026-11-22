import { test } from 'node:test'
import assert from 'node:assert/strict'
import TrenchSoldier, { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Occupier, { occupier } from '/core/gameplay/bodies/soldiers/Occupier.js'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

const live = (body, seconds) => {
  for (let i = 0; i < Math.round(seconds * 30); i++) body.update(1 / 30)
}

test('a trench soldier hides until set to rise, aims for his while, then fires until he is hit', () => {
  const soldier = new TrenchSoldier()
  assert.deepEqual(soldier.states, ['hidden', 'aim', 'fire', 'fall'])
  live(soldier, 5)
  assert.equal(soldier.state, 'hidden')
  assert.equal(soldier.standing, false, 'hidden, he cannot be hit')
  soldier.setState('aim')
  assert.equal(soldier.standing, true)
  live(soldier, trench.aimTime - .1)
  assert.equal(soldier.state, 'aim')
  live(soldier, .2)
  assert.equal(soldier.state, 'fire')
  live(soldier, 5)
  assert.equal(soldier.state, 'fire', 'he keeps firing')
})

test('a hit trench soldier falls back into his trench and hides again, out of reach while falling', () => {
  const soldier = new TrenchSoldier()
  soldier.setState('fall')
  assert.equal(soldier.standing, false)
  live(soldier, trench.fallTime + .1)
  assert.equal(soldier.state, 'hidden')
})

test('an occupier walks the way he faces, stands to fire, and stays where he falls', () => {
  const right = new Occupier({ x: 0 }), left = new Occupier({ x: 50, yaw: Math.PI })
  assert.deepEqual(right.states, ['walk', 'fire', 'dead'])
  live(right, 1); live(left, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9)
  assert.ok(Math.abs(left.x - (50 - occupier.speed)) < 1e-9)
  right.setState('fire')
  live(right, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9, 'he stands while firing')
  right.setState('dead')
  assert.equal(right.alive, false)
  live(right, 1)
  assert.ok(Math.abs(right.x - occupier.speed) < 1e-9)
})

test('front-facing soldier views load their own poses and draw without owning a trench', async t => {
  createPageElements()
  const draws = []
  const context = { globalAlpha: 1, save() {}, restore() {}, translate() {}, rotate() {},
    drawImage: (...args) => draws.push(args) }
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  const { default: TrenchSoldierSprite } = await import('/core/actor/soldiers/TrenchSoldierSprite.js')
  const { sideProjection } = await import('/core/actor/projection.js')
  for (const faction of ['nemci', 'cetnici']) for (const scale of [1, .5]) {
    const body = new TrenchSoldier({ x: 10 })
    const view = new TrenchSoldierSprite(body, { faction, scale, projection: sideProjection({ pxPerMeter: 22, groundY: 500 }) })
    assert.ok(view.image.src.endsWith(`${faction}-spreda.png`))
    loadAtlas(view, 192, 288)
    await view.imageLoaded
    assert.equal(view.frames.length, 4, 'all poses are ready when the image loader finishes')
    assert.equal(view.frames[0].length, 3)
    assert.deepEqual([view.width, view.height], [68 * scale, 76 * scale])
    assert.equal(view.y, 500 - 24 * scale)
    draws.length = 0
    view.render(context)
    assert.equal(draws.length, 0, 'hidden shows neither a soldier nor a trench')
    for (const state of ['aim', 'fire', 'fall']) {
      body.setState(state)
      body.update(.2)
      view.update(.2)
      view.render(context)
    }
    assert.ok(draws.length > 0)
    assert.ok(draws.every(([image]) => image instanceof HTMLCanvasElement), 'only isolated soldier poses are drawn')
  }
})
