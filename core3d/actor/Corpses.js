import { BufferAttribute, BufferGeometry, Group, Matrix3, Mesh, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The dead share a mesh with those lying within the same `cell` metres square, at most `perBatch` of them: a batch
 * off the screen is not drawn, and each new one rebuilds only his own.
 */
const batching = { cell: 8, perBatch: 24 }

const position = new Vector3(), tip = new Vector3(), normal = new Vector3()
const components = ['getX', 'getY', 'getZ', 'getW']

/**
 * The visible triangles of `part`, a mesh in its world as it lies now: a skinned one in the pose its bones hold, as a
 * plain geometry in world space with its positions, normals and texture coordinates, one for each of its materials.
 */
function bake(part) {
  const source = part.geometry
  const { count } = source.attributes.position
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3)
  const toWorld = new Matrix3().getNormalMatrix(part.matrixWorld)
  for (let i = 0; i < count; i++) {
    position.fromBufferAttribute(source.attributes.position, i)
    normal.fromBufferAttribute(source.attributes.normal, i)
    if (part.isSkinnedMesh) {
      // a normal goes through the bones as the step from its vertex to a point just off it
      tip.copy(position).addScaledVector(normal, .01)
      part.applyBoneTransform(i, position)
      part.applyBoneTransform(i, tip)
      normal.subVectors(tip, position)
    }
    position.applyMatrix4(part.matrixWorld).toArray(positions, i * 3)
    normal.applyMatrix3(toWorld).normalize().toArray(normals, i * 3)
  }
  const materials = [].concat(part.material)
  const groups = Array.isArray(part.material) ? source.groups : [{ start: 0, count: source.index?.count ?? count, materialIndex: 0 }]
  return groups.map(({ start, count: length, materialIndex }) => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new BufferAttribute(normals, 3))
    if (source.attributes.uv) geometry.setAttribute('uv', source.attributes.uv)
    const index = source.index ? source.index.array.slice(start, start + length)
      : Uint32Array.from({ length }, (_, i) => start + i)
    geometry.setIndex(new BufferAttribute(index, 1))
    return { geometry: compact(geometry), material: materials[materialIndex] }
  })
}

/** Only the vertices its triangles use, so a batch does not carry the rest of the figure for each material. */
function compact(geometry) {
  const index = geometry.index.array, used = new Map()
  for (const vertex of index) if (!used.has(vertex)) used.set(vertex, used.size)
  const result = new BufferGeometry()
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const { itemSize } = attribute, values = new Float32Array(used.size * itemSize)
    for (const [from, to] of used) for (let k = 0; k < itemSize; k++) values[to * itemSize + k] = attribute[components[k]](from)
    result.setAttribute(name, new BufferAttribute(values, itemSize))
  }
  result.setIndex(new BufferAttribute(Uint32Array.from(index, vertex => used.get(vertex)), 1))
  return result
}

/**
 * The dead lying about a battlefield, as many as fall, drawn together: each one's pose, as he came to lie, is baked
 * into shared meshes, one for each material and stretch of ground, so a field of them costs a few draws and no bones.
 */
export default class Corpses {
  constructor() {
    this.mesh = new Group()
    /** For each material and cell, its batches, each with the baked parts of its men and the mesh that draws them. */
    this.batches = new Map()
  }

  /** Lays the `figures`, models as they lie now, among the dead; the figures themselves are no longer needed. */
  add(...figures) {
    const changed = new Set()
    for (const figure of figures) this.lay(figure, changed)
    for (const batch of changed) {
      batch.mesh.geometry.dispose()
      batch.mesh.geometry = mergeGeometries(batch.parts)
    }
  }

  lay(figure, changed) {
    figure.updateMatrixWorld(true)
    const parts = []
    figure.traverse(part => {
      if (part.isMesh && part.visible && part.geometry.attributes.normal) parts.push(...bake(part))
    })
    const at = figure.getWorldPosition(new Vector3())
    const cell = `${Math.floor(at.x / batching.cell)},${Math.floor(at.z / batching.cell)}`
    for (const { geometry, material } of parts) {
      const key = `${material.uuid}|${cell}`
      const batches = this.batches.get(key) ?? this.batches.set(key, []).get(key)
      let batch = batches.at(-1)
      if (!batch || batch.figures.size >= batching.perBatch && !batch.figures.has(figure)) {
        batch = { parts: [], figures: new Set(), mesh: new Mesh(new BufferGeometry(), material) }
        batch.mesh.receiveShadow = true
        batch.mesh.matrixAutoUpdate = false
        this.mesh.add(batch.mesh)
        batches.push(batch)
      }
      batch.parts.push(geometry)
      batch.figures.add(figure)
      changed.add(batch)
    }
  }

  /** How many meshes draw the dead now. */
  get draws() {
    return this.mesh.children.length
  }

  end() {
    for (const batches of this.batches.values())
      for (const { mesh, parts } of batches) {
        mesh.geometry.dispose()
        parts.forEach(part => part.dispose())
      }
    this.mesh.clear()
    this.batches.clear()
  }
}
