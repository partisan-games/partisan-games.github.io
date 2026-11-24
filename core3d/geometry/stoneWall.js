import { BoxGeometry, Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { assets } from '/config.js'

/** The old mortared stone wall: its picture shows `tile` metres of wall, and its worn top dips and rises by `wear`. */
export const stoneWall = { picture: 'walls/stone-wall.jpg', tile: 2.5, wear: .08 }

/** The stone the walls are built of; the scene that shows them frees it when it ends. */
export function stoneWallMaterial() {
  const map = new TextureLoader().load(assets.textures + stoneWall.picture)
  map.colorSpace = SRGBColorSpace
  map.wrapS = map.wrapT = RepeatWrapping
  return new MeshStandardMaterial({ map, roughness: 1 })
}

/** How much the worn top is lower or higher at `x` metres along the wall, the same for both its faces. */
const wornAt = x => stoneWall.wear * (Math.sin(x * 2.3) * .6 + Math.sin(x * 5.1 + 1) * .4)

/**
 * A wall of old mortared stone, `length` metres along x, `height` high and `thickness` thick, standing on the ground
 * at its middle; its stones keep their size whatever its length, and its top is worn uneven.
 */
export function createStoneWall({ length, height = 1.1, thickness = .6, material }) {
  const geometry = new BoxGeometry(length, height, thickness, Math.max(1, Math.round(length * 2)), 1, 1)
  geometry.translate(0, height / 2, 0)
  const { position, normal, uv } = geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i)
    if (position.getY(i) > height / 2) position.setY(i, height + wornAt(x))
    const y = position.getY(i)
    // each face shows the stones at their size in metres, so long and short walls match
    const [u, v] = Math.abs(normal.getY(i)) > .5 ? [x, z] : Math.abs(normal.getX(i)) > .5 ? [z, y] : [x, y]
    uv.setXY(i, u / stoneWall.tile, v / stoneWall.tile)
  }
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, material)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}
