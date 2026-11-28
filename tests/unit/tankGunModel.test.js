import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'

register('./setup/ammo-node.js', import.meta.url)

test('the meter shows the charge, then the flash, trail and impact play in order', async t => {
  createPageElements()
  const { default: TankGunModel } = await import('/core3d/physics/TankGunModel.js')
  const from = new THREE.Vector3(0, 1, 2), to = new THREE.Vector3(0, 1, 62)
  const gun = { tank: { mesh: new THREE.Object3D() }, power: 70, lastShot: null, blasts: 0, lastScar: null, lastBlast: to }
  const model = new TankGunModel(gun)
  t.after(() => model.end())
  const sounds = []
  model.audioScene = { emit: name => sounds.push(name) }
  model.update(0)
  assert.equal(model.power.element.value, .5)
  gun.power = 20
  gun.lastShot = { from, to, way: new THREE.Vector3(0, 0, 1), age: 0, duration: .25 }
  model.update(0)
  assert.equal(model.power.element.value, 0)
  assert.ok(model.flash.visible && model.flash.position.distanceTo(from) < .2)
  assert.ok(model.smoke.visible)
  assert.equal(model.shell.visible, false)
  assert.equal(model.fireball.visible, false)

  gun.lastShot.age = .125
  model.update(.125)
  assert.ok(model.shell.visible && model.shell.position.z === 32)
  assert.ok(model.trail.scale.z > 0 && model.trail.scale.z < 1)
  assert.equal(model.flash.visible, false)
  assert.deepEqual(sounds, [])

  gun.lastShot.age = .25
  gun.blasts++
  model.update(.125)
  assert.equal(model.shell.visible, false)
  assert.ok(model.fireball.visible && model.fireball.position.distanceTo(to) < .3)
  assert.ok(model.dust[0].visible)
  gun.lastShot.age += 2
  model.update(2)
  assert.equal(model.smoke.visible, false)
  assert.ok(model.dust.every(cloud => !cloud.visible))
  assert.deepEqual(sounds, ['explosion.mp3'])
})
