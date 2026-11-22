import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

const context = { save() {}, restore() {}, translate() {}, rotate() {}, drawImage() {} }
let BulletSprite, sideProjection

before(async() => {
  createPageElements()
  BulletSprite = (await import('/core/actor/projectiles/BulletSprite.js')).default
  ;({ sideProjection } = await import('/core/actor/projection.js'))
})

test('a round points the way it moves on the screen, as a camera following its shooter sees it', () => {
  // it flies down and on over the ground, as one fired back and down from a fast plane does
  const round = { x: 0, y: 10, z: 0, yaw: 0, pitch: -Math.PI / 4, state: 'flight' }
  const sprite = new BulletSprite(round, sideProjection({ pxPerMeter: 10, groundY: 500 }))
  const live = camera => {
    sprite.update()
    sprite.render(context, camera)
  }
  live({ x: 0, y: 0 })
  assert.ok(Math.abs(sprite.angle - Math.PI / 4) < 1e-9, 'first the way it flies over the ground')
  Object.assign(round, { x: 1, y: 9 })
  // the camera keeps up with the plane, faster than the round goes on
  live({ x: 20, y: 0 })
  assert.ok(Math.abs(sprite.angle - 3 * Math.PI / 4) < 1e-9, 'then back and down, as it moves on the screen')
  round.state = 'idle'
  live({ x: 20, y: 0 })
  Object.assign(round, { x: 5, y: 9, state: 'flight' })
  live({ x: 40, y: 0 })
  assert.ok(Math.abs(sprite.angle - Math.PI / 4) < 1e-9, 'a round fired again starts anew')
})
