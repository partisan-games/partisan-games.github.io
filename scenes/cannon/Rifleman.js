import * as THREE from 'three'
import { loadedModel } from '/core3d/assets/models.js'

export const rifleModel = { file: 'weapon/rifle.fbx', scale: 1.25, angle: Math.PI }

// Anchors in the prepared prop's bounding box. The front hand can slide along the fore-end.
const mounts = {
  'weapon/rifle.fbx': { length: 1.04, grip: [.68, .50, .22], fore: [.56, .72, .40], tip: [.13, .78, 1] },
  'weapon/rifle-berthier/model.fbx': { length: 1.09, grip: [.57, .533, .275], fore: [.67, .767, .50], tip: [.53, .89, 1] },
  'weapon/mg-42/lowpoly.fbx': { length: 1.19, grip: [.50, .545, .233], fore: [.51, .707, .47], tip: [.50, .76, 1] },
  'weapon/machine-gun/model.fbx': { length: .66, grip: [.50, .66, .36], fore: [.50, .80, .60], tip: [.50, .88, 1] },
}
const up = new THREE.Vector3(0, 1, 0), origin = new THREE.Vector3()

export default class Rifleman {
  constructor(figure, fireClip, weapon = rifleModel) {
    this.mixer = new THREE.AnimationMixer(figure)
    this.fire = this.mixer.clipAction(fireClip)
    this.fire.setLoop(THREE.LoopOnce, 1)
    this.fire.clampWhenFinished = true
    this.fire.play()
    this.fire.paused = true
    this.mixer.update(0)

    const prop = loadedModel(weapon).clone()
    const bounds = new THREE.Box3().setFromObject(prop)
    const size = bounds.getSize(new THREE.Vector3())
    const mount = mounts[weapon.file]
    const anchor = a => new THREE.Vector3().fromArray(a).multiply(size).add(bounds.min)
    const grip = anchor(mount.grip)
    this.rifle = new THREE.Group()
    prop.position.sub(grip)
    this.rifle.add(prop)
    this.muzzle = new THREE.Object3D()
    this.muzzle.position.copy(anchor(mount.tip)).sub(grip)
    this.rifle.add(this.muzzle)
    this.right = figure.getObjectByName('mixamorigRightHand')
    const left = figure.getObjectByName('mixamorigLeftHand')
    this.rightThumb = figure.getObjectByName('mixamorigRightHandThumb1') ?? this.right
    this.rightIndex = figure.getObjectByName('mixamorigRightHandIndex1') ?? this.right
    this.leftThumb = figure.getObjectByName('mixamorigLeftHandThumb1') ?? left
    this.leftIndex = figure.getObjectByName('mixamorigLeftHandIndex1') ?? left
    this.right.add(this.rifle)
    this.propScale = mount.length / size.z
    this.fore = anchor(mount.fore).sub(grip)
    this.rail = this.muzzle.position.clone().sub(this.fore).normalize()
    this.rightPosition = new THREE.Vector3()
    this.leftPosition = new THREE.Vector3()
    this.fingerPosition = new THREE.Vector3()
    this.support = new THREE.Vector3()
    this.frame = new THREE.Matrix4()
    this.orientation = new THREE.Quaternion()
    this.parentRotation = new THREE.Quaternion()
    this.rifle.scale.setScalar(this.propScale / this.right.getWorldScale(new THREE.Vector3()).x)
    this.fitHands()
    this.wait = 1
    this.shots = 0
  }

  fitHands() {
    this.rightThumb.getWorldPosition(this.rightPosition)
    this.rightIndex.getWorldPosition(this.fingerPosition)
    this.rightPosition.lerp(this.fingerPosition, .5)
    this.leftThumb.getWorldPosition(this.leftPosition)
    this.leftIndex.getWorldPosition(this.fingerPosition)
    this.leftPosition.lerp(this.fingerPosition, .5)
    const span = this.leftPosition.distanceTo(this.rightPosition) / this.propScale
    const along = this.fore.dot(this.rail)
    const perpendicularSq = this.fore.lengthSq() - along * along
    const slide = Math.sqrt(Math.max(0, span * span - perpendicularSq)) - along
    this.support.copy(this.fore).addScaledVector(this.rail, slide)
    // Map the grip-to-support line onto the animated hands while keeping the sights uppermost.
    this.orientation.setFromRotationMatrix(this.frame.lookAt(this.support, origin, up)).invert()
    this.rifle.position.copy(this.rightPosition)
    this.right.worldToLocal(this.rifle.position)
    this.rifle.quaternion.setFromRotationMatrix(this.frame.lookAt(this.leftPosition, this.rightPosition, up))
      .multiply(this.orientation).premultiply(this.right.getWorldQuaternion(this.parentRotation).invert())
  }

  update(dt, mesh, posts) {
    if (!posts.length) return null
    const post = posts[this.shots % posts.length]
    const offset = mesh.position
    mesh.rotation.y = Math.atan2(offset.x - post.position.x, offset.z - post.position.z)
    this.mixer.update(dt)
    this.wait -= dt
    if (this.wait > 0) {
      this.fitHands()
      return null
    }
    this.fire.reset().play()
    this.mixer.update(0)
    this.fitHands()
    this.wait = 2 + Math.random()
    this.shots++
    return { from: this.muzzle.getWorldPosition(new THREE.Vector3()), post }
  }
}
