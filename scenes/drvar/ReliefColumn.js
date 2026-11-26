import { BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, Matrix3, Matrix4, Sphere, Vector3 } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Animator from '/core3d/actor/Animator.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { loadedModel } from '/core3d/assets/models.js'

const phases = 3
const samples = 9
const lanes = [-2.15, -.7, .7, 2.15]
const fromLead = 4
const rowSpacing = 1.8
const stagger = .48
export const columnSize = 33
export const columnDepth = fromLead + Math.floor((columnSize - 1) / lanes.length) * rowSpacing + stagger

/** Keep the FBX's materials but draw each slot once, even when the FBX splits it into several groups. */
function batchLayout({ geometry, material }) {
  const layout = new BufferGeometry()
  const uv = geometry.getAttribute('uv')
  if (uv) layout.setAttribute('uv', uv)
  if (!Array.isArray(material)) return layout.setIndex(geometry.index)

  const { index } = geometry
  const indices = []
  material.forEach((_, slot) => {
    const start = indices.length
    for (const group of geometry.groups) {
      if (group.materialIndex !== slot) continue
      for (let i = group.start; i < group.start + group.count; i++) indices.push(index ? index.getX(i) : i)
    }
    if (indices.length > start) layout.addGroup(start, indices.length - start, slot)
  })
  return layout.setIndex(indices)
}

function bakePose(part, layout) {
  const positions = part.geometry.getAttribute('position')
  const normals = part.geometry.getAttribute('normal')
  const vertices = new Float32BufferAttribute(new Float32Array(positions.count * 3), 3)
  const directions = new Float32BufferAttribute(new Float32Array(positions.count * 3), 3)
  const point = new Vector3(), normal = new Vector3()
  const normalMatrix = new Matrix3().getNormalMatrix(part.matrixWorld)
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i)
    normal.fromBufferAttribute(normals, i)
    if (part.isSkinnedMesh) {
      normal.add(point)
      part.applyBoneTransform(i, point)
      part.applyBoneTransform(i, normal).sub(point)
    }
    point.applyMatrix4(part.matrixWorld)
    normal.applyNormalMatrix(normalMatrix)
    vertices.setXYZ(i, point.x, point.y, point.z)
    directions.setXYZ(i, normal.x, normal.y, normal.z)
  }
  const pose = new BufferGeometry().setIndex(layout.index)
  Object.entries(layout.attributes).forEach(([name, attribute]) => pose.setAttribute(name, attribute))
  layout.groups.forEach(group => pose.addGroup(group.start, group.count, group.materialIndex))
  return pose.setAttribute('position', vertices).setAttribute('normal', directions)
}

function bakeRun(figure, outfit, textures) {
  const source = loadedModel(figure.model)
  const mesh = clone(source)
  mesh.rotation.y = -Math.PI / 2
  const anim = new Animator({ mesh, animations: source.userData.animations, animDict: { run: figure.animDict.run },
    twoHandedWeapon: loadedModel(figure.twoHandedWeapon) })
  const parts = [], sharedMaterials = new Set()
  mesh.traverse(part => {
    if (!part.isMesh) return
    parts.push(part)
    for (const material of [part.material].flat()) sharedMaterials.add(material)
  })
  dressFighter(mesh, outfit, textures)
  const tracks = parts.map(part => ({ layout: batchLayout(part), material: part.material, poses: [] }))
  const { duration } = anim.run.getClip()
  anim.run.play()
  for (let i = 0; i < samples; i++) {
    anim.mixer.setTime(i * duration / samples)
    mesh.updateMatrixWorld(true)
    tracks.forEach(({ layout, poses }, j) => poses.push(bakePose(parts[j], layout)))
  }
  for (const { poses } of tracks) {
    const bounds = new Sphere()
    for (const pose of poses) {
      pose.computeBoundingSphere()
      bounds.union(pose.boundingSphere)
    }
    for (const pose of poses) pose.boundingSphere = bounds
  }
  return { tracks, duration, sharedMaterials }
}

/** The distant ranks share sampled 3D running poses and have no bodies, mixers, or per-soldier audio. */
export default class ReliefColumn {
  constructor(figure, outfit, textures) {
    const { tracks, duration, sharedMaterials } = bakeRun(figure, outfit, textures)
    this.mesh = new Group()
    this.mesh.visible = false
    this.duration = duration
    this.elapsed = 0
    this.tracks = tracks
    this.sharedMaterials = sharedMaterials
    this.batches = tracks.flatMap(({ material, poses }) => Array.from({ length: phases }, (_, phase) => {
      const batch = new InstancedMesh(poses[phase * samples / phases], material, columnSize / phases)
      const matrix = new Matrix4(), tint = new Color()
      for (let i = 0; i < batch.count; i++) {
        const soldier = phase + i * phases
        const row = Math.floor(soldier / lanes.length), lane = soldier % lanes.length
        const x = -fromLead - row * rowSpacing - (lane % 2) * stagger
        const z = lanes[lane] + .2 * Math.sin(soldier * 2.1)
        matrix.makeTranslation(x, 0, z)
        batch.setMatrixAt(i, matrix)
        batch.setColorAt(i, tint.setRGB(1 - .11 * (soldier % 3), 1 - .07 * (soldier % 3), .93 + .035 * (soldier % 3)))
      }
      batch.computeBoundingSphere()
      this.mesh.add(batch)
      return { batch, poses, phase }
    }))
  }

  follow(lead) {
    this.lead = lead
    this.mesh.position.x = lead.x
    this.mesh.visible = true
  }

  update(dt) {
    if (!this.lead) return
    this.mesh.position.x = this.lead.x
    if (this.lead.state !== 'move') return
    this.elapsed += dt
    const frame = Math.floor(this.elapsed * samples / this.duration)
    for (const { batch, poses, phase } of this.batches)
      batch.geometry = poses[(frame + phase * samples / phases) % samples]
  }

  end() {
    this.mesh.removeFromParent()
    this.batches.forEach(({ batch }) => batch.dispose())
    for (const { material, poses } of this.tracks) {
      poses.forEach(pose => pose.dispose())
      for (const slot of [material].flat())
        if (!this.sharedMaterials.has(slot)) slot.dispose()
    }
  }
}
