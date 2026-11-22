import * as THREE from 'three'
import { Ammo } from '/core3d/physics/index.js'

/** Mortar holds the masonry through repeated hits; only a breached section becomes loose rubble. */
export default class FortPhysics {
  constructor({ parts, physics }) {
    this.physics = physics
    this.parts = parts
    this.fixed = new Set(parts)
    this.above = new Map(parts.map(part => [part, []]))
    this.supports = new Map(parts.map(part => [part, []]))
    this.damage = new Map(parts.map(part => [part, 0]))
    this.inertia = physics.own(new Ammo.btVector3(0, 0, 0))
    const bounds = parts.map(part => new THREE.Box3().setFromObject(part))
    for (let lower = 0; lower < parts.length; lower++)
      for (let upper = 0; upper < parts.length; upper++) {
        const a = bounds[lower], b = bounds[upper]
        if (Math.abs(a.max.y - b.min.y) > .01) continue
        if (Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) <= .01) continue
        if (Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) <= .01) continue
        this.above.get(parts[lower]).push(parts[upper])
        this.supports.get(parts[upper]).push(parts[lower])
      }
    parts.forEach(part => physics.add(part, 0, .8))
  }

  hit(point, radius) {
    const pending = []
    for (const part of this.fixed) {
      const distance = part.position.distanceTo(point)
      if (distance >= radius) continue
      const damage = this.damage.get(part) + 1
      this.damage.set(part, damage)
      if (damage >= 4) pending.push(part)
    }
    for (const part of pending) {
      if (!this.fixed.delete(part)) continue
      // Masonry can bridge a small gap; it falls once at least half its supports are lost.
      for (const upper of this.above.get(part))
        if (this.supports.get(upper).filter(support => this.fixed.has(support)).length <= this.supports.get(upper).length / 2)
          pending.push(upper)
      if (this.fracture(part)) continue
      const { body, mass } = part.userData
      // Reinsert the same body so Bullet replaces its static collision filter with a dynamic one.
      this.physics.remove(part)
      body.getCollisionShape().calculateLocalInertia(mass, this.inertia)
      body.setMassProps(mass, this.inertia)
      body.setCollisionFlags(body.getCollisionFlags() & ~1)
      body.updateInertiaTensor()
      body.setActivationState(4)
      this.physics.add(part)
    }
  }

  fracture(part) {
    const definitions = part.userData.fragments
    if (!definitions) return false
    const mass = part.userData.mass / definitions.length
    const fragments = definitions.map(({ size, offset }) => {
      const fragment = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), part.material)
      fragment.position.copy(offset).applyQuaternion(part.quaternion).add(part.position)
      fragment.quaternion.copy(part.quaternion)
      fragment.castShadow = fragment.receiveShadow = true
      Object.assign(fragment.userData, { home: fragment.position.clone(), mass })
      return fragment
    })
    this.physics.remove(part)
    const index = this.parts.indexOf(part)
    this.parts.splice(index, 1, ...fragments)
    for (const list of part.userData.sectionLists ?? []) {
      const sectionIndex = list.indexOf(part)
      list.splice(sectionIndex, 1, ...fragments)
    }
    fragments.forEach(fragment => this.physics.add(fragment, mass, .8))
    return true
  }
}
