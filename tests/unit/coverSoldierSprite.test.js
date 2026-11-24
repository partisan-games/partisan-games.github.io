import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Texture } from 'three'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import CoverSoldierSprite, { coverSoldierArt } from '/core3d/actor/soldiers/CoverSoldierSprite.js'
import ParachutistSprite from '/core3d/actor/soldiers/ParachutistSprite.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import Body from '/core/gameplay/bodies/Body.js'

const textures = () => ({ whole: new Texture({ width: 1008, height: 124 }), upper: new Texture({ width: 192, height: 288 }) })

const run = (body, view, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) {
    body.update(dt)
    view.update(dt)
  }
}

test('behind cover he is out of sight until he rises, his head just above it', () => {
  const body = new CoverSoldier({ y: .9 })
  const view = new CoverSoldierSprite(body, textures())
  body.moveTo({ x: 1, z: 0, cover: 1.2 })
  run(body, view, 1)
  assert.equal(view.whole.visible, false)
  assert.equal(view.upper.visible, false)
  body.fireAt(new Body())
  view.update(0)
  assert.equal(view.upper.visible, true)
  const head = view.upper.position.y + view.upper.scale.y
  assert.ok(Math.abs(head - (1.2 + coverSoldierArt.headroom)) < 1e-9)
})

test('in the open his whole figure stands on the ground and lies where he falls', () => {
  const body = new CoverSoldier({ y: .9 })
  const view = new CoverSoldierSprite(body, textures())
  assert.equal(view.whole.visible, true)
  assert.equal(view.mesh.position.y, 0)
  body.takeHit(body.health.maximum)
  run(body, view, 1)
  assert.equal(view.wholePose, 2)
})

test('a paratrooper shows his canopy only in the air', () => {
  const body = new Parachutist({ y: 10 })
  const view = new ParachutistSprite(body, { texture: new Texture({ width: 182, height: 268 }) })
  assert.equal(view.mesh.visible, true)
  run(body, view, 5)
  assert.equal(body.landed, true)
  assert.equal(view.mesh.visible, false)
})
