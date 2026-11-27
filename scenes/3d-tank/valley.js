import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'

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
}

const palette = { water: 0x497e7e, bank: 0xb3aa8c, hill: 0x6f7f55 }
/** How high a riverbank stops the tank, in metres. */
const bankWall = 2

const smooth = (from, to, value) => THREE.MathUtils.smoothstep(value, from, to)

/** How high the ground stands at `x`, `z`: nothing where the fighting is, rising into the hills round it. */
export function hillHeight(x, z) {
  const { hills, ruzica } = valley
  const distance = Math.hypot(x, z)
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
      indices.push(a, a + 1, b, a + 1, b + 1, b)
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
}
