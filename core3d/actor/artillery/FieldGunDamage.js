import * as THREE from 'three'

const point = (x, y, z) => new THREE.Vector3(x, y, z)
const pivots = {
  barrel: point(0, .84, 0), mount: point(0, .55, .15),
  leftWheel: point(-.66, .66, 0), rightWheel: point(.66, .66, 0),
  leftTrail: point(-.25, .30, .80), rightTrail: point(.25, .30, .80),
}
// Offsets in metres and rotations in radians, relative to each original assembly.
const broken = {
  barrel: [[.16, -.56, -.50], [-.12, .22, -.14]],
  mount: [[0, -.34, .08], [.08, -.10, -.25]],
  leftWheel: [[-.72, -.56, -.30], [0, -.18, -1.48]],
  rightWheel: [[.18, -.43, -.12], [.12, .12, .85]],
  leftTrail: [[-.12, -.10, .05], [0, -.30, -.08]],
  rightTrail: [[.12, -.10, .05], [0, .26, .10]],
}

function assembly(mesh, center, elevation) {
  if (elevation.getObjectById(mesh.id)) return 'barrel'
  if (Math.abs(center.x) > .50 && Math.abs(center.z) < .73)
    return center.x < 0 ? 'leftWheel' : 'rightWheel'
  if (center.z > .75) return center.x < 0 ? 'leftTrail' : 'rightTrail'
  return 'mount'
}

/** Copy selected triangles and their original normals, vertex colours and UVs; the source is never edited. */
function triangles(source, vertices) {
  const geometry = new THREE.BufferGeometry()
  for (const [name, attribute] of Object.entries(source.attributes)) {
    const array = new attribute.array.constructor(vertices.length * attribute.itemSize)
    vertices.forEach((vertex, i) => {
      array.set(attribute.array.subarray(vertex * attribute.itemSize, (vertex + 1) * attribute.itemSize), i * attribute.itemSize)
    })
    geometry.setAttribute(name, new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized))
  }
  return geometry
}

/** Opt-in damage for this gun: worn paint, a loose wheel, a collapsed carriage, then a disassembled wreck. */
export default class FieldGunDamage {
  constructor(body, gun) {
    Object.assign(this, { body, gun, phase: 0, progress: 0 })
    this.originals = []
    gun.traverse(part => {
      if (part.isMesh) this.originals.push({ mesh: part, visible: part.visible })
    })
    this.elevation = gun.getObjectByName('Elevation')
    this.mesh = new THREE.Group()
    this.mesh.name = 'FieldGunDamage'
    this.mesh.visible = false
    gun.add(this.mesh)
    this.parts = []
  }

  prepare() {
    this.gun.updateMatrixWorld(true)
    const inverse = this.gun.matrixWorld.clone().invert()
    this.assemblies = Object.fromEntries(Object.entries(pivots).map(([name, pivot]) => {
      const mesh = new THREE.Group()
      mesh.name = name
      mesh.position.copy(pivot)
      this.mesh.add(mesh)
      return [name, mesh]
    }))
    for (const { mesh } of this.originals) {
      const source = mesh.geometry.clone().applyMatrix4(inverse.clone().multiply(mesh.matrixWorld))
      const positions = source.attributes.position, buckets = new Map()
      const count = source.index?.count ?? positions.count
      for (let i = 0; i < count; i += 3) {
        const indices = [0, 1, 2].map(n => source.index ? source.index.getX(i + n) : i + n)
        const center = indices.reduce((sum, index) => sum.add(point(positions.getX(index), positions.getY(index), positions.getZ(index))), point(0, 0, 0)).divideScalar(3)
        const name = assembly(mesh, center, this.elevation)
        if (!buckets.has(name)) buckets.set(name, [])
        buckets.get(name).push(...indices)
      }
      for (const [name, vertices] of buckets) {
        const geometry = triangles(source, vertices)
        geometry.translate(-pivots[name].x, -pivots[name].y, -pivots[name].z)
        const material = mesh.material.clone()
        const part = new THREE.Mesh(geometry, material)
        part.castShadow = part.receiveShadow = true
        this.assemblies[name].add(part)
        this.parts.push({ mesh: part, base: material.color.clone(),
          colors: geometry.attributes.color?.array.slice() })
      }
      source.dispose()
    }
  }

  scorch(phase) {
    const severity = [0, .18, .36, .62, 1][phase]
    const charcoal = new THREE.Color(0x242522)
    for (const { mesh, base, colors } of this.parts) {
      mesh.material.color.copy(base).lerp(charcoal, severity * .65)
      mesh.material.roughness = .65 + severity * .3
      const { geometry } = mesh, positions = geometry.attributes.position
      if (!geometry.attributes.color)
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(positions.count * 3).fill(1), 3))
      const attribute = geometry.attributes.color
      const pivot = pivots[mesh.parent.name]
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + pivot.x, y = positions.getY(i) + pivot.y, z = positions.getZ(i) + pivot.z
        const burn = Math.exp(-(x * x * 2 + (y - .7) ** 2 + z * z * .7))
        const chips = .5 + .5 * Math.sin(x * 71 + y * 47 + z * 53)
        const shade = 1 - severity * (.48 * burn + .14 * chips)
        attribute.setXYZ(i, (colors?.[i * 3] ?? 1) * shade,
          (colors?.[i * 3 + 1] ?? 1) * shade, (colors?.[i * 3 + 2] ?? 1) * shade)
      }
      attribute.needsUpdate = true
      mesh.material.vertexColors = true
      mesh.material.needsUpdate = true
    }
  }

  update(dt) {
    const fraction = this.body.health.current / this.body.health.maximum
    const phase = this.body.dead ? 4 : fraction <= .25 ? 3 : fraction <= .5 ? 2 : fraction <= .75 ? 1 : 0
    if (!phase) {
      this.mesh.visible = false
      for (const { mesh, visible } of this.originals) mesh.visible = visible
      this.phase = this.progress = 0
      return
    }
    if (!this.assemblies) this.prepare()
    this.mesh.visible = true
    for (const { mesh } of this.originals) mesh.visible = false
    if (phase !== this.phase) this.scorch(phase)
    this.phase = phase
    const target = [0, 0, .10, .40, 1][phase]
    this.progress += THREE.MathUtils.clamp(target - this.progress, -dt, dt)
    const box = new THREE.Box3()
    const ground = this.gun.getWorldPosition(new THREE.Vector3()).y
    this.mesh.updateWorldMatrix(true, false)
    for (const [name, mesh] of Object.entries(this.assemblies)) {
      const [offset, rotation] = broken[name]
      mesh.position.copy(pivots[name]).addScaledVector(point(...offset), this.progress)
      mesh.rotation.set(...rotation.map(angle => angle * this.progress))
      // Ground each detached assembly independently; a fallen wheel must not float beside the barrel.
      mesh.updateMatrixWorld(true)
      box.setFromObject(mesh, true)
      if (box.min.y < ground) mesh.position.y += ground - box.min.y
      else if (phase === 4) mesh.position.y -= (box.min.y - ground) * THREE.MathUtils.smoothstep(this.progress, .6, 1)
    }
  }

  end() {
    for (const { mesh } of this.parts) {
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
    for (const { mesh, visible } of this.originals) mesh.visible = visible
    this.mesh.removeFromParent()
  }
}
