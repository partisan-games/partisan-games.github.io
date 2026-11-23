import * as THREE from 'three'
import { assets } from '/config.js'

export const impactLife = { dust: .45, chips: .65, smoke: 1.3, fragments: 1.1 }

function points(count, material) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3))
  const mesh = new THREE.Points(geometry, material)
  mesh.visible = false
  return { mesh, velocity: new Float32Array(count * 3), age: 0 }
}

/** A bounded hit effect: a dust puff and metal flecks, with smoke and a few pieces only on heavier damage. */
export default class GunImpactCloud {
  constructor() {
    this.mesh = new THREE.Group()
    this.mesh.visible = false
    this.texture = new THREE.TextureLoader().load(assets.textures + 'particles/smoke.png')
    const haze = (color, size) => new THREE.PointsMaterial({ map: this.texture, color, size,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending })
    this.dust = points(10, haze(0x9d9580, .13))
    this.smoke = points(7, haze(0x62635d, .18))
    this.chips = points(12, new THREE.PointsMaterial({ color: 0x9b9e98, size: .018,
      transparent: true, depthWrite: false }))
    this.mesh.add(this.dust.mesh, this.smoke.mesh, this.chips.mesh)
    this.fragments = new THREE.InstancedMesh(new THREE.BoxGeometry(.035, .014, .065),
      new THREE.MeshStandardMaterial({ color: 0x5c5b50, metalness: .35, roughness: .85, transparent: true }), 5)
    this.fragments.visible = false
    this.fragments.frustumCulled = false
    this.mesh.add(this.fragments)
    this.fragmentMotion = []
    this.fragmentAge = 0
    this.piece = new THREE.Object3D()
  }

  start(point, health) {
    this.mesh.position.copy(point)
    this.mesh.visible = true
    const burst = (layer, speed, rise, active = true) => {
      layer.age = 0
      layer.mesh.visible = active
      layer.mesh.material.opacity = 1
      const { position } = layer.mesh.geometry.attributes
      position.array.fill(0)
      position.needsUpdate = true
      for (let i = 0; i < position.count; i++) {
        layer.velocity[i * 3] = (Math.random() - .5) * speed
        layer.velocity[i * 3 + 1] = rise * (.5 + Math.random() * .5)
        layer.velocity[i * 3 + 2] = (Math.random() - .65) * speed
      }
    }
    burst(this.dust, .45, .18)
    burst(this.chips, 1.5, 1.4)
    burst(this.smoke, .25, .40, health <= .5)
    this.fragmentAge = 0
    this.fragments.count = health <= 0 ? 5 : 3
    this.fragments.visible = health <= .25
    this.fragments.material.opacity = 1
    this.fragmentMotion = this.fragments.visible ? Array.from({ length: this.fragments.count }, (_, i) => ({
      velocity: new THREE.Vector3((Math.random() - .5) * 1.6, .8 + Math.random() * .8, -.5 - Math.random() * .7),
      spin: new THREE.Vector3(3 + i, 5 - i * .4, 2 + i * .6),
    })) : []
    this.update(0)
  }

  updateLayer(layer, dt, life, { gravity = 0, size, opacity }) {
    if (!layer.mesh.visible) return
    layer.age += dt
    const t = layer.age, fraction = t / life
    layer.mesh.visible = fraction < 1
    layer.mesh.material.opacity = opacity * Math.max(0, 1 - fraction)
    layer.mesh.material.size = size * (gravity ? 1 : 1 + fraction * 1.5)
    const positions = layer.mesh.geometry.attributes.position
    for (let i = 0; i < positions.count; i++) positions.setXYZ(i,
      layer.velocity[i * 3] * t,
      Math.max(.01 - this.mesh.position.y, layer.velocity[i * 3 + 1] * t - gravity * t * t / 2),
      layer.velocity[i * 3 + 2] * t)
    positions.needsUpdate = true
    layer.mesh.geometry.computeBoundingSphere()
  }

  update(dt) {
    if (!this.mesh.visible) return
    this.updateLayer(this.dust, dt, impactLife.dust, { size: .13, opacity: .26 })
    this.updateLayer(this.chips, dt, impactLife.chips, { gravity: 9.82, size: .018, opacity: .9 })
    this.updateLayer(this.smoke, dt, impactLife.smoke, { size: .18, opacity: .30 })
    if (this.fragments.visible) {
      this.fragmentAge += dt
      const t = this.fragmentAge
      this.fragments.visible = t < impactLife.fragments
      this.fragments.material.opacity = Math.min(1, Math.max(0, (impactLife.fragments - t) / .25))
      this.fragmentMotion.forEach(({ velocity, spin }, i) => {
        this.piece.position.copy(velocity).multiplyScalar(t)
        this.piece.position.y = Math.max(.045 - this.mesh.position.y, this.piece.position.y - 4.91 * t * t)
        this.piece.rotation.set(spin.x * t, spin.y * t, spin.z * t)
        this.piece.updateMatrix()
        this.fragments.setMatrixAt(i, this.piece.matrix)
      })
      this.fragments.instanceMatrix.needsUpdate = true
    }
    this.mesh.visible = [this.dust, this.chips, this.smoke].some(layer => layer.mesh.visible) || this.fragments.visible
  }

  end() {
    for (const mesh of [this.dust.mesh, this.chips.mesh, this.smoke.mesh, this.fragments]) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
    this.fragments.dispose()
    this.texture.dispose()
    this.mesh.removeFromParent()
  }
}
