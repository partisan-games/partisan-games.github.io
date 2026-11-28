import * as THREE from 'three'
import { similarColor, getEmptyCoords, maxItems } from '/core3d/helpers.js'

const { randFloat } = THREE.MathUtils

const sketchSize = 0.04
const browns = [0x3d2817, 0x664422, 0xA0522D, 0x886633, 0x966F33]
const randomNuance = ({ h = .25, s = 0.5, l = 0.2 } = {}) =>
  new THREE.Color().setHSL(Math.random() * 0.1 + h, s, Math.random() * 0.25 + l)

function createTrunk(size, color) {
  const geometry = new THREE.CylinderGeometry(size / 5, size / 4, size * 2, 8)
  const material = new THREE.MeshToonMaterial({
    color: color || randomNuance({ h: 1.045, s: 0.5 })
  })
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

function createCrown(size, color, sketch = false) {
  const Shape = Math.random() > .2 ? THREE.DodecahedronGeometry : THREE.SphereGeometry
  const geometry = new Shape(size)
  const material = new THREE.MeshToonMaterial({
    color: color || randomNuance()
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.y = randFloat(0, Math.PI)
  if (sketch) {
    const outlineSize = size * sketchSize
    const outlineGeo = new Shape(size + outlineSize)
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x0000000,
      side: THREE.BackSide
    })
    const outline = new THREE.Mesh(outlineGeo, outlineMat)
    mesh.add(outline)
  }
  return mesh
}

export function createTree({ x = 0, y = 0, z = 0, size = 5, trunkColor, crownColor } = {}) {
  size = size * randFloat(0.6, 1.4) // eslint-disable-line
  const trunk = createTrunk(size, trunkColor)
  trunk.position.set(x, y, z)
  trunk.translateY(size)

  const crown = createCrown(size, crownColor)
  crown.position.y = 2 * size - size / 4
  trunk.add(crown)
  return trunk
}

const firParts = [
  { y: 6, shape: [1.5, 1.5, 12, 6, 1, true] },
  { y: 18, shape: [0, 10, 14, 8] },
  { y: 25, shape: [0, 9, 13, 8] },
  { y: 32, shape: [0, 8, 12, 8] },
]

function placeFir(tree, { x, y, z, size }) {
  const scale = size / 10
  tree.scale.set(scale, randFloat(scale / 2, scale), scale)
  tree.position.set(x, y, z)
  tree.rotation.z = randFloat(-0.15, 0.15)
}

export function createFirTree({ x = 0, y = 0, z = 0, size = 5 } = {}) {
  const bark = new THREE.MeshLambertMaterial({ color: similarColor(browns[1]) })
  const needles = new THREE.MeshLambertMaterial({ color: randomNuance() })
  const group = new THREE.Group()
  firParts.forEach(({ y, shape }, i) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(...shape), i ? needles : bark)
    mesh.position.y = y
    mesh.castShadow = true
    group.add(mesh)
  })
  placeFir(group, { x, y, z, size })
  return group
}

let firBatch

/** Draw the firs of a piece of land in one batch per part, sharing their geometry between pieces. */
export function createFirTrees(positions) {
  const group = new THREE.Group()
  if (!positions.length) return group
  firBatch ??= {
    material: new THREE.MeshLambertMaterial(),
    geometries: firParts.map(({ y, shape }) => new THREE.CylinderGeometry(...shape).translate(0, y, 0)),
  }
  const batches = firBatch.geometries.map(geometry => {
    const mesh = new THREE.InstancedMesh(geometry, firBatch.material, positions.length)
    mesh.castShadow = true
    group.add(mesh)
    return mesh
  })
  const tree = new THREE.Object3D()
  positions.forEach(({ x, y, z }, i) => {
    const bark = similarColor(browns[1]), needles = randomNuance()
    placeFir(tree, { x, y, z, size: 5 })
    tree.updateMatrix()
    batches.forEach((mesh, part) => {
      mesh.setMatrixAt(i, tree.matrix)
      mesh.setColorAt(i, part ? needles : bark)
    })
  })
  return group
}

export function createTrees({ mapSize = 100, size = 4, n = maxItems(mapSize, size) / 4, nFirTrees = 0, coords = getEmptyCoords({ mapSize, fieldSize: size }) } = {}) {
  const group = new THREE.Group()
  for (let i = 0; i < n; i++) {
    const { x, z } = coords.pop()
    group.add(createTree({ x, y: 0, z, size }))
  }
  for (let i = 0; i < nFirTrees; i++) {
    const { x, z } = coords.pop()
    group.add(createFirTree({ x, y: 0, z, size }))
  }
  return group
}
