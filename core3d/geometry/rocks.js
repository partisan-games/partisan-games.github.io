import { Float32BufferAttribute, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * A stone of rough facets, `width`, `height` and `depth` metres, lying with its flat underside on the ground; its
 * faces bulge and sink by up to `roughness` of its size, as `random` picks. `material` covers it, as rock texture
 * mapped across its sides.
 */
export function createRock({ width = 1, height = .7, depth = .9, roughness = .3, material, random = Math.random } = {}) {
  const shape = new IcosahedronGeometry(1, 1)
  shape.deleteAttribute('uv')
  shape.deleteAttribute('normal')
  // neighbouring faces share their corners, so a corner moved once leaves no crack between them
  const geometry = mergeVertices(shape)
  shape.dispose()
  const { position } = geometry.attributes
  const uv = []
  for (let i = 0; i < position.count; i++) {
    const bulge = 1 + (random() - .5) * roughness * 2
    const x = position.getX(i) * bulge * width / 2, z = position.getZ(i) * bulge * depth / 2
    // the lower part is cut flat, as a stone settled into the ground
    const y = (Math.max(position.getY(i) * bulge, -.3) + .3) / 1.3 * height
    position.setXYZ(i, x, y, z)
    uv.push((x + z) / 2, y / 2)
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.computeVertexNormals()
  const mesh = new Mesh(geometry, material)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

/**
 * A heap of three to five stones, about `width` metres across and `height` high, the biggest in the middle; it gives
 * cover as high as it is.
 */
export function createRockPile({ width = 2.5, height = 1.2, material, random = Math.random } = {}) {
  const pile = new Group()
  const count = 3 + Math.floor(random() * 3)
  for (let i = 0; i < count; i++) {
    const size = i === 0 ? 1 : .45 + random() * .35
    const rock = createRock({ width: width * .6 * size, height: height * size, depth: width * .45 * size, material, random })
    if (i > 0) rock.position.set((random() - .5) * width * .7, 0, (random() - .5) * width * .4)
    rock.rotation.y = random() * Math.PI * 2
    pile.add(rock)
  }
  return pile
}

/** The rough grey stone the heaps are made of, `map` its rock texture. */
export const rockMaterial = map => new MeshStandardMaterial({ map, color: 0xb8b0a2, roughness: 1, flatShading: true })
