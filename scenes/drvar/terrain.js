import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'

export const river = { min: { x: 92, z: -300 }, max: { x: 110, z: 300 } }
export const crossing = { min: { x: 84, z: -153 }, max: { x: 118, z: -147 } }
export const riverBanks = { min: { x: crossing.min.x, z: river.min.z }, max: { x: crossing.max.x, z: river.max.z } }
export const craters = [{ x: -9, z: 21, radius: 4.6, depth: .9 }, { x: 20, z: -15, radius: 3.6, depth: .7 },
  { x: -23, z: 17, radius: 3.7, depth: .8 }, { x: 47, z: 17, radius: 4.5, depth: .9 }]
export const craterPlots = craters.map(({ x, z, radius }) => ({ min: { x: x - radius, z: z - radius },
  max: { x: x + radius, z: z + radius } }))

const sobica = { x: -147, z: 28, width: 79, depth: 65, height: 23 }
const caveRidge = { x: 166, z: -123, width: 48, depth: 77, height: 30 }
const channel = [[84, 0], [92, -1.15], [96, -2.65], [106, -2.65], [110, -1.15], [118, 0]]
const waterLevel = -1.1
const deckHeight = .32

function crest({ x, z, width, depth, height }, px, pz) {
  const distance = Math.hypot((px - x) / width, (pz - z) / depth)
  return (1 - THREE.MathUtils.smoothstep(distance, .14, 1)) * height
}

function bedAt(x, z) {
  if (x <= riverBanks.min.x || x >= riverBanks.max.x) return 0
  const index = channel.findIndex(([edge]) => edge >= x)
  const [lo, bottom] = channel[index - 1], [hi, top] = channel[index]
  const end = 1 - THREE.MathUtils.smoothstep(Math.abs(z), 292, 300)
  return THREE.MathUtils.lerp(bottom, top, (x - lo) / (hi - lo)) * end
}

export function landHeight(x, z) {
  let height = crest(sobica, x, z) + crest(caveRidge, x, z) + bedAt(x, z)
  for (const crater of craters) {
    const r = Math.hypot(x - crater.x, z - crater.z) / crater.radius
    height += crater.depth * (Math.max(0, 1 - Math.abs(r - .84) / .22) * .22 - Math.max(0, 1 - r * r) ** 2)
  }
  return height
}

export function groundAt(x, z) {
  const ground = landHeight(x, z)
  if (x <= crossing.min.x || x >= crossing.max.x || z < crossing.min.z || z > crossing.max.z) return ground
  const ramp = Math.min(1, (x - crossing.min.x) / 5, (crossing.max.x - x) / 5)
  return Math.max(ground, deckHeight * ramp)
}

/** Shared by the terrain and the roads, so the road lies on the same profile as the town. */
export function surface(xs, zs, height, tile, material) {
  const vertices = [], uv = [], indices = []
  for (const z of zs)
    for (const x of xs) {
      vertices.push(x, height(x, z), z)
      uv.push(x / tile, -z / tile)
    }

  for (let row = 0; row < zs.length - 1; row++)
    for (let column = 0; column < xs.length - 1; column++) {
      const a = row * xs.length + column, b = a + xs.length
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

const span = (min, max, step) => Array.from({ length: Math.ceil((max - min) / step) + 1 },
  (_, i) => Math.min(max, min + step * i))
const ordered = values => [...new Set(values)].sort((a, b) => a - b)

export function roadCoordinates(min, max) {
  return ordered([...span(min, max, 4), ...[84, 89, 113, 118].filter(x => x > min && x < max)])
}

export function createTerrain() {
  const grid = [...span(-600, -220, 24), ...span(-220, -55, 8), ...span(-55, 55, 2.5), ...span(55, 220, 8), ...span(220, 600, 24)]
  const xs = ordered([...grid, ...channel.map(([x]) => x), ...craters.flatMap(({ x, radius }) => [x - radius, x, x + radius])])
  const zs = ordered([...grid, -300, -292, 292, 300, ...craters.flatMap(({ z, radius }) => [z - radius, z, z + radius])])
  const earth = new THREE.MeshLambertMaterial({ map: createTexture({ file: 'terrain/ground.jpg', repeat: 1 }), vertexColors: true })
  const mesh = surface(xs, zs, landHeight, 8, earth)
  const soil = new THREE.Color(0xb8b49a), bank = new THREE.Color(0x9b8b73), hill = new THREE.Color(0x7c8866)
  const scorched = new THREE.Color(0x615446), tint = new THREE.Color(), colors = []
  for (const z of zs)
    for (const x of xs) {
      const height = landHeight(x, z)
      tint.copy(soil).lerp(hill, THREE.MathUtils.smoothstep(height, 0, 15))
      if (bedAt(x, z) < 0) tint.lerp(bank, .56)
      for (const crater of craters) {
        const distance = Math.hypot(x - crater.x, z - crater.z)
        tint.lerp(scorched, .75 * (1 - THREE.MathUtils.smoothstep(distance, crater.radius * .3, crater.radius)))
      }
      colors.push(tint.r, tint.g, tint.b)
    }

  mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return mesh
}

export function createUnac() {
  const map = createTexture({ file: 'water512.jpg' })
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  const water = surface([river.min.x, river.max.x], [river.min.z, river.max.z], () => waterLevel, 11,
    new THREE.MeshLambertMaterial({ map, color: 0x919c87 }))
  const wood = createTexture({ file: 'material/qubodup-light_wood.jpg' })
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping
  const planks = new THREE.MeshLambertMaterial({ map: wood, color: 0x887257 })
  const bridge = surface([84, 89, 113, 118], [crossing.min.z, crossing.max.z], (x, z) => groundAt(x, z) + .04, 3, planks)
  const railing = new THREE.BoxGeometry(23, .18, .16)
  const rails = [crossing.min.z + .15, crossing.max.z - .15].map(z => {
    const rail = new THREE.Mesh(railing, planks)
    rail.position.set(101, deckHeight + .8, z)
    return rail
  })
  const supports = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, 1, .2), planks, 12)
  const matrix = new THREE.Matrix4()
  for (let i = 0; i < supports.count; i++) {
    const z = i % 2 ? crossing.min.z + .15 : crossing.max.z - .15
    supports.setMatrixAt(i, matrix.makeTranslation(90 + Math.floor(i / 2) * 4.4, deckHeight + .42, z))
  }
  const masonry = new THREE.MeshLambertMaterial({ map: createTexture({ file: 'walls/stone-wall.jpg' }), color: 0x958777 })
  const piers = [92, 110].map(x => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 5.7), masonry)
    pier.position.set(x, -.6, -150)
    return pier
  })
  return [water, bridge, ...piers, ...rails, supports]
}

/** A recessed, faceted rock opening high on the river bank, facing the churchyard. */
export function createCave() {
  const center = new THREE.Vector3(129, landHeight(129, -132) + 2.4, -132)
  const opening = [[-4.4, -2.2], [-4.2, -.6], [-2.8, 2.2], [-.9, 3.1], [1.2, 2.8], [3.5, 1.4], [4.3, -.8], [3.8, -2.2]]
  const rings = [{ x: 2.4, scale: 1.65 }, { x: -.3, scale: 1 }, { x: 2.8, scale: .67 }]
  const positions = [], uv = [], indices = []
  for (const { x, scale } of rings)
    for (const [z, y] of opening) {
      positions.push(center.x + x, center.y + y * scale, center.z + z * scale)
      uv.push((z * scale + x) / 4, y * scale / 4)
    }

  const count = opening.length
  for (let ring = 0; ring < 2; ring++)
    for (let i = 0; i < count; i++) {
      const a = ring * count + i, b = ring * count + (i + 1) % count
      indices.push(a, b, a + count, b, b + count, a + count)
    }
  const sides = indices.length
  for (let i = 1; i < count - 1; i++) indices.push(2 * count, 2 * count + i, 2 * count + i + 1)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.addGroup(0, sides, 0)
  geometry.addGroup(sides, indices.length - sides, 1)
  geometry.computeVertexNormals()
  const rock = new THREE.MeshLambertMaterial({ map: createTexture({ file: 'terrain/rocks.jpg', repeat: 1 }),
    color: 0x776e60, side: THREE.DoubleSide })
  const darkness = new THREE.MeshBasicMaterial({ color: 0x302c25, side: THREE.DoubleSide })
  return new THREE.Mesh(geometry, [rock, darkness])
}
