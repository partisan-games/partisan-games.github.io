import * as THREE from 'three'

const worldPosition = new THREE.Vector3()
const childPosition = new THREE.Vector3()
const currentDirection = new THREE.Vector3()
const worldRotation = new THREE.Quaternion()
const parentRotation = new THREE.Quaternion()
const facingRotation = new THREE.Quaternion()
const correction = new THREE.Quaternion()
const direction = new THREE.Vector3()

function pointBone(bone, child, target) {
  bone.getWorldPosition(worldPosition)
  child.getWorldPosition(childPosition)
  currentDirection.subVectors(childPosition, worldPosition).normalize()
  correction.setFromUnitVectors(currentDirection, target)
  bone.getWorldQuaternion(worldRotation).premultiply(correction)
  bone.parent.getWorldQuaternion(parentRotation).invert()
  bone.quaternion.copy(parentRotation.multiply(worldRotation))
  bone.updateWorldMatrix(false, true)
}

/** Raises both hands after the current animation pose has been applied. */
export function poseSurrender(figure, mesh, arms) {
  figure.updateWorldMatrix(true, true)
  const facing = mesh.getWorldQuaternion(facingRotation)
  for (const { side, upper, forearm, hand } of arms) {
    direction.set(side * .23, .97, -.06).normalize().applyQuaternion(facing)
    pointBone(upper, forearm, direction)
    direction.set(side * .12, .99, .03).normalize().applyQuaternion(facing)
    pointBone(forearm, hand, direction)
  }
}

export function surrenderArms(figure) {
  return ['Left', 'Right'].map(side => ({
    side: side === 'Left' ? 1 : -1,
    upper: figure.getObjectByName(`mixamorig${side}Arm`),
    forearm: figure.getObjectByName(`mixamorig${side}ForeArm`),
    hand: figure.getObjectByName(`mixamorig${side}Hand`),
  }))
}
