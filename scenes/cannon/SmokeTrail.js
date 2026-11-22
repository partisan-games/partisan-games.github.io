import * as THREE from 'three'
import { assets } from '/config.js'

const trail = { life: 1.2, startSize: .25, endSize: .9, opacity: .55 }

/** Dust puffs where machine-gun rounds land. */
export default class SmokeTrail {
  constructor(scene) {
    this.scene = scene
    this.texture = new THREE.TextureLoader().load(`${assets.textures}particles/smoke.png`)
    this.puffs = []
  }

  puff(point) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texture, color: 0xb8b8b0, transparent: true, depthWrite: false }))
    sprite.position.copy(point)
    sprite.userData.age = 0
    this.scene.add(sprite)
    this.puffs.push(sprite)
    this.age(sprite, 0)
  }

  update(dt) {
    this.puffs.forEach(sprite => this.age(sprite, dt))
    this.puffs.filter(sprite => sprite.userData.age >= trail.life).forEach(sprite => this.remove(sprite))
  }

  age(sprite, dt) {
    sprite.userData.age += dt
    const done = Math.min(1, sprite.userData.age / trail.life)
    sprite.scale.setScalar(trail.startSize + (trail.endSize - trail.startSize) * done)
    sprite.material.opacity = trail.opacity * (1 - done)
  }

  remove(sprite) {
    sprite.removeFromParent()
    sprite.material.dispose()
    this.puffs.splice(this.puffs.indexOf(sprite), 1)
  }

  end() {
    [...this.puffs].forEach(sprite => this.remove(sprite))
    this.texture.dispose()
  }
}
