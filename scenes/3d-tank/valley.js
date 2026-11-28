import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'
import Tree, { trees, willows } from '/core3d/actor/nature/Tree.js'
import { Ammo, createRigidBody } from '/core3d/physics/index.js'

/**
 * The valley round Kraljevo, in metres, as the way in sees it: the tank comes along +z from Čačak, so its left, +x, is
 * north. The West Morava runs north of the road from Čačak, the Ibar beyond the square, flowing north into it; their
 * water is still. Hills ring the town beyond the fighting, `from` to `to` metres off: the Stolovi high in the south,
 * the Kotlenik over the Morava in the north, low ground east beyond the town and the open valley west towards
 * Čačak, with the Ružić hill of the insurgents' guns behind the tank. Heights are chosen for the picture, not
 * surveyed ([history](../../docs/ISTORIJA.md#kraljevo-oktobar-1941--polazište-za-izgled-opsade-kraljeva)).
 */
export const valley = {
  morava: { x: [70, 100], z: [-400, 330] },
  ibar: { x: [-400, 70], z: [300, 322] },
  bank: 4,
  hills: { from: 380, to: 720, south: 120, north: 70, east: 35, west: 20 },
  ruzica: { x: -120, z: -330, radius: 90, height: 45 },
  willows: { gap: [32, 65], off: [3, 20] },
}

/** What to load before the valley is built. */
export const models = [...willows, 'oak'].map(kind => trees[kind].model)

const palette = { water: 0x497e7e, bank: 0xb3aa8c, hill: 0x6f7f55 }
/** How high a riverbank stops the tank, in metres. */
const bankWall = 2

const smooth = (from, to, value) => THREE.MathUtils.smoothstep(value, from, to)

// Low terraces in the floodplain. The road, defensive positions, town and river strips sit between them.
const terraces = [
  { x: -48, z: -25, width: 32, length: 65, rise: 6 },
  { x: 45, z: -28, width: 18, length: 72, rise: 4.5 },
  { x: -58, z: 112, width: 35, length: 54, rise: 7 },
  { x: -83, z: 183, width: 37, length: 81, rise: 10 },
  { x: 47, z: 175, width: 17, length: 72, rise: 4 },
]

export function groundHeight(x, z) {
  return terraces.reduce((height, terrace) => {
    const distance = Math.hypot((x - terrace.x) / terrace.width, (z - terrace.z) / terrace.length)
    return Math.max(height, terrace.rise * (1 - smooth(0, 1, distance)))
  }, 0)
}

/** How high the ground stands at `x`, `z`: nothing where the fighting is, rising into the hills round it. */
export function hillHeight(x, z) {
  const { hills, ruzica } = valley
  const distance = Math.hypot(x, z) || 1
  const weights = [[x / distance, hills.north], [-x / distance, hills.south], [z / distance, hills.east], [-z / distance, hills.west]]
    .map(([toward, height]) => [Math.max(0, toward) ** 2, height])
  const total = weights.reduce((sum, [weight]) => sum + weight, 0) || 1
  const range = weights.reduce((sum, [weight, height]) => sum + weight * height, 0) / total
  const angle = Math.atan2(x, z)
  const ridges = 1 + .18 * Math.sin(angle * 7 + 1.3) + .1 * Math.sin(angle * 17 + .4)
  const ring = range * ridges * smooth(hills.from, hills.to, distance)
  const hill = ruzica.height * Math.max(0, 1 - Math.hypot(x - ruzica.x, z - ruzica.z) / ruzica.radius) ** 2
  return Math.max(ring, hill)
}

function material(file, color, repeat) {
  const map = createTexture({ file, repeat })
  map.colorSpace = THREE.SRGBColorSpace
  const made = new THREE.MeshLambertMaterial({ map, color })
  // the toon outline would draw every ridge of the hills as a line
  made.userData.outlineParameters = { visible: false }
  return made
}

/** Use the same triangles for the textured valley floor and the tank's wheel contacts. */
export function buildValleyFloor(physics) {
  const axis = (from, to) => [-1000, ...Array.from({ length: (to - from) / 4 + 1 }, (_, i) => from + i * 4), 1000]
  const xs = axis(-120, 64), zs = axis(-100, 272)
  const geometry = new THREE.PlaneGeometry(1, 1, xs.length - 1, zs.length - 1)
  geometry.rotateX(-Math.PI / 2)
  const { position, uv } = geometry.attributes
  for (let row = 0; row < zs.length; row++)
    for (let col = 0; col < xs.length; col++) {
      const i = row * xs.length + col, x = xs[col], z = zs[row]
      position.setXYZ(i, x, groundHeight(x, z), z)
      uv.setXY(i, x / 9, -z / 9)
    }
  geometry.computeVertexNormals()
  const { normal } = geometry.attributes
  const colors = []
  for (let i = 0; i < position.count; i++) {
    const shade = .91 + .23 * normal.getX(i) - .19 * normal.getZ(i)
    colors.push(shade, shade, shade)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const ground = new THREE.Mesh(geometry, material('terrain/grass.jpg', 0x91a06e, 1))
  ground.material.vertexColors = true
  ground.receiveShadow = true

  const triangles = physics.own(new Ammo.btTriangleMesh())
  const vertices = Array.from({ length: 3 }, () => physics.own(new Ammo.btVector3()))
  const { index } = geometry
  for (let i = 0; i < index.count; i += 3) {
    vertices.forEach((vertex, j) => {
      const n = index.getX(i + j)
      vertex.setValue(position.getX(n), position.getY(n), position.getZ(n))
    })
    triangles.addTriangle(...vertices, false)
  }
  const shape = physics.own(new Ammo.btBvhTriangleMeshShape(triangles, true, true))
  ground.userData.body = createRigidBody({ mesh: ground, shape, mass: 0, own: physics.own })
  physics.add(ground, 0)

  // DecalGeometry processes all supplied triangles, so only give it the ground near the tank.
  const patch = new THREE.BufferGeometry()
  patch.setAttribute('position', position)
  patch.setAttribute('normal', normal)
  const trackSurface = new THREE.Mesh(patch, ground.material)
  const columns = xs.length - 1
  const trackGround = ({ x, z }) => {
    const faces = []
    for (let row = 0; row < zs.length - 1; row++) {
      if (zs[row] > z + 5 || zs[row + 1] < z - 5) continue
      for (let col = 0; col < columns; col++) {
        if (xs[col] > x + 5 || xs[col + 1] < x - 5) continue
        const start = (row * columns + col) * 6
        for (let i = start; i < start + 6; i++) faces.push(index.getX(i))
      }
    }
    patch.setIndex(faces)
    return trackSurface
  }
  return { ground, trackGround }
}

/** The hills as one surface over a ring of the ground, Ružić hill included. */
function createHills() {
  const { hills, ruzica } = valley
  const inner = Math.hypot(ruzica.x, ruzica.z) - ruzica.radius
  const turns = 160, rings = 24
  const points = [], indices = []
  for (let ring = 0; ring <= rings; ring++) {
    const distance = inner + (hills.to - inner) * ring / rings
    for (let turn = 0; turn <= turns; turn++) {
      const angle = turn / turns * Math.PI * 2
      const x = Math.sin(angle) * distance, z = Math.cos(angle) * distance
      // a little below the ground, so where the hills have not risen yet the ground covers them
      points.push(x, hillHeight(x, z) - .1, z)
    }
  }
  for (let ring = 0; ring < rings; ring++)
    for (let turn = 0; turn < turns; turn++) {
      const a = ring * (turns + 1) + turn, b = a + turns + 1
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(points.flatMap((value, i) => i % 3 === 1 ? [] : [value / 8]), 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, material('terrain/grass.jpg', palette.hill, 1))
  mesh.receiveShadow = true
  return mesh
}

/** A flat strip from `x[0]` to `x[1]` and `z[0]` to `z[1]`, lying `y` above the ground. */
function strip({ x, z }, map, y) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(x[1] - x[0], z[1] - z[0]), map)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set((x[0] + x[1]) / 2, y, (z[0] + z[1]) / 2)
  mesh.receiveShadow = true
  return mesh
}

/** Builds the valley on `physics`: the hills, and the rivers with their banks, which the tank cannot cross. */
export function buildValley(physics) {
  const { morava, ibar, bank } = valley
  const water = material('water512.jpg', palette.water, 12)
  const sand = material('terrain/sand.jpg', palette.bank, 8)
  const { scene } = physics
  scene.add(createHills())
  const banks = [
    { x: [morava.x[0] - bank, morava.x[1] + bank], z: morava.z },
    { x: ibar.x, z: [ibar.z[0] - bank, ibar.z[1] + bank] },
  ]
  for (const river of banks) scene.add(strip(river, sand, .03))
  for (const river of [morava, ibar]) scene.add(strip(river, water, .05))

  // an unseen wall along each near bank stops the tank at the water
  const wall = ({ x, z }) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(x[1] - x[0], bankWall, z[1] - z[0]))
    body.visible = false
    body.position.set((x[0] + x[1]) / 2, bankWall / 2, (z[0] + z[1]) / 2)
    physics.add(body, 0)
  }
  wall({ x: [morava.x[0] - bank, morava.x[0]], z: [morava.z[0], ibar.z[0] - bank] })
  wall({ x: [ibar.x[0], morava.x[0]], z: [ibar.z[0] - bank, ibar.z[0]] })
  scene.add(plantWillows(), plantOaks(physics))
}

/** Small groups alternate with stretches of open bank. */
function plantWillows() {
  const { morava, ibar, bank, willows: row } = valley
  const { randInt, randFloat } = THREE.MathUtils
  const group = new THREE.Group()
  group.name = 'Riverbank willows'
  const plantBank = (from, to, position) => {
    for (let along = from; along < to - 10; along += randFloat(...row.gap)) {
      const count = randInt(1, 3)
      for (let i = 0, offset = 0; i < count && along + offset < to; i++, offset += randFloat(5, 9)) {
        const { mesh } = new Tree(willows[randInt(0, willows.length - 1)])
        mesh.position.set(...position(along + offset, randFloat(...row.off)))
        mesh.rotation.y = randFloat(0, Math.PI * 2)
        mesh.scale.multiplyScalar(randFloat(.74, 1.15))
        group.add(mesh)
      }
    }
  }
  plantBank(...morava.z, (z, off) => [morava.x[1] + bank + off, 0, z])
  plantBank(ibar.x[0], morava.x[0] - bank, (x, off) => [x, 0, ibar.z[1] + bank + off])
  return group
}

/** Loose clumps on the grassy terraces, with the trunks grounded and solid. */
function plantOaks(physics) {
  const { randInt, randFloat } = THREE.MathUtils
  const group = new THREE.Group()
  group.name = 'Terrace oaks'
  const trunkGeometry = new THREE.BoxGeometry(.65, 3, .65)
  for (const terrace of terraces) {
    const count = randInt(2, 3), phase = randFloat(0, Math.PI * 2)
    for (let i = 0; i < count; i++) {
      const angle = phase + i * Math.PI * 2 / count + randFloat(-.3, .3)
      const x = terrace.x + Math.cos(angle) * randFloat(4, terrace.width * .48)
      const z = terrace.z + Math.sin(angle) * randFloat(5, terrace.length * .38)
      const y = groundHeight(x, z)
      const { mesh } = new Tree('oak')
      mesh.position.set(x, y, z)
      mesh.rotation.y = randFloat(0, Math.PI * 2)
      mesh.scale.multiplyScalar(randFloat(.62, 1.08))
      group.add(mesh)

      const trunk = new THREE.Mesh(trunkGeometry)
      trunk.position.set(x, y + 1.5, z)
      trunk.visible = false
      physics.add(trunk, 0)
    }
  }
  return group
}
