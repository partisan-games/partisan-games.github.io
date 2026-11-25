import * as THREE from 'three'
import { createTexture } from '/core3d/helpers.js'

// Dimensions of the breakable masonry and roof timbers in metres.
const stone = { length: .55, height: .31, depth: .38 }
const density = 10
/** How far a part may be pushed from where it was laid and still stand. */
const standsWithin = .5

let concrete

/** One concrete texture for every fort; the game that ends frees it and the next fort uploads it again. */
function concreteTexture() {
  if (!concrete) {
    concrete = createTexture({ file: 'terrain/concrete.jpg' })
    concrete.magFilter = THREE.LinearFilter
    concrete.colorSpace = THREE.SRGBColorSpace
  }
  return concrete
}

/** Intact Jablanica barracks, facing +z. Its walls and roof can break apart during play. */
export function buildFort({ front = -13, base = 0 } = {}) {
  const width = 18, barracksStart = 6, raisedWing = 12, slits = [8, 16], slitRow = 4
  const courses = column => column < raisedWing ? 6 : 8
  const map = concreteTexture()
  const walls = new THREE.MeshLambertMaterial({ map, color: 0xb4bec7 })
  const roof = walls.clone()
  roof.color.setHex(0x9ea9b1)
  const inside = 8 * stone.length
  const boxes = new Map()
  const parts = []
  const lay = (geometry, material, x, y, z, yaw = 0) => {
    const mesh = new THREE.Mesh(geometry, material.clone())
    const tint = .88 + .12 * Math.sin(x * 7.3 + y * 11.1 + z * 3.7) ** 2
    mesh.material.color.multiplyScalar(tint)
    mesh.position.set(x, base + y, z)
    mesh.rotation.y = yaw
    mesh.castShadow = mesh.receiveShadow = true
    const { width: w, height: h, depth: d, radiusBottom, radiusTop } = geometry.parameters
    const area = geometry.type === 'CylinderGeometry'
      ? Math.PI * (radiusBottom ** 2 + radiusBottom * radiusTop + radiusTop ** 2) / 3
      : w * d
    Object.assign(mesh.userData, { home: mesh.position.clone(), mass: area * h * density })
    parts.push(mesh)
    return mesh
  }
  const breakBoxInto = (mesh, nx, ny, nz) => {
    const { width, height, depth } = mesh.geometry.parameters
    const size = new THREE.Vector3(width / nx, height / ny, depth / nz)
    mesh.userData.fragments = []
    for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++)
      mesh.userData.fragments.push({
        size: size.clone(),
        offset: new THREE.Vector3((x + .5) * size.x - width / 2, (y + .5) * size.y - height / 2,
          (z + .5) * size.z - depth / 2),
      })
  }
  // Keep the texture scale consistent across masonry blocks and roof strips.
  function box(w, h, d) {
    const key = [w, h, d].join(',')
    if (boxes.has(key)) return boxes.get(key)
    const geometry = new THREE.BoxGeometry(w, h, d)
    const { position, normal, uv } = geometry.attributes
    for (let i = 0; i < position.count; i++) {
      const u = Math.abs(normal.getX(i)) > .5 ? position.getZ(i) : position.getX(i)
      const v = Math.abs(normal.getY(i)) > .5 ? position.getZ(i) / .7 + .5 : uv.getY(i)
      uv.setXY(i, u / .7 + .5, v)
    }
    boxes.set(key, geometry)
    return geometry
  }
  const left = -width * stone.length / 2
  const rowY = row => stone.height * (row + .5)
  const frontZ = front - stone.depth / 2
  const rearZ = front - stone.depth * 1.5 - inside
  // Stagger the joints and cut each course flush with the jambs and the change in height.
  for (let row = 0; row < courses(width); row++) {
    const start = row < courses(0) ? barracksStart : raisedWing
    const joints = new Set([start, width])
    for (let i = start + (row % 2 ? .5 : 1); i < width; i++) joints.add(i)
    const gaps = []
    if (row === slitRow) for (const i of slits) gaps.push([i, i + 1])
    for (const [a, b] of gaps) {
      joints.add(a)
      joints.add(b)
    }
    const edges = [...joints].sort((a, b) => a - b)
    for (let i = 1; i < edges.length; i++) {
      const a = edges[i - 1], b = edges[i]
      if (gaps.some(([from, to]) => a >= from && b <= to)) continue
      const x1 = left + a * stone.length, x2 = left + b * stone.length
      lay(box((b - a) * stone.length, stone.height, stone.depth), walls, (x1 + x2) / 2, rowY(row), frontZ)
    }
  }
  const frontStones = [...parts]
  // Use larger masonry sections away from the player to keep the body count down.
  const blockHeight = 2 * stone.height
  for (let i = barracksStart; i < width; i += 2) {
    const x = left + (i + 1) * stone.length
    for (let row = 0; row < courses(i); row += 2)
      lay(box(2 * stone.length, blockHeight, stone.depth), walls, x, (row + 1) * stone.height, rearZ)
  }
  for (const edge of [barracksStart, raisedWing, width]) {
    const x = left + edge * stone.length + (edge === width ? -1 : 1) * stone.depth / 2
    for (let row = 0; row < courses(edge); row += 2)
      for (let j = 0; j < 2; j++) {
        const panel = lay(box(stone.depth, blockHeight, inside / 2), walls, x, (row + 1) * stone.height,
          front - stone.depth - (j + .5) * inside / 2)
        breakBoxInto(panel, 1, 1, 4)
      }
  }
  // Each roof strip rests on the front and rear masonry and can fall with it.
  const eave = .12, thickness = .16, back = rearZ - stone.depth / 2 - eave
  for (let i = barracksStart; i < width; i++) {
    const x = left + (i + .5) * stone.length
    const nose = front + eave
    const strip = lay(box(stone.length, thickness, nose - back), roof, x, courses(i) * stone.height + thickness / 2, (nose + back) / 2)
    breakBoxInto(strip, 1, 1, 8)
  }
  const posts = slits.map(i => {
    const x = left + stone.length * (i + .5)
    const position = new THREE.Vector3(x, base + rowY(slitRow), frontZ)
    return { position, frame: frontStones.filter(mesh => mesh.position.distanceTo(position) < stone.length * 1.2), section: [] }
  })
  function assignSections(pieces, positions) {
    for (const part of pieces) {
      const { x } = part.position
      const closest = positions.reduce((a, b) => Math.abs(a.position.x - x) <= Math.abs(b.position.x - x) ? a : b)
      closest.section.push(part)
      const sectionLists = part.userData.sectionLists ??= []
      sectionLists.push(closest.section)
    }
  }
  assignSections(parts, posts)

  // The photograph shows a low, freestanding round pillbox beside the tree.
  const cx = -3.95, cz = front - 1.8, radius = 1.3, sides = 12
  const bunkerStart = parts.length, bunkerPosts = []
  const blockWidth = 2 * (radius + stone.depth / 2) * Math.tan(Math.PI / sides)
  for (let side = 0; side < sides; side++) {
    const angle = side * 2 * Math.PI / sides
    const x = cx + radius * Math.sin(angle), z = cz + radius * Math.cos(angle)
    lay(box(blockWidth, blockHeight, stone.depth), walls, x, stone.height, z, angle)
    lay(box(blockWidth, stone.height, stone.depth), walls, x, rowY(2), z, angle)
    if (side === 1 || side === sides - 1)
      bunkerPosts.push({ position: new THREE.Vector3(x, base + rowY(3), z), frame: [], section: [] })
    else lay(box(blockWidth, stone.height, stone.depth), walls, x, rowY(3), z, angle)
    const crownAngle = angle + Math.PI / sides
    lay(box(blockWidth, stone.height, stone.depth), walls, cx + radius * Math.sin(crownAngle), rowY(4),
      cz + radius * Math.cos(crownAngle), crownAngle)
  }
  const bunkerWall = parts.slice(bunkerStart)
  for (const post of bunkerPosts)
    post.frame = bunkerWall.filter(block => block.position.distanceTo(post.position) < blockWidth * 1.15)
  const capRadius = (radius + stone.depth / 2) / Math.cos(Math.PI / sides) + .05
  const cap = lay(new THREE.CylinderGeometry(capRadius - .06, capRadius, .18, 32), roof, cx, 5 * stone.height + .09, cz)
  cap.userData.fragments = []
  for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) {
    const offset = new THREE.Vector3(x * stone.length, 0, z * stone.length)
    if (Math.hypot(offset.x, offset.z) < capRadius - stone.length * .25)
      cap.userData.fragments.push({ size: new THREE.Vector3(stone.length, .18, stone.length), offset })
  }
  assignSections(parts.slice(bunkerStart), bunkerPosts)
  return { parts, slits: [...bunkerPosts, ...posts] }
}

/** How many of the bunker's `parts` still stand near where they were laid. */
export const standing = parts => parts.filter(mesh => mesh.position.distanceTo(mesh.userData.home) < standsWithin).length
