import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import CoverSoldier from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import Body from '/core/gameplay/bodies/Body.js'
import { requestModels } from '/core3d/assets/models.js'
import CoverSoldierModel, { far, flash, models } from '/core3d/actor/soldiers/CoverSoldierModel.js'

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

/** The flash's picture: four frames of 48 px in a row. */
const flashPicture = () => new THREE.Texture({ width: 192, height: 48 })

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
  const view = new CoverSoldierModel(body, { flashPicture: flashPicture(), front: { x: 2, z: 10 } })
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
  body.shotsFired++
  view.update(1 / 30)
  assert.equal(view.flash.visible, true, 'his shot flashes')
  const muzzle = view.muzzle.getWorldPosition(new THREE.Vector3())
  assert.ok(view.flash.getWorldPosition(new THREE.Vector3()).distanceTo(muzzle) < 1e-6, 'at his muzzle')
  assert.ok(muzzle.y > 1 && muzzle.y < 1.8, `the muzzle is at his shoulders, ${muzzle.y.toFixed(2)} m up`)
  body.ceaseFire()
  run(body, view, flash.seconds + .05)
  assert.equal(view.flash.visible, false, 'only for a moment')
  body.fireAt(target)
  run(body, view, trench.aimTime + .1)
  body.takeHit(body.health.maximum)
  view.update(0)
  assert.equal(view.clip, 'death')
})

test('a soldier far from the viewer casts no shadow and moves his bones less often, and a fallen one lies still', async t => {
  modelFiles(t)
  await requestModels(models)
  const viewer = { x: 0, z: 0 }
  const body = new CoverSoldier({ x: far.distance + 10, y: .9 })
  const view = new CoverSoldierModel(body, { flashPicture: flashPicture(), viewer })
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
