import * as THREE from 'three'

/** The outline of a shell, half of it from base to tip along +y, in metres: a body with a driving band and a pointed nose. */
const outline = [[0, -.3], [.07, -.3], [.078, -.26], [.078, -.22], [.072, -.2], [.072, .05], [.058, .18], [.03, .27], [0, .3]]
const geometry = new THREE.LatheGeometry(outline.map(([r, y]) => new THREE.Vector2(r, y)), 16)
const material = new THREE.MeshPhongMaterial({ color: 0xadb5ba, emissive: 0x24282b, emissiveIntensity: .35, shininess: 70 })
const along = new THREE.Vector3(0, 1, 0)

/** A shell flying nose first with its physics body. */
export default class Shell {
  constructor(ball, radius) {
    this.ball = ball
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(ball.position)
    const widthScale = radius / .078
    this.mesh.scale.set(widthScale, 1.2, widthScale)
    this.mesh.castShadow = true
    this.way = new THREE.Vector3()
    this.update()
  }

  update() {
    const { ball, mesh, way } = this
    mesh.position.copy(ball.position)
    const velocity = ball.userData.body.getLinearVelocity()
    way.set(velocity.x(), velocity.y(), velocity.z())
    if (way.lengthSq() > 0) mesh.quaternion.setFromUnitVectors(along, way.normalize())
  }
}
