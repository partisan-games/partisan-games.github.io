import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { poseSurrender, surrenderArms } from '/core3d/actor/characters/surrenderPose.js'

/** A Mixamo-named figure with both arms hanging down at its sides. */
function figure() {
  const mesh = new THREE.Group()
  for (const [side, x] of [['Left', .2], ['Right', -.2]]) {
    const upper = Object.assign(new THREE.Bone(), { name: `mixamorig${side}Arm` })
    const forearm = Object.assign(new THREE.Bone(), { name: `mixamorig${side}ForeArm` })
    const hand = Object.assign(new THREE.Bone(), { name: `mixamorig${side}Hand` })
    upper.position.set(x, 1.4, 0)
    forearm.position.set(0, -.3, 0)
    hand.position.set(0, -.25, 0)
    mesh.add(upper)
    upper.add(forearm)
    forearm.add(hand)
  }
  return mesh
}

test('a surrendering figure raises both hands above its shoulders, each on its own side, whichever way it faces', () => {
  for (const facing of [0, Math.PI / 2, Math.PI]) {
    const mesh = figure()
    mesh.rotation.y = facing
    poseSurrender(mesh, mesh, surrenderArms(mesh))
    for (const { side, upper, forearm, hand } of surrenderArms(mesh)) {
      const shoulder = upper.getWorldPosition(new THREE.Vector3())
      const elbow = forearm.getWorldPosition(new THREE.Vector3())
      const palm = hand.getWorldPosition(new THREE.Vector3())
      assert.ok(elbow.y > shoulder.y + .25 && palm.y > elbow.y + .2)
      const outward = mesh.worldToLocal(palm.clone()).x * side
      assert.ok(outward > .2, 'the hand stays on its own side of the body')
    }
  }
})
