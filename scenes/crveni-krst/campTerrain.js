import { DataTexture, EquirectangularReflectionMapping, LinearFilter, LinearMipmapNearestFilter,
  MeshStandardMaterial, NearestFilter, RGBAFormat, SRGBColorSpace } from 'three'
import { createGround } from '/core3d/ground.js'

export const horizonColor = 0x26313f
const groundSize = 130, groundPixels = 512
const half = groundSize / 2, texel = groundSize / groundPixels
const clamp = value => Math.max(0, Math.min(1, value))

function texture(data, width, height) {
  const map = new DataTexture(data, width, height, RGBAFormat)
  map.colorSpace = SRGBColorSpace
  map.needsUpdate = true
  return map
}

/** Paint the frozen footways and contact patches into one map at the layout's actual coordinates. */
function groundColorMap({ rooms, maze, walls, storehouse, towers, gate }) {
  const shade = new Float32Array(groundPixels ** 2)
  const pixel = metres => Math.floor((metres + half) / texel)
  const stamp = (x, z, radius, depth, distance) => {
    const left = Math.max(0, pixel(x - radius)), right = Math.min(groundPixels - 1, pixel(x + radius))
    const bottom = Math.max(0, pixel(-z - radius)), top = Math.min(groundPixels - 1, pixel(-z + radius))
    for (let row = bottom; row <= top; row++)
      for (let column = left; column <= right; column++) {
        const wx = (column + .5) * texel - half, wz = half - (row + .5) * texel
        const amount = clamp(1 - distance(wx, wz))
        const i = row * groundPixels + column
        shade[i] = Math.max(shade[i], depth * amount * amount)
      }
  }
  const stroke = (a, b, width, depth, bend = 0) => {
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz)
    const u = dx / length, v = dz / length
    stamp(a.x + dx / 2, a.z + dz / 2, length / 2 + width + bend, depth, (x, z) => {
      const projection = clamp(((x - a.x) * u + (z - a.z) * v) / length)
      const offset = bend * Math.sin(Math.PI * projection)
      return Math.hypot(x - a.x - dx * projection + v * offset, z - a.z - dz * projection - u * offset) / width
    })
  }
  const centre = cell => maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1)
  for (const room of rooms)
    for (const next of [room.east, room.south])
      if (room.linked(next)) stroke(centre(room), centre(next), 1.45, 26, .32)
  const exit = centre(maze.last_cell)
  stroke(exit, { x: exit.x, z: gate.z + 5 }, 2.1, 27)
  for (const { a, b, kind } of walls)
    if (kind === 'timber') stroke({ x: a[0], z: a[1] }, { x: b[0], z: b[1] }, .65, 16)
  stamp(storehouse.x, storehouse.z, storehouse.length / 2 + 2, 37, (x, z) =>
    Math.hypot(Math.max(0, Math.abs(x - storehouse.x) - storehouse.length / 2),
      Math.max(0, Math.abs(z - storehouse.z) - storehouse.depth / 2)) / 1.35)
  for (const { x, z } of towers)
    stamp(x, z, 3.1, 32, (wx, wz) => Math.max(0, Math.hypot(x - wx, z - wz) - 1.6) / 1.5)

  const data = new Uint8Array(shade.length * 4)
  for (let row = 0; row < groundPixels; row++) {
    const bands = 3 * Math.sin(row * .074)
    for (let column = 0; column < groundPixels; column++) {
      const i = row * groundPixels + column, o = i * 4
      const key = Math.imul(i ^ (i >>> 11), 2246822519)
      const grain = ((key ^ (key >>> 13)) >>> 29) - 3
      const drift = 3 * Math.sin(column * .082 + bands) + 2 * Math.sin((column - row) * .39)
      const snow = 181 + Math.round(drift + grain - shade[i])
      data[o] = snow - 7 + .25 * shade[i]
      data[o + 1] = snow
      data[o + 2] = snow + 9 - .18 * shade[i]
      data[o + 3] = 255
    }
  }
  const map = texture(data, groundPixels, groundPixels)
  map.magFilter = NearestFilter
  map.minFilter = LinearMipmapNearestFilter
  map.generateMipmaps = true
  return map
}

export function createCampGround(layout) {
  const ground = createGround({ size: groundSize, circle: false })
  ground.material.dispose()
  ground.material = new MeshStandardMaterial({ map: groundColorMap(layout), roughness: 1 })
  ground.material.userData.outlineParameters = { visible: false }
  ground.name = 'CampSnow'
  return ground
}

/** Low shapes outside the camp on an original panoramic night sky. The fog meets the sky at the horizon. */
export function createCampHorizon() {
  const width = 512, height = 256
  const data = new Uint8Array(width * height * 4)
  for (let x = 0; x < width; x++) {
    const angle = 2 * Math.PI * x / width
    const lowRise = .022 + .012 * Math.sin(3 * angle) + .007 * Math.cos(7 * angle)
    const roof = Math.max(0, 1 - Math.abs((x % 31) - 15) / 6)
    const settlement = Math.max(0, Math.cos(3 * angle + 1.2))
    const skyline = lowRise + settlement * (.017 + .024 * roof)
    for (let y = 0; y < height; y++) {
      const altitude = Math.PI * ((y + .5) / height - .5)
      const sky = clamp(altitude / 1.1)
      const silhouette = clamp((skyline - altitude) * 125) * clamp((altitude + .016) * 78)
      const i = (y * width + x) * 4
      data[i] = 38 - 17 * sky - 6 * silhouette
      data[i + 1] = 49 - 22 * sky - 7 * silhouette
      data[i + 2] = 63 - 24 * sky - 7 * silhouette
      data[i + 3] = 255
    }
  }
  const map = texture(data, width, height)
  map.mapping = EquirectangularReflectionMapping
  map.minFilter = map.magFilter = LinearFilter
  return map
}
