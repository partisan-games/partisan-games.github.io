import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createPageElements } from './helpers/dom.js'

test('a German gun shows no fireball before its first shell bursts, and one where it does', async() => {
  createPageElements()
  const { default: EnemyGunModel } = await import('/core3d/actor/artillery/EnemyGunModel.js')
  const gun = { yaw: 0, alive: true, dead: false, state: 'attack', shotsFired: 0, blasts: 0, hitsTaken: 0,
    lastBlast: new THREE.Vector3(0, 1, 30) }
  const model = new EnemyGunModel(gun, { visual: new THREE.Object3D(), wreck: new THREE.Object3D() })
  model.update(1 / 30, 0)
  assert.equal(model.explosion.mesh.visible, false, 'nothing bursts at the start')
  Object.assign(gun, { shotsFired: 1, blasts: 1 })
  model.update(1 / 30, 0)
  assert.equal(model.explosion.mesh.visible, true, 'the first burst shows it')
})
