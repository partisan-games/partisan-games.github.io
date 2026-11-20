import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'

let WoundedSoldier, Patrol
const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }
before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  WoundedSoldier = (await import('/core/actor/derived/WoundedSoldier.js')).default
  Patrol = (await import('/core/actor/soldiers/Patrol.js')).default
})

test('the wounded soldier keeps his collider, crawls only while displaced, and holds the pose through zero time', t => {
  const soldier = new WoundedSoldier(300, 300)
  t.after(() => soldier.end())
  loadAtlas(soldier, 276, 54)
  soldier.update(.31)
  assert.equal(soldier.bodySprite.moving, false)
  soldier.dx = 10
  soldier.update(.31)
  assert.equal(soldier.bodySprite.moving, true)
  assert.equal(soldier.bodySprite.frameIndex, 1)
  const elapsed = soldier.bodySprite.elapsed
  soldier.update(0)
  assert.equal(soldier.bodySprite.elapsed, elapsed)
  assert.deepEqual([soldier.width, soldier.height], [69, 27])
  soldier.stop()
  soldier.update(.1)
  assert.equal(soldier.bodySprite.moving, false)
})

for (const [src, height] of [['armies/nemci-patrola.gif', 80], ['armies/talijani-patrola.gif', 78]])
  test(`${src} walks as the same whole group, holds pause and immediately switches to accepted halt pose`, t => {
    const patrol = new Patrol(src)
    t.after(() => patrol.end())
    loadAtlas(patrol, 284, height*2)
    patrol.setPosition(300, 300)
    patrol.update(.21)
    assert.ok(patrol.x > 300)
    assert.equal(patrol.bodySprite.frameIndex, 1)
    const phase = patrol.bodySprite.elapsed
    patrol.update(0)
    assert.equal(patrol.bodySprite.elapsed, phase)
    patrol.setState('halt')
    assert.equal(patrol.bodySprite.moving, false)
    const x = patrol.x, y = patrol.y
    patrol.update(1)
    assert.deepEqual([patrol.x, patrol.y], [x, y])
    assert.deepEqual([patrol.width, patrol.height], [71, height])
    const draws = []
    t.mock.method(context, 'drawImage', (...args) => draws.push(args))
    patrol.render()
    assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, 71, height])
    patrol.setState('search')
    patrol.update(.21)
    assert.equal(patrol.bodySprite.moving, true)
  })

test('the actual second-stage transition switches the patrol image, frame geometry and animation together', async t => {
  const RanjenikScene = (await import('/scenes/ranjenik/Main.js')).default
  const patrol = new Patrol()
  t.after(() => patrol.end())
  loadAtlas(patrol, 284, 160)
  patrol.update(.21)
  const scene = { background: { image: {} }, patrola: patrol, player: { x: 900, audioRevision: 0 },
    width: 800, height: 600, scena: 0 }
  RanjenikScene.prototype.promeniScenu.call(scene)
  assert.equal(scene.scena, 1)
  assert.equal(scene.player.x, 10)
  assert.ok(patrol.image.src.endsWith('/armies/game-ready/vojnici/italian-patrol-sprites.png'))
  assert.deepEqual([patrol.width, patrol.height], [71, 78])
  assert.equal(patrol.state, 'search')
  loadAtlas(patrol, 284, 156)
  assert.deepEqual([patrol.width, patrol.height], [71, 78], 'the existing onload closure cannot restore German dimensions')
  patrol.update(.21)
  const draws = []
  t.mock.method(context, 'drawImage', (...args) => draws.push(args))
  patrol.render()
  assert.deepEqual(draws.at(-1).slice(1, 5), [71, 78, 71, 78])
})
