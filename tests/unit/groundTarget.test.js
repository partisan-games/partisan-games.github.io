import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let GroundTarget, kinds
const canvasContext = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {}, imageSmoothingEnabled: true }

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => canvasContext)
  ;({ default: GroundTarget } = await import('/core/actor/GroundTarget.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
})

const place = { camera: { cameraX: 0, cameraY: 0 }, groundY: 500, x: 200 }

test('enemy atlas loading keeps each former collider and the ground position', () => {
  for (const kind of Object.values(kinds)) {
    const target = new GroundTarget({ ...kind, ...place })
    const expected = kind.size.map(value => value * .75)
    loadAtlas(target, kind.art.frame.width * 4, kind.art.frame.height * Object.keys(kind.art.clips).length)
    assert.deepEqual([target.width, target.height], expected)
    assert.equal(target.y + target.height / 2, place.groundY)
    assert.equal(target.animation.width, kind.art.frame.width, 'the frame is one cell, not the entire atlas')
    target.update(.3)
    assert.equal(target.x, place.x, 'animation does not move the target')
    assert.deepEqual([target.width, target.height], expected)
  }
})

test('drawing selects the action cell, keeps the ground anchor and mirrors the soldier', t => {
  const soldier = new GroundTarget({ ...kinds.soldier, ...place })
  loadAtlas(soldier, 512, 768)
  const draws = [], scales = []
  t.mock.method(canvasContext, 'drawImage', (...args) => draws.push(args))
  t.mock.method(canvasContext, 'scale', (...args) => scales.push(args))
  soldier.play('fire')
  soldier.animationElapsed = soldier.animationTime * .6
  soldier.render()
  assert.deepEqual(draws[0].slice(1, 5), [256, 128, 128, 128])
  assert.deepEqual(scales, [[-1, 1]])
  const destination = draws[0].slice(5)
  assert.ok(Math.abs(destination[1] + soldier.art.anchor.y * destination[3] / 128 - soldier.height / 2) < 1e-9)
  soldier.die()
  soldier.update(10)
  soldier.render()
  assert.deepEqual(draws[1].slice(1, 5), [384, 256, 128, 128], 'the completed fall draws its last cell')
})

test('a destroyed vehicle stops its engine animation and keeps its fire', () => {
  const truck = new GroundTarget({ ...kinds.truck, ...place })
  loadAtlas(truck, 1280, 320)
  truck.update(.2)
  truck.die()
  let flameUpdates = 0
  truck.flame = { update: () => flameUpdates++ }
  const elapsed = truck.animationElapsed
  truck.update(1)
  assert.equal(truck.animationElapsed, elapsed)
  assert.equal(truck.visible, true)
  assert.equal(truck.burning, true)
  assert.equal(flameUpdates, 1)
})
