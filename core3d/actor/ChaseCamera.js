import * as THREE from 'three'

const calc = (mesh, pos, rotate) => {
  const cameraPos = new THREE.Vector3(...pos)
  if (rotate) cameraPos.applyQuaternion(mesh.quaternion)
  cameraPos.add(mesh.position)
  return cameraPos
}

const speedFactor = state => {
  if (state === 'jump') return 3
  if (state === 'fall') return 4
  if (state === 'run') return 2
  return 1
}

/**
 * A camera that follows `mesh` from behind, `offset` from it and looking at `lookAt`, both turned with it while it
 * `rotate`s; credit to Simon Dev.
 */
export default class ChaseCamera {
  constructor({ camera, mesh, height = 2, speed = 2,
    offset = [0, height * .95, height * 1.5],
    lookAt = [0, height * .95, 0],
    rotate = true,
  }) {
    Object.assign(this, { mesh, camera, rotate, speed, offset, lookAt })
    this.currentPosition = new THREE.Vector3()
    this.currentLookAt = new THREE.Vector3()
    this.camera.position.copy(calc(mesh, offset, rotate))
    this.camera.lookAt(calc(mesh, lookAt, rotate))
  }

  set height(y) {
    this.offset[1] = y
  }

  set distance(z) {
    this.offset[2] = z
  }

  set near(x) {
    this.camera.near = x
    this.camera.updateProjectionMatrix()
  }

  set far(x) {
    this.camera.far = x
    this.camera.updateProjectionMatrix()
  }

  alignCamera() {
    this.currentPosition = calc(this.mesh, this.offset, this.rotate)
    this.currentLookAt = calc(this.mesh, this.lookAt, this.rotate)

    this.camera.position.copy(this.currentPosition)
    this.camera.lookAt(this.currentLookAt)
  }

  update(delta, stateName) {
    this.currentPosition.copy(this.camera.position)

    const idealPosition = calc(this.mesh, this.offset, this.rotate)
    const idealLookAt = calc(this.mesh, this.lookAt, this.rotate)

    // above 1 the camera would overshoot the target on a long frame and swing back and forth
    const deltaSpeed = Math.min(1, delta * this.speed * speedFactor(stateName))
    this.currentPosition.lerp(idealPosition, deltaSpeed)
    this.currentLookAt.lerp(idealLookAt, deltaSpeed)

    this.camera.position.copy(this.currentPosition)
    this.camera.lookAt(this.currentLookAt)
  }
}
