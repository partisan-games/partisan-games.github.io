import { Box3, Group, Quaternion, Vector3 } from 'three'

/**
 * Tilts the `parts` of a gun's model `mesh`, its barrel, about their middle and across the way the model faces (-z), so
 * the barrel stands as high as its `body` aims; the model draws the barrel raised `drawnAt` radians. It only reads the body.
 */
export default class TiltingBarrel {
  constructor(body, mesh, { parts, drawnAt = 0 }) {
    Object.assign(this, { body, drawnAt })
    const barrel = parts.map(name => mesh.getObjectByName(name))
    const [{ parent }] = barrel
    mesh.updateMatrixWorld(true)
    const middle = new Box3()
    barrel.forEach(part => middle.expandByObject(part))
    this.pivot = new Group()
    this.pivot.position.copy(parent.worldToLocal(middle.getCenter(new Vector3())))
    parent.add(this.pivot)
    this.pivot.updateMatrixWorld(true)
    barrel.forEach(part => this.pivot.attach(part))
    const fromModel = parent.getWorldQuaternion(new Quaternion()).invert().multiply(mesh.getWorldQuaternion(new Quaternion()))
    this.across = new Vector3(1, 0, 0).applyQuaternion(fromModel)
    this.update()
  }

  update() {
    this.pivot.quaternion.setFromAxisAngle(this.across, this.body.pitch - this.drawnAt)
  }
}
