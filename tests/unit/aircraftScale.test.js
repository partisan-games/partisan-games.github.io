import { test } from 'node:test'
import assert from 'node:assert/strict'
import FighterBomber from '/core/gameplay/bodies/aircraft/FighterBomber.js'
import GameClock from '/core/runtime/GameClock.js'
import { fighterBomberPlanes } from '/core/actor/aircraft/fighterBomberPlanes.js'
import { createPageElements } from './helpers/dom.js'

test('the new Vis projection preserves steering, bullet speed and gun spacing in pixels', () => {
  const make = pixels => new FighterBomber({ clock: new GameClock(), distanceScale: 10 / pixels })
  const old = make(10), current = make(14)
  old.steer(1, -1, .1)
  current.steer(1, -1, .1)
  assert.ok(Math.abs(old.vx * 10 - current.vx * 14) < 1e-9)
  old.fireLevel = current.fireLevel = 1
  old.shoot()
  current.shoot()
  for (let i = 0; i < 2; i++) {
    const a = old.bullets.projectiles[i], b = current.bullets.projectiles[i]
    assert.ok(Math.abs(a.vz * 10 - b.vz * 14) < 1e-9)
    assert.ok(Math.abs(a.x * 10 - b.x * 14) < 1e-9)
  }
})

test('top view and projectile contact use wingspan across and fuselage length along the heading', async() => {
  createPageElements()
  const { default: FighterBomberSprite } = await import('/core/actor/aircraft/FighterBomberSprite.js')
  const { topProjection } = await import('/core/actor/projection.js')
  const plane = fighterBomberPlanes[0]
  const body = new FighterBomber({ size: plane.size, clock: new GameClock() })
  const view = new FighterBomberSprite(body, { src: plane.image, projection: topProjection({ pxPerMeter: 40 }) })
  assert.equal(view.width, plane.size.width * 40)
  assert.equal(view.height, plane.size.length * 40)
  assert.notEqual(body.hitTime({ x: 5, y: 0, z: -1 }, { x: 5, y: 0, z: 1 }), null, 'a bullet crosses the wing')
  assert.equal(body.hitTime({ x: -1, y: 0, z: 5 }, { x: 1, y: 0, z: 5 }), null, 'past the tail')
  view.setAircraft(fighterBomberPlanes[1].image)
  assert.equal(view.propellers.art.id, 'hurricane')
})

test('the repacked side aircraft and half-track cover both physical dimensions at natural scale', async() => {
  const { actorArt } = await import('/core/actor/reinforcementArt.js')
  const { scout } = await import('/core/gameplay/bodies/aircraft/Scout.js')
  const { levelBomber } = await import('/core/gameplay/bodies/aircraft/LevelBomber.js')
  const { gunCarrierKinds } = await import('/core/gameplay/bodies/vehicles/GunCarrier.js')
  for (const [id, size] of [['he111', levelBomber.size], ['storch', scout.size], ['sdkfz251', gunCarrierKinds.halftrack.size]]) {
    const [left, top, right, bottom] = actorArt[id].bounds
    assert.ok(right - left >= size.length * 40, id + ' length')
    assert.ok(bottom - top >= size.height * 40, id + ' height')
  }
})
