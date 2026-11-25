import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import WarplaneModel from '/core3d/actor/aircraft/WarplaneModel.js'
import Warplane from '/core/gameplay/bodies/aircraft/Warplane.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import GameClock from '/core/runtime/GameClock.js'
import { createPageElements } from './helpers/dom.js'

test('a plane shot down bursts where it hits the ground, its wreck burns as it moves, and the ground keeps a scorch', async t => {
  createPageElements()
  const scene = new THREE.Scene()
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial())
  scene.add(ground)
  const { impactAt } = worldQueries([ground])
  const body = new Warplane({ clock: new GameClock(), size: { length: 9, height: 3, width: 10 }, y: 30 })
  const model = new WarplaneModel(body, { mesh: new THREE.Group(), impactAt })
  scene.add(model.mesh)
  const emit = t.mock.fn()
  model.audioScene = { emit }
  t.mock.method(model.crashSound, 'play', () => {})
  // the model loads its particles on its own
  await import('/core3d/Particles.js')
  await new Promise(setImmediate)

  body.setState('dead')
  model.update(1 / 30, 0)
  assert.equal(emit.mock.callCount(), 0, 'nothing bursts while it falls')
  body.y = 0
  model.update(1 / 30, 0)
  model.update(1 / 30, 0)
  assert.equal(emit.mock.callCount(), 1, 'one blast where it hits the ground')
  assert.equal(model.crashSound.play.mock.callCount(), 1)
  assert.equal(model.explosion.mesh.parent, scene)
  assert.equal(model.fire.mesh.parent, scene)
  assert.equal(model.scorch.parent, ground, 'the scorch moves with the ground')

  body.z += 20
  model.update(1 / 30, 0)
  assert.equal(model.fire.mesh.position.z, body.z, 'the fire stays on the wreck')

  model.end()
  assert.equal(model.fire.mesh.parent, null)
  assert.equal(model.scorch.parent, null)
})
