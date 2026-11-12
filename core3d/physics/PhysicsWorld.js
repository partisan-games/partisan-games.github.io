import { Ammo, createPhysicsWorld, createRigidBody, updateMesh } from '/core3d/physics/index.js'
import NativeAllocations from '/core3d/physics/NativeAllocations.js'

/**
 * The Ammo world of one game. It owns every native object made through it (`own`), and dispose()
 * takes the actions and bodies out of the world and then frees them all, once. Ammo runs the steps:
 * a fixed native step of 1/60 s, at most `maxSteps` per update (A4-01).
 */
export default class PhysicsWorld {
  #natives = new NativeAllocations()
  #bodies = new Set()
  #actions = new Set()

  constructor({ scene, maxSteps = 10 } = {}) {
    this.scene = scene
    this.maxSteps = maxSteps
    this.rigidBodies = []
    this.own = this.#natives.own
    this.physicsWorld = createPhysicsWorld({ own: this.own })
  }

  /** Native objects this world will free; for checks after leaving a game. */
  get nativeCount() {
    return this.#natives.size
  }

  add(mesh, mass, friction) {
    if (!mesh.userData.body)
      mesh.userData.body = createRigidBody({ own: this.own, mesh, mass, friction })

    this.addBody(mesh.userData.body)
    this.rigidBodies.push(mesh)
    if (this.scene) this.scene.add(mesh)
  }

  addBody(body) {
    this.physicsWorld.addRigidBody(body)
    this.#bodies.add(body)
  }

  /** A vehicle or other action that the world runs every step. */
  addAction(action) {
    this.physicsWorld.addAction(action)
    this.#actions.add(action)
  }

  remove(mesh) {
    if (!this.rigidBodies.includes(mesh)) return
    this.physicsWorld.removeRigidBody(mesh.userData.body)
    this.#bodies.delete(mesh.userData.body)
    this.rigidBodies.splice(this.rigidBodies.indexOf(mesh), 1)
    if (this.scene) this.scene.remove(mesh)
  }

  update(dt) {
    this.physicsWorld.stepSimulation(dt, this.maxSteps)
    this.rigidBodies.forEach(updateMesh)
  }

  dispose() {
    this.#actions.forEach(action => this.physicsWorld.removeAction(action))
    this.#bodies.forEach(body => this.physicsWorld.removeRigidBody(body))
    this.#actions.clear()
    this.#bodies.clear()
    this.rigidBodies.forEach(mesh => delete mesh.userData.body)
    this.rigidBodies = []
    this.#natives.dispose(object => Ammo.destroy(object))
  }
}
