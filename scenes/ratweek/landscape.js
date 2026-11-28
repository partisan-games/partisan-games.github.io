import * as THREE from 'three'
import { assets } from '/config.js'
import { createFirTrees } from '/core3d/geometry/trees.js'
import { loadedModel } from '/core3d/assets/models.js'
import { bridges, groundPaint, heightAt, onFloor, railway, railwayAt, river, riverAt, seeded, sidingGap, towns, townSide, valleyAt } from './route.js'

export const trackModel = { file: 'railway/track/model.glb', scale: 1 }

/** Metres between the points of the ground. */
const landStep = 6
/**
 * The water of the river, a band `half` metres to each side of its middle a little below the floor, drawn smooth
 * along its winding, a point every `step` metres, over the coarser ground of its bed.
 */
const water = { level: -.3, step: 4 }
let materials = null
/** The materials all pieces of land share, made once. */
function sharedMaterials() {
  if (!materials) {
    const ground = new THREE.MeshLambertMaterial({ color: 0x7f8963 })
    materials = { ground, water: new THREE.MeshLambertMaterial({ color: 0x4f7a86 }) }
    new THREE.TextureLoader().load(assets.textures + 'terrain/ratweek-dolina.webp', map => {
      map.colorSpace = THREE.SRGBColorSpace
      map.magFilter = THREE.NearestFilter
      map.minFilter = THREE.LinearMipmapNearestFilter
      map.needsUpdate = true
      ground.color.setHex(0xffffff)
      ground.map = map
      ground.needsUpdate = true
    })
  }
  return materials
}

/** The ground from `from` to `to` in the same painted space, `from` at local z 0. */
function createGround(from, to) {
  const { width, from: first, to: last } = groundPaint
  const length = to - from
  const geometry = new THREE.PlaneGeometry(width, length, width / landStep, Math.round(length / landStep))
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, 0, -length / 2)
  const { position, uv } = geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), u = from - position.getZ(i)
    position.setY(i, heightAt(x, u))
    uv.setXY(i, .5 + x / width, 1 - (u - first) / (last - first))
  }
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, sharedMaterials().ground)
  mesh.receiveShadow = true
  return mesh
}

/** The height on the rendered triangle below a point, with the same diagonal as PlaneGeometry. */
function groundSampler(geometry) {
  const { width, height: length, widthSegments: columns, heightSegments: rows } = geometry.parameters
  const { position } = geometry.attributes
  return (x, z) => {
    const column = (.5 + x / width) * columns, row = (1 + z / length) * rows
    if (column < 0 || column > columns || row < 0 || row > rows) return undefined
    const i = Math.min(Math.floor(column), columns - 1), j = Math.min(Math.floor(row), rows - 1)
    const across = column - i, along = row - j
    const a = j * (columns + 1) + i, b = a + columns + 1
    const topRight = position.getY(a + 1), bottomLeft = position.getY(b)
    if (across + along <= 1) return position.getY(a) * (1 - across - along) + topRight * across + bottomLeft * along
    return position.getY(b + 1) * (across + along - 1) + topRight * (1 - along) + bottomLeft * (1 - across)
  }
}

function createWater(from, to) {
  const points = [], indices = []
  for (let u = from, i = 0; u <= to + water.step / 2; u += water.step, i++) {
    const middle = riverAt(Math.min(u, to)), z = -(Math.min(u, to) - from)
    points.push(middle - river.half, water.level, z, middle + river.half, water.level, z)
    if (i) indices.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, sharedMaterials().water)
}

/** Whether the main line leaves a piece out for a bridge; the pieces at either end reach under its ends. */
const underBridge = u => bridges.some(bridge => Math.abs(u - bridge.u) < (bridge.spans * railway.span - railway.piece) / 2)

/** The tracks: the main line, off the bridges, and the sidings of the stations, each a line of pieces across `u`. */
function trackLines(from, to) {
  const lines = [{ offset: 0, from, to, skip: underBridge }]
  for (const town of towns) {
    const middle = (town.from + town.to) / 2
    for (let i = 1; i <= town.sidings; i++)
      lines.push({ offset: townSide(town) * sidingGap * i, from: Math.max(from, middle - 130), to: Math.min(to, middle + 130) })
  }
  return lines
}

/**
 * The pieces of track from `from` to `to`, every `railway.piece` metres along the railway, each turned along it; one
 * instanced mesh for each part of the track model.
 */
function createTracks(from, to) {
  const placements = []
  for (const line of trackLines(from, to))
    for (let u = Math.ceil(line.from / railway.piece) * railway.piece; u < line.to; u += railway.piece) {
      if (line.skip?.(u)) continue
      const x = railwayAt(u) + line.offset
      const turn = Math.atan2(railwayAt(u - 1) - railwayAt(u + 1), 2)
      placements.push(new THREE.Matrix4().compose(new THREE.Vector3(x, Math.max(0, heightAt(x, u)), -(u - from)),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn), new THREE.Vector3(1, 1, 1)))
    }

  const tracks = new THREE.Group()
  if (!placements.length) return tracks
  const model = loadedModel(trackModel)
  model.updateMatrixWorld(true)
  model.traverse(part => {
    if (!part.isMesh) return
    const instances = new THREE.InstancedMesh(part.geometry, part.material, placements.length)
    placements.forEach((placement, i) => instances.setMatrixAt(i, placement.clone().multiply(part.matrixWorld)))
    instances.receiveShadow = true
    tracks.add(instances)
  })
  return tracks
}

/** Fir trees on the slopes, `count` of them, the same each game for the same piece of land. */
function createTrees(from, to, count) {
  const random = seeded(Math.round(from) + 7)
  const positions = []
  for (let i = 0; i < count; i++) {
    const u = from + (to - from) * random()
    const side = random() < .5 ? -1 : 1
    const x = side * (valleyAt(u).floor + 15 + random() * 260)
    if (onFloor(x, u)) continue
    positions.push({ x, y: heightAt(x, u), z: -(u - from) })
  }
  return createFirTrees(positions)
}

/**
 * A piece of the land of the route from `from` to `to`: its ground, the river, the railway and the trees on the hills,
 * with `from` at its local z 0 and the route going on along -z. `ground` is what a shot or a falling plane strikes.
 */
export function createLandPiece(from, to) {
  const group = new THREE.Group()
  const ground = createGround(from, to)
  const sampleGround = groundSampler(ground.geometry)
  group.add(ground, createWater(from, to), createTracks(from, to), createTrees(from, to, 14))
  return {
    group,
    ground,
    heightAt: (x, z) => sampleGround(x, z - group.position.z),
    /** Frees what is its own: tracks and firs share geometry and materials between pieces. */
    dispose() {
      const shared = Object.values(materials)
      group.traverse(part => {
        if (part.isInstancedMesh) return part.dispose()
        if (!part.isMesh) return
        part.geometry.dispose()
        if (!shared.includes(part.material)) part.material.dispose()
      })
    },
  }
}
