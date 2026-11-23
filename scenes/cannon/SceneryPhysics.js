import * as THREE from 'three'
import { Ammo, createRigidBody, updateMesh } from '/core3d/physics/index.js'

/** Loose props share the fort's physics world. Batched scenery keeps its instanced renderer. */
export default class SceneryPhysics {
  constructor(physics) {
    this.physics = physics
    this.props = []
    this.instances = []
    this.point = physics.own(new Ammo.btVector3())
    this.arm = physics.own(new Ammo.btVector3())
    this.identity = physics.own(new Ammo.btTransform())
    this.identity.setIdentity()
  }

  add(mesh, mass, pieces = [mesh.geometry], batch, index) {
    const { physics } = this
    const boxes = pieces.map(() => new THREE.Box3())
    const hulls = pieces.map((geometry, j) => {
      const hull = physics.own(new Ammo.btConvexHullShape())
      hull.setMargin(.005)
      const vertex = new THREE.Vector3()
      const positions = geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i).multiply(mesh.scale)
        boxes[j].expandByPoint(vertex)
        this.point.setValue(vertex.x, vertex.y, vertex.z)
        hull.addPoint(this.point, i === positions.count - 1)
      }
      return hull
    })
    const shape = hulls.length === 1 ? hulls[0] : physics.own(new Ammo.btCompoundShape())
    if (hulls.length > 1) hulls.forEach(hull => shape.addChildShape(this.identity, hull))
    const body = createRigidBody({ mesh, mass, shape, friction: .75, own: physics.own })
    body.setDamping(.12, .22)
    body.forceActivationState(2) // start at rest; contacts and blasts can wake the body
    mesh.userData.body = body
    this.props.push({ mesh, boxes, mass })
    if (batch) {
      physics.addBody(body)
      this.instances.push({ mesh, batch, index, moving: false })
    } else physics.add(mesh)
  }

  addInstances(batch, massForScale) {
    const matrix = new THREE.Matrix4()
    for (let i = 0; i < batch.count; i++) {
      const mesh = new THREE.Object3D()
      batch.getMatrixAt(i, matrix)
      matrix.decompose(mesh.position, mesh.quaternion, mesh.scale)
      this.add(mesh, massForScale(mesh.scale), [batch.geometry], batch, i)
    }
    // A hit can send a prop beyond the batch's original bounding sphere.
    batch.frustumCulled = false
  }

  sync() {
    for (const item of this.instances) {
      const active = item.mesh.userData.body.isActive()
      if (active || item.moving) {
        updateMesh(item.mesh)
        item.mesh.updateMatrix()
        item.batch.setMatrixAt(item.index, item.mesh.matrix)
        item.batch.instanceMatrix.needsUpdate = true
      }
      item.moving = active
    }
  }

  hit(center, radius, strength) {
    const local = new THREE.Vector3(), contact = new THREE.Vector3(), direction = new THREE.Vector3()
    const closest = new THREE.Vector3(), inverse = new THREE.Quaternion()
    for (const { mesh, boxes, mass } of this.props) {
      local.copy(center).sub(mesh.position).applyQuaternion(inverse.copy(mesh.quaternion).invert())
      let distance = radius
      for (const box of boxes) {
        box.clampPoint(local, closest)
        const gap = local.distanceTo(closest)
        if (gap < distance) {
          distance = gap
          contact.copy(closest)
        }
      }
      if (distance === radius) continue
      contact.applyQuaternion(mesh.quaternion)
      direction.copy(mesh.position).sub(center).normalize()
      direction.y = Math.max(.45, direction.y + .45)
      direction.normalize().multiplyScalar(Math.min(mass * 5, strength * 3) * (1 - distance / radius))
      this.point.setValue(direction.x, direction.y, direction.z)
      this.arm.setValue(contact.x, contact.y, contact.z)
      const { body } = mesh.userData
      body.activate(true)
      body.applyImpulse(this.point, this.arm)
    }
  }

  end() {
    for (const { mesh } of this.instances) delete mesh.userData.body
    this.instances.length = this.props.length = 0
  }
}
