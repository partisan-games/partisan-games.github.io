import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'
import { readFile } from 'node:fs/promises'

const context = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage() {} }
let AircraftPropellers, DiveBomber, DiveBomberSprite, sideProjection, topProjection, AttackPlane, attackPlaneKinds,
  AttackPlaneSprite, GameSession, Renderer2D

before(async() => {
  createPageElements()
  mock.method(HTMLCanvasElement.prototype, 'getContext', () => context)
  AircraftPropellers = (await import('/core/actor/aircraft/AircraftPropellers.js')).default
  DiveBomber = (await import('/core/gameplay/bodies/aircraft/DiveBomber.js')).default
  DiveBomberSprite = (await import('/core/actor/aircraft/DiveBomberSprite.js')).default
  ;({ sideProjection, topProjection } = await import('/core/actor/projection.js'))
  ;({ default: AttackPlane, attackPlaneKinds } = await import('/core/gameplay/bodies/aircraft/AttackPlane.js'))
  AttackPlaneSprite = (await import('/core/actor/aircraft/AttackPlaneSprite.js')).default
  GameSession = (await import('/core/runtime/GameSession.js')).default
  Renderer2D = (await import('/core/Renderer2D.js')).default
  new Renderer2D({ canvas: document.createElement('canvas') })
})

test('blade phases advance with game time and hold for stopped engines and zero time', () => {
  const propellers = new AircraftPropellers('game-ready/avioni/ju87.png')
  propellers.update(.031)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(0)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(1, false)
  assert.equal(propellers.frameIndex, 1)
  propellers.update(.03)
  assert.equal(propellers.frameIndex, 2)
})

test('redrawn Bf 109 keeps its propeller on the registered hub and switches to aligned damage', async t => {
  const { default: Fighter } = await import('/core/gameplay/bodies/aircraft/Fighter.js')
  const { default: FighterSprite } = await import('/core/actor/aircraft/FighterSprite.js')
  const record = JSON.parse(await readFile(new URL('../../assets/images/sources/plan-ideas-art/bf109-redraw.json', import.meta.url), 'utf8'))
  const session = new GameSession()
  t.after(() => session.dispose())
  for (const yaw of [0, Math.PI]) {
    const body = new Fighter({ x: 10, y: 12, yaw, clock: session.clock })
    const view = new FighterSprite(body, { projection: sideProjection({ pxPerMeter: 30.8, groundY: 700 }) })
    loadAtlas(view, ...record.frame)
    loadAtlas(view.damageArt, ...record.frame)
    const size = [view.width, view.height]
    view.update(.01)
    const scale = view.width / record.frame[0]
    const dx = (record.propellerHub[0] - record.frame[0] / 2) * scale * view.flipY
    const dy = (record.propellerHub[1] - record.frame[1] / 2) * scale
    assert.ok(Math.abs(view.propeller.x - view.x - dx * Math.cos(view.angle) + dy * Math.sin(view.angle)) < 1e-8)
    assert.ok(Math.abs(view.propeller.y - view.y - dx * Math.sin(view.angle) - dy * Math.cos(view.angle)) < 1e-8)
    body.takeHit(body.health.maximum * .6)
    view.update(0)
    assert.equal(view.picture, view.damageArt.image)
    assert.deepEqual([view.width, view.height], size)
  }
})

test('both twin-engine hubs draw from the same atlas phase in the unchanged body coordinates', () => {
  for (const [src, size, hubs] of [
    ['bf-110', [354, 265], [[126.5, 29], [226.5, 29]]],
    ['he-111', [820, 591], [[310, 28], [497, 28]]],
  ]) {
    const propellers = new AircraftPropellers(`armies/nemci/avioni/${src}-odozgo.png`)
    Object.defineProperties(propellers.image, { complete: { value: true }, naturalWidth: { value: 256 } })
    propellers.update(.031)
    const draws = []
    propellers.renderLocal({ drawImage: (...args) => draws.push(args) }, { width: size[0] / 2, height: size[1] / 2 })
    assert.equal(draws.length, 2)
    for (const [i, draw] of draws.entries()) {
      assert.deepEqual(draw.slice(1, 5), [64, 0, 64, 12])
      assert.equal(draw[5] + draw[7] / 2, (hubs[i][0] - size[0] / 2) / 2)
      assert.equal(draw[6] + draw[8] / 2, (hubs[i][1] - size[1] / 2) / 2)
    }
  }
})

test('the Ju 87 of Kluz and Do Trsta and the planes of Vis turn their propellers without enlarging their size', t => {
  const session = new GameSession()
  session.start()
  t.after(() => session.dispose())
  const camera = { cameraX: 0, cameraY: 0 }
  const body = new DiveBomber({ x: 14, y: 27, yaw: Math.PI })
  const bomber = new DiveBomberSprite(body, { projection: sideProjection({ pxPerMeter: 30.8, groundY: 700 }), camera })
  loadAtlas(bomber, 200, 74)
  bomber.update(.031)
  assert.equal(bomber.propellers.frameIndex, 1)
  assert.deepEqual([bomber.width, bomber.height].map(Math.round), [250, 92])
  const pictures = { fighter: 'bf-109', heavy: 'bf-110', boss: 'he-111' }
  for (const [type, picture] of Object.entries(pictures)) {
    const body = new AttackPlane({ kind: attackPlaneKinds[type], clock: session.clock })
    const plane = new AttackPlaneSprite(body, { src: `armies/nemci/avioni/${picture}-odozgo.png`, projection: topProjection({ pxPerMeter: 10 }) })
    assert.ok(plane.propellers.art)
    const size = [plane.width, plane.height]
    plane.update(.031)
    assert.equal(plane.propellers.frameIndex, 1)
    assert.deepEqual([plane.width, plane.height], size)
    body.setState('dead')
    plane.update(.04)
    assert.equal(plane.propellers.frameIndex, 1, 'a dead engine holds its blades')
  }
})
