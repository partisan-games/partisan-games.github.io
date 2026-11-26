import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Vector3 } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import Firearm, { firearms } from '/core/gameplay/Firearm.js'
import { requestModels } from '/core3d/assets/models.js'
import { description as rifle } from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import { description as machineGun } from '/core3d/actor/derived/ww2/SovietPartisan.js'
import WeaponView from '/scenes/drvar/WeaponView.js'

function visibleShape(model, camera) {
  let top = -1, vertices = 0
  const point = new Vector3()
  model.traverse(part => {
    if (!part.isMesh) return
    assert.ok(!part.isSkinnedMesh, 'the view contains only the weapon model')
    const { position } = part.geometry.attributes
    for (let i = 0; i < position.count; i++) {
      part.getVertexPosition(i, point).applyMatrix4(part.matrixWorld)
      if (point.z >= -camera.near) continue
      point.project(camera)
      if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) continue
      vertices++
      top = Math.max(top, point.y)
    }
  })
  return { top, vertices }
}

test('the selected Drvar weapon is visible below the crosshair on desktop and portrait screens', async t => {
  t.mock.method(FBXLoader.prototype, 'loadAsync', async url => {
    const bytes = await readFile(decodeURI(url.slice(1)))
    return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  })
  const descriptions = { rifle: rifle.twoHandedWeapon, machineGun: machineGun.twoHandedWeapon }
  await requestModels(Object.values(descriptions))
  const player = { shotsFired: 0, vx: 0, vz: 0 }
  let firearm = new Firearm(firearms.rifle)
  const view = new WeaponView(player, () => firearm, descriptions)
  const renderer = {
    autoClear: true,
    info: { autoReset: true },
    clearDepth() {},
    render(scene, camera) {
      assert.equal(this.autoClear, false)
      assert.equal(this.info.autoReset, false)
      scene.updateMatrixWorld(true)
      camera.updateMatrixWorld(true)
    },
  }
  const assertAim = () => {
    const bore = new Vector3(0, 0, -1).applyQuaternion(view.pose.quaternion)
    const distance = (-12 - view.pose.position.z) / bore.z
    const projected = view.pose.position.clone().addScaledVector(bore, distance).project(view.camera)
    assert.ok(Math.hypot(projected.x, projected.y) < 1e-6, 'the bore points toward the centre of the crosshair')
  }
  for (const [kind, settings] of Object.entries(firearms)) {
    firearm = new Firearm(settings)
    view.update(0)
    const model = view.models[kind]
    assert.equal(model.visible, true)
    assert.equal(Object.values(view.models).filter(mesh => mesh.visible).length, 1)
    for (const aspect of [16 / 9, .55]) {
      view.render(renderer, aspect)
      const { top, vertices } = visibleShape(model, view.camera)
      assert.ok(vertices > 60, `${vertices} visible vertices for ${kind}`)
      assert.ok(top > -.86 && top < -.57, `only the barrel tip fits at the bottom for ${kind}: ${top}`)
      assertAim()
    }
  }
  assert.equal(renderer.autoClear, true)
  assert.equal(renderer.info.autoReset, true)
  const resting = view.pose.position.clone()
  player.shotsFired++
  view.update(0)
  assert.ok(view.pose.position.z > resting.z)
  assertAim()
  view.update(1)
  firearm.rounds = 0
  firearm.wait = firearm.reload / 2
  view.update(0)
  assert.ok(view.pose.position.y < resting.y)
  assertAim()
})
