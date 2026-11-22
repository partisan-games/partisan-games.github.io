import * as THREE from 'three'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'

import { rifleModel } from '/core3d/actor/derived/ww2/partisanLooks.js'

export default class Rifleman {
  constructor(figure, fireClip, weapon = rifleModel) {
    this.mixer = new THREE.AnimationMixer(figure)
    this.fire = this.mixer.clipAction(fireClip)
    this.fire.setLoop(THREE.LoopOnce, 1)
    this.fire.clampWhenFinished = true
    this.fire.play()
    this.fire.paused = true
    this.mixer.update(0)

    this.grip = new TwoHandedGrip(figure, weapon)
    this.muzzle = this.grip.muzzle
    this.wait = 1
    this.shots = 0
  }

  fitHands() {
    this.grip.fitHands()
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
