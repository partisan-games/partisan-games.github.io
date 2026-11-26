import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { Texture } from 'three'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import CoverSoldierSprite, { coverSoldierArt } from '/core3d/actor/soldiers/CoverSoldierSprite.js'
import ParachutistSprite, { parachutistArt } from '/core3d/actor/soldiers/ParachutistSprite.js'
import Parachutist from '/core/gameplay/bodies/characters/Parachutist.js'
import Body from '/core/gameplay/bodies/Body.js'

/** The size of a lossless WebP picture, from its header. */
const webpSize = file => {
  const bytes = readFileSync(`assets/images/${file}`)
  const bits = bytes.readUInt32LE(21)
  return { width: (bits & 0x3fff) + 1, height: (bits >> 14 & 0x3fff) + 1 }
}

const textures = () => ({ whole: new Texture(webpSize(coverSoldierArt.whole)), upper: new Texture(webpSize(coverSoldierArt.upper)) })

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

test('standing in the open he is drawn as tall as the body that takes the hits', () => {
  const body = new CoverSoldier({ y: .9 })
  const view = new CoverSoldierSprite(body, textures())
  // in its picture the standing pose is 180 px of the frame's height
  const standing = view.whole.scale.y * 180 / textures().whole.image.height
  assert.ok(Math.abs(standing - body.size.height) < .01, `${standing} m`)
})

test('a paratrooper shows his canopy only in the air', () => {
  const body = new Parachutist({ y: 10 })
  const size = webpSize(parachutistArt.picture)
  const view = new ParachutistSprite(body, { texture: new Texture(size) })
  assert.equal(view.mesh.visible, true)
  assert.equal(view.mesh.center.y, 0)
  assert.equal(view.mesh.position.y, body.feet)
  assert.ok(Math.abs(view.mesh.scale.y * 180 / size.height - body.size.height) < 1e-6)
  run(body, view, 5)
  assert.equal(body.landed, true)
  assert.equal(view.mesh.visible, false)
})
