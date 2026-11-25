import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshBasicMaterial } from 'three'
import { loadedModel } from '/core3d/assets/models.js'
import CampProp, { campModels } from '/core3d/actor/buildings/CampProp.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import Sandbags, { models as sandbagModels } from '/core3d/actor/buildings/Sandbags.js'

export const models = ['storehouse', 'fence-straight', 'fence-terminal', 'gate', 'timber-screen', 'watchtower']
  .map(kind => campModels[kind]).concat(sandbagModels)

/** Scene-owned assembly: visual fence strands never become solid sight or projectile walls. */
export default class CampEnvironment {
  constructor(layout) {
    this.mesh = new Group()
    this.mesh.name = 'CrveniKrstCamp'
    this.props = []
    this.walkSolids = []
    this.opaqueSolids = []
    const batches = new Map(), surfaces = new Map(), boxes = [], posts = new Set()
    const place = (kind, x, z, angle = 0, scaleX = 1, source = loadedModel(campModels[kind])) => {
      if (kind === 'storehouse' || kind === 'timber-screen') {
        // Existing bullet decals need an ordinary mesh's world matrix, not an instance matrix.
        const mesh = source.clone(true)
        mesh.position.set(x, 0, z)
        mesh.rotation.y = angle
        mesh.scale.x *= scaleX
        this.mesh.add(mesh)
        this.opaqueSolids.push(mesh)
        return
      }
      source.updateMatrixWorld(true)
      const placement = new Matrix4().makeRotationY(angle).scale({ x: scaleX, y: 1, z: 1 })
      placement.setPosition(x, 0, z)
      source.traverse(part => {
        if (!part.isMesh) return
        if (!surfaces.has(part.material)) {
          const material = part.material.clone()
          // The level's OutlineEffect would thicken tiny wires and does not transform instance normals.
          material.userData.outlineParameters = { visible: false }
          surfaces.set(part.material, material)
        }
        const key = part.geometry.uuid
        if (!batches.has(key)) batches.set(key, { geometry: part.geometry, material: surfaces.get(part.material), transforms: [], shadow: part.castShadow })
        batches.get(key).transforms.push(placement.clone().multiply(part.matrixWorld))
      })
    }
    const post = (x, z) => {
      const key = `${x.toFixed(3)},${z.toFixed(3)}`
      if (posts.has(key)) return
      posts.add(key)
      place('fence-terminal', x, z)
    }
    const wire = loadedModel(campModels['fence-straight']).getObjectByName('FenceWire')
    if (!wire) throw new Error('Camp fence requires its separately exported FenceWire group')
    for (const { a, b, kind } of layout.walls) {
      const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz)
      const angle = -Math.atan2(dz, dx)
      boxes.push({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, angle, length, height: kind === 'timber' ? 2.5 : 2.6 })
      for (let along = 0; along < length - .001; along += 5) {
        const span = Math.min(5, length - along)
        const x = a[0] + dx * along / length, z = a[1] + dz * along / length
        if (kind === 'wire') place('fence-straight', x, z, angle, span / 5, wire)
        else place('timber-screen', x + dx * span / length / 2, z + dz * span / length / 2, angle, span / 5)
      }
      if (kind === 'wire') for (let along = 0; along <= length + .001; along += Math.min(2.5, length))
        post(a[0] + dx * Math.min(along, length) / length, a[1] + dz * Math.min(along, length) / length)
      if (kind === 'wire') post(...b)
    }
    place('storehouse', layout.storehouse.x, layout.storehouse.z)
    boxes.push({ ...layout.storehouse, length: 32.3, depth: 9.3, height: 7.3, angle: 0 })
    for (const batch of batches.values()) {
      const mesh = new InstancedMesh(batch.geometry, batch.material, batch.transforms.length)
      batch.transforms.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
      mesh.castShadow = batch.shadow
      mesh.receiveShadow = true
      mesh.instanceMatrix.needsUpdate = true
      mesh.name = 'CampFence'
      this.mesh.add(mesh)
    }
    const collision = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial(), boxes.length)
    boxes.forEach(({ x, z, length, height, angle, depth = .24 }, index) => {
      const matrix = new Matrix4().makeRotationY(angle).scale({ x: length + .12, y: height, z: depth })
      matrix.setPosition(x, height / 2, z)
      collision.setMatrixAt(index, matrix)
    })
    collision.instanceMatrix.needsUpdate = true
    collision.visible = false
    collision.name = 'CampWalkColliders'
    this.mesh.add(collision)
    this.walkSolids.push(collision)
    for (const { x, z, angle } of layout.sandbags) {
      const bags = new Sandbags()
      bags.mesh.position.set(x, 0, z)
      bags.mesh.rotation.y = angle
      this.mesh.add(bags.mesh)
      this.walkSolids.push(bags.mesh)
      this.opaqueSolids.push(bags.mesh)
    }
    const gate = new CampProp(loadedModel(campModels.gate))
    gate.mesh.position.set(layout.gate.x, 0, layout.gate.z)
    gate.toggleGate()
    gate.update(1)
    this.mesh.add(gate.mesh)
    this.props.push(gate)
    for (const { x, z, angle } of layout.towers) {
      const tower = new CampProp(loadedModel(campModels.watchtower))
      tower.mesh.position.set(x, 0, z)
      tower.mesh.rotation.y = angle
      tower.toggleSweep()
      this.mesh.add(tower.mesh)
      this.props.push(tower)
      this.opaqueSolids.push(tower.mesh)
    }
    this.mesh.updateMatrixWorld(true)
  }

  /** Walking tests the lower body as well during a jump; flat snow is the ground, never a wire's proxy top. */
  queries() {
    const walk = worldQueries(this.walkSolids), opaque = worldQueries(this.opaqueSolids)
    return { ...opaque, groundAt: () => 0,
      isBlocked: (from, direction, distance) => walk.isBlocked({ ...from, y: Math.max(.1, from.y - .65) }, direction, distance) }
  }

  update(dt) {
    this.props.forEach(prop => prop.update(dt))
  }

  end() {
    if (this.ended) return
    this.ended = true
    // Scene3D releases geometry, materials and lights; each instance buffer has its own dispose event.
    this.mesh.traverse(part => {
      if (part.isInstancedMesh) part.dispose()
    })
  }
}
