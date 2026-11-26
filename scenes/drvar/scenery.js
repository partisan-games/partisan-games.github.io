import { Box3, Color, InstancedMesh, Matrix4, Object3D } from 'three'
import DrvarProp from '/core3d/actor/buildings/DrvarProp.js'
import Tree, { trees } from '/core3d/actor/nature/Tree.js'
import { overlap } from './town.js'
import { groundAt } from './terrain.js'

export const treeModels = [trees.oak.model, trees['burnt-oak'].model]

// These sit to either side of the road from the west gate, where the relief column can be seen between them.
const ruinSites = [
  { kind: 'wall-corner', x: -26, z: -9.5, yaw: 0 },
  { kind: 'wall-fragment', x: -35, z: 9.5, yaw: Math.PI / 2 },
  { kind: 'wall-breach', x: -46, z: -9.5, yaw: -.2 },
  { kind: 'stone-house', x: 42.5, z: -12.5, yaw: -Math.PI / 2 },
  { kind: 'stone-house', x: 19, z: 14, yaw: -1.02 },
]

const yardOaks = [
  { kind: 'oak', x: -8.8, z: -7.1, yaw: .7 },
  { kind: 'oak', x: 8.5, z: 7.2, yaw: 2.4 },
]

const burntOaks = [
  { kind: 'burnt-oak', x: -18, z: 7, yaw: .4 },
  { kind: 'burnt-oak', x: -20, z: -13, yaw: 1.8 },
  { kind: 'burnt-oak', x: -41, z: 14, yaw: 3.3 },
  { kind: 'burnt-oak', x: -54, z: -9, yaw: .9 },
  { kind: 'burnt-oak', x: 19, z: -18, yaw: 3.9 },
  { kind: 'burnt-oak', x: 21, z: 16, yaw: 2.5 },
]

function place(mesh, { x, z, yaw }) {
  mesh.position.set(x, groundAt(x, z), z)
  mesh.rotation.y = yaw
  return mesh
}

export function placeRuins() {
  return ruinSites.map(site => {
    const mesh = place(new DrvarProp(site.kind).mesh, site)
    const { min, max } = new Box3().setFromObject(mesh, true)
    return { mesh, footprint: { min, max, base: min.y, height: max.y - min.y } }
  })
}

/** Keep trunks out of paths. The crowns can overhang the road and the player can walk under them. */
export function placeTrees(taken, church) {
  const trees = []
  for (const [sites, blocked] of [[yardOaks, [church]], [burntOaks, taken]])
    for (const site of sites) {
      const { x, z } = site
      const radius = site.kind === 'oak' ? .55 : .4
      const trunk = { min: { x: x - radius, z: z - radius }, max: { x: x + radius, z: z + radius }, height: 3.2,
        base: groundAt(x, z) }
      if (blocked.some(plot => overlap(plot, trunk))) continue
      trees.push({ mesh: place(new Tree(site.kind).mesh, site), footprint: trunk, inside: sites === yardOaks })
    }

  return trees
}

/** Distant slopes use two shared batches, one for foliage and one for trunks. */
export function ridgeTrees() {
  const source = new Tree('oak').mesh
  source.updateMatrixWorld(true)
  const transforms = [], colors = []
  const site = new Object3D()
  const plant = (x, z, index) => {
    const height = groundAt(x, z)
    if (height < 4) return
    site.position.set(x, height, z)
    site.rotation.y = index * 2.399
    site.scale.setScalar(.46 + (index % 5) * .075)
    site.updateMatrix()
    transforms.push(site.matrix.clone())
    colors.push(new Color().setRGB(.77 + (index % 4) * .064, .83 + (index % 3) * .047, .71))
  }
  for (let i = 0; i < 23; i++) plant(-173 + (i % 6) * 12 + 3 * Math.sin(i), 10 + Math.floor(i / 6) * 12, i)
  for (let i = 0; i < 13; i++) plant(155 + (i % 4) * 11 + 3 * Math.cos(i), -160 + Math.floor(i / 4) * 18, i + 23)
  const meshes = [], matrix = new Matrix4()
  source.traverse(part => {
    if (!part.isMesh) return
    const batch = new InstancedMesh(part.geometry, part.material, transforms.length)
    transforms.forEach((transform, i) => {
      batch.setMatrixAt(i, matrix.multiplyMatrices(transform, part.matrixWorld))
      batch.setColorAt(i, colors[i])
    })
    batch.computeBoundingSphere()
    meshes.push(batch)
  })
  return meshes
}
