import { getMesh, putOnSolids, getSize } from '/core3d/helpers.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Health from '/core/gameplay/Health.js'

const owners = new WeakMap()

const getScene = object => {
  if (!object.parent) return null
  if (object.parent.type === 'Scene') return object.parent
  return getScene(object.parent)
}

export default class GameObject {
  #solids = []
  #health
  #damageAmount = 0

  /** Finds the nearest owning object, including for raycast hits on a model's children. */
  static ownerOf(mesh) {
    for (let node = mesh; node; node = node.parent) {
      const owner = owners.get(node)
      if (owner) return owner
    }
    return null
  }

  constructor({ mesh, name, pos, color, solids, scale, rotateY, altitude = 0, energy = 100
  } = {}) {
    if (mesh.userData.animations)
      this.mesh = clone(mesh)
    else
      this.mesh = mesh.clone()

    this.name = name
    this.#health = new Health({ maximum: energy })
    owners.set(this.mesh, this)
    // Legacy attackers and pickups still use userData; accessors keep one authoritative state.
    Object.defineProperties(this.mesh.userData, {
      energy: {
        configurable: true, enumerable: true,
        get: () => this.energy,
        set: value => {
          this.energy = value
        },
      },
      damageAmount: {
        configurable: true, enumerable: true,
        get: () => this.damageAmount,
        set: value => {
          this.damageAmount = value
        },
      },
    })

    if (pos) this.position = pos

    if (solids) putOnSolids(this.mesh, solids, altitude)
    if (solids) this.addSolids(solids)

    if (scale) this.mesh.scale.set(scale, scale, scale)
    if (color != undefined) {
      const colored = getMesh(this.mesh)
      colored.material = colored.material.clone() // a clone shares the model's material; the color is this object's own
      colored.material.color.setHex(color)
    }
    if (rotateY) this.mesh.rotateY(rotateY)

    const { x, y, z } = getSize(this.mesh)
    this.width = x
    this.height = y
    this.depth = z
  }

  /* GETTERS & SETTERS */

  get solids() {
    return this.#solids
  }

  get name() {
    return this.mesh.name
  }

  set name(name) {
    this.mesh.name = name
  }

  get energy() {
    return this.#health.current
  }

  set energy(newEnergy) {
    const amount = Math.max(0, Math.min(this.maxEnergy, newEnergy)) - this.energy
    if (amount < 0) this.#health.damage(-amount)
    else this.#health.heal(amount)
  }

  get health() {
    return this.#health
  }

  get maxEnergy() {
    return this.#health.maximum
  }

  get damageAmount() {
    return this.#damageAmount
  }

  set damageAmount(damageAmount) {
    this.#damageAmount = damageAmount
  }

  get dead() {
    return !this.#health.alive
  }

  get position() {
    return this.mesh.position
  }

  set position(pos) {
    if (Array.isArray(pos))
      this.mesh.position.set(...pos)
    else
      this.mesh.position.set(pos.x, pos.y, pos.z)
  }

  get scene() {
    return getScene(this.mesh)
  }

  get playerMesh() {
    return this.scene?.getObjectByName('player')
  }

  /* UTILS */

  add(obj) {
    this.mesh.add(obj)
  }

  pushToSolids = obj => {
    if (obj !== this.mesh && !this.#solids.includes(obj))
      this.#solids.push(obj)
  }

  /**
   * Add solid objects to collide (terrain, walls, actors, etc.)
   * @param {array of meshes, mesh or meshes} newSolids
   */
  addSolids(...newSolids) {
    newSolids.forEach(newSolid => {
      if (Array.isArray(newSolid)) newSolid.forEach(this.pushToSolids)
      else this.pushToSolids(newSolid)
    })
  }

  distanceTo(mesh) {
    if (!mesh) return Infinity
    return this.position.distanceTo(mesh.position)
  }

  applyDamage() {
    this.energy -= this.damageAmount
    this.damageAmount = 0
  }

  checkHit() {
    if (this.damageAmount) this.applyDamage()
  }

  /* UPDATE */

  update() {
    this.checkHit()
  }
}
