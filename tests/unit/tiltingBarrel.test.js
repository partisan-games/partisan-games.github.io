import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import Character from '/core/gameplay/bodies/characters/Character.js'
import TiltingBarrel from '/core3d/actor/characters/TiltingBarrel.js'
import { description } from '/core3d/actor/derived/Cannon.js'

const near = (a, b) => Math.abs(a - b) < 1e-9

test('the gun raises and lowers its aim only within its range, and aims the way its barrel points', () => {
  const gun = new Character(description.body)
  const { min, max } = description.body.pitchRange
  gun.look(0, 10)
  assert.equal(gun.pitch, max)
  assert.ok(near(gun.aim.y, Math.sin(max)))
  gun.look(0, -10)
  assert.equal(gun.pitch, min)
  assert.ok(near(gun.aim.y, Math.sin(min)))
})

test('the barrel turns about its middle to the body\'s aim, under a turned model part, and the carriage stays', () => {
  const mesh = new THREE.Group(), part = new THREE.Group()
  part.rotation.x = -Math.PI / 2 // as an FBX file turns its parts
  const tube = new THREE.Mesh(new THREE.BoxGeometry(.2, 2, .2).translate(0, 0, 1)), carriage = new THREE.Mesh(new THREE.BoxGeometry())
  tube.name = 'tube'
  part.add(tube, carriage)
  mesh.add(part)
  mesh.position.set(5, 0, 3)
  mesh.rotation.y = 1
  const body = { pitch: .1 }
  const barrel = new TiltingBarrel(body, mesh, { parts: ['tube'], drawnAt: .1 })
  /** Where a point of the tube, in its own frame, stands in the model's frame. */
  const inModel = point => mesh.worldToLocal(tube.localToWorld(point.clone()))
  const muzzle = new THREE.Vector3(0, 1, 1), middle = new THREE.Vector3(0, 0, 1)
  mesh.updateMatrixWorld(true)
  const drawn = inModel(muzzle)
  assert.ok(Math.abs(drawn.z + 1) < 1e-6 && Math.abs(drawn.y - 1) < 1e-6, 'drawn as it was, the muzzle ahead, along -z')
  body.pitch = .1 + Math.PI / 2
  barrel.update()
  mesh.updateMatrixWorld(true)
  const raised = inModel(muzzle)
  assert.ok(Math.abs(raised.y - 2) < 1e-6 && Math.abs(raised.z) < 1e-6, 'the muzzle up, over the middle')
  assert.ok(inModel(middle).distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-6, 'the middle stays')
  assert.equal(carriage.parent, part)
})
