import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Body from '/core/gameplay/bodies/Body.js'
import { requestModels } from '/core3d/assets/models.js'
import CoverSoldierModel, { far, models } from '/core3d/actor/soldiers/CoverSoldierModel.js'

/** The model's files load from disk, its pictures as blank ones. */
function modelFiles(t) {
  t.mock.method(THREE.TextureLoader.prototype, 'load', (url, onLoad) => {
    const texture = new THREE.Texture({ width: 64, height: 64 })
    queueMicrotask(() => onLoad?.(texture))
    return texture
  })
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(decodeURI(url.slice(1)))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
}

const run = (body, view, seconds, dt = 1 / 30) => {
  for (let t = 0; t < seconds; t += dt) {
    body.update(dt)
    view.update(dt)
  }
}

test('the 3D soldier runs to cover facing his way, crouches there, rises to fire at his target and falls where shot', async t => {
  modelFiles(t)
  await requestModels(models)
  const body = new CoverSoldier({ y: .9 })
  const view = new CoverSoldierModel(body, { front: { x: 2, z: 10 } })
  assert.equal(view.clip, 'aim')
  body.moveTo({ x: 2, z: 0, cover: 1.2 })
  run(body, view, .1)
  assert.equal(view.clip, 'run')
  assert.ok(Math.abs(view.yaw) < 1e-9, 'he faces where he runs')
  run(body, view, 1)
  assert.equal(view.clip, 'crouch')
  assert.ok(Math.abs(view.yaw + Math.PI / 2) < .1, 'in cover he faces his front')
  const target = new Body({ x: 2, z: -10 })
  body.fireAt(target)
  view.update(0)
  assert.equal(view.clip, 'aim')
  assert.ok(Math.abs(view.yaw - Math.PI / 2) < .1, 'he faces his target')
  run(body, view, trench.aimTime + .1)
  assert.equal(view.clip, 'fire')
  body.takeHit(body.health.maximum)
  view.update(0)
  assert.equal(view.clip, 'death')
})

test('a soldier far from the viewer casts no shadow and moves his bones less often, and a fallen one lies still', async t => {
  modelFiles(t)
  await requestModels(models)
  const viewer = { x: 0, z: 0 }
  const body = new CoverSoldier({ x: far.distance + 10, y: .9 })
  const view = new CoverSoldierModel(body, { viewer })
  const shadows = () => {
    const casting = []
    view.mesh.traverse(part => part.isMesh && casting.push(part.castShadow))
    return casting
  }
  const updates = t.mock.method(view.anim, 'update')
  for (let frame = 0; frame < far.frames * 4; frame++) view.update(1 / 30)
  assert.ok(shadows().every(cast => !cast))
  assert.equal(updates.mock.callCount(), 4)
  viewer.x = body.x
  run(body, view, 1 / 30)
  assert.ok(shadows().every(Boolean))
  body.takeHit(body.health.maximum)
  run(body, view, 5)
  const still = updates.mock.callCount()
  run(body, view, 1)
  assert.equal(updates.mock.callCount(), still)
})
