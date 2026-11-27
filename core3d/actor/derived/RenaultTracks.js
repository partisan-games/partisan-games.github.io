import { DataTexture, MathUtils, NearestFilter, NearestMipmapLinearFilter, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three'

// The two continuous belts in the Renault FBX. Wheels and suspension keep their original UVs.
const tracks = [
  { start: 492, count: 270, across: [-86.72, -52.51], side: -1 },
  { start: 1314, count: 270, across: [55.14, 89.35], side: 1 },
]
// The outer loop, in the mesh's local y/z plane, begins along the lower run.
const loop = [
  [-77.03, -73.97], [-77.03, 127.82], [-63.77, 176.85], [-48.90, 204.48], [-27.50, 217.16],
  [-1.50, 218.96], [28, 199.82], [40.01, 162.43], [40.33, 120.31],
  [6.26, -130.92], [-12.15, -150.91], [-39.97, -151.91], [-62.26, -129.86],
]
const links = 40
let perimeter = 0
const segments = loop.map(([y, z], index) => {
  const [endY, endZ] = loop[(index + 1) % loop.length]
  const dy = endY - y, dz = endZ - z, length = Math.hypot(dy, dz)
  const segment = { y, z, dy, dz, length, start: perimeter }
  perimeter += length
  return segment
})

function alongBelt(y, z) {
  let nearest = Infinity, distance = 0
  for (const segment of segments) {
    const { dy, dz, length, start } = segment
    const t = MathUtils.clamp(((y - segment.y) * dy + (z - segment.z) * dz) / length ** 2, 0, 1)
    const gap = (y - segment.y - t * dy) ** 2 + (z - segment.z - t * dz) ** 2
    if (gap < nearest) {
      nearest = gap
      distance = start + t * length
    }
  }
  return distance * links / perimeter
}

function beltGeometry(source) {
  const geometry = source.clone()
  const { position, uv } = geometry.attributes
  const body = [], belts = [[], []]
  for (let i = 0; i < position.count; i += 3) {
    const belt = tracks.findIndex(({ start, count }) => i >= start && i < start + count)
    if (belt < 0) {
      body.push(i, i + 1, i + 2)
      continue
    }
    const [left, right] = tracks[belt].across
    const points = [i, i + 1, i + 2]
    const along = points.map(vertex => alongBelt(position.getY(vertex), position.getZ(vertex)))
    const crossesSeam = Math.max(...along) - Math.min(...along) > links / 2
    for (let k = 0; k < points.length; k++) {
      const vertex = points[k]
      const u = crossesSeam && along[k] < links / 2 ? along[k] + links : along[k]
      uv.setXY(vertex, u, MathUtils.clamp((position.getX(vertex) - left) / (right - left), 0, 1))
    }
    belts[belt].push(...points)
  }
  geometry.clearGroups()
  geometry.setIndex([...body, ...belts.flat()])
  geometry.addGroup(0, body.length, 0)
  geometry.addGroup(body.length, belts[0].length, 1)
  geometry.addGroup(body.length + belts[0].length, belts[1].length, 2)
  return geometry
}

// A dark steel link with its seam and the raised pad, repeated along the belt.
const tile = new Uint8Array(16 * 8 * 4)
for (let v = 0; v < 8; v++) for (let u = 0; u < 16; u++) {
  const level = u < 2 ? 28 : u < 4 ? 70 : u < 12 && v > 0 && v < 7 ? 56 : 44
  tile.set([level, level - 2, level - 5, 255], (v * 16 + u) * 4)
}

export default function renaultTracks(mesh, body) {
  const part = mesh.getObjectByName('GUN_FT17P_LP')
  if (!part?.isMesh || part.geometry.attributes.position.count !== 2592) return null
  const geometry = beltGeometry(part.geometry)
  const armor = part.material
  const materials = tracks.map(() => {
    const map = new DataTexture(tile, 16, 8)
    map.colorSpace = SRGBColorSpace
    map.wrapS = RepeatWrapping
    map.magFilter = NearestFilter
    map.minFilter = NearestMipmapLinearFilter
    map.generateMipmaps = true
    map.needsUpdate = true
    const material = armor.clone()
    material.map = map
    return material
  })
  part.geometry = geometry
  part.material = [armor, ...materials]
  part.updateWorldMatrix(true, false)
  const worldScale = part.getWorldScale(new Vector3()).x
  const linkLength = perimeter * worldScale / links
  const halfWidth = 70.5 * worldScale
  const ahead = new Vector3(0, 0, 1).transformDirection(part.matrixWorld)
  const across = new Vector3(1, 0, 0).transformDirection(part.matrixWorld)
  const forwardSign = Math.sign(ahead.x * Math.cos(body.yaw) - ahead.z * Math.sin(body.yaw))
  const leftSign = Math.sign(-across.x * Math.sin(body.yaw) - across.z * Math.cos(body.yaw))
  let { x, z, yaw } = body
  return {
    update() {
      const turn = Math.atan2(Math.sin(body.yaw - yaw), Math.cos(body.yaw - yaw))
      const heading = yaw + turn / 2
      const ahead = (body.x - x) * Math.cos(heading) - (body.z - z) * Math.sin(heading)
      ;({ x, z, yaw } = body)
      if (body.dead || Math.abs(ahead) + Math.abs(turn) < 1e-7) return
      materials.forEach(({ map }, index) => {
        const distance = ahead - leftSign * tracks[index].side * turn * halfWidth
        map.offset.x = MathUtils.euclideanModulo(map.offset.x + forwardSign * distance / linkLength, 1)
      })
    },
    dispose() {
      geometry.dispose()
      for (const material of materials) {
        material.map.dispose()
        material.dispose()
      }
    },
  }
}
