import { BoxGeometry, Color, Float32BufferAttribute, Mesh, MeshLambertMaterial } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createWall } from '/core3d/mazes/index.js'

// Lay the stone in metres so its courses continue across walls of different heights.
function stoneUV(geometry) {
  const { position, normal, uv } = geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    uv.setXY(i, (Math.abs(normal.getX(i)) > .7 ? z : x) / 4,
      (Math.abs(normal.getY(i)) > .7 ? z : y) / 4)
  }
  return geometry
}

function ringStone(start, end, inner, outer, depth) {
  const stone = new BoxGeometry(1, 1, depth)
  const { position } = stone.attributes
  for (let i = 0; i < position.count; i++) {
    const angle = position.getX(i) < 0 ? end : start
    const radius = position.getY(i) < 0 ? inner : outer
    position.setXY(i, Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  stone.computeVertexNormals()
  return stone
}

export function buildRuins(maze, groundAt) {
  const cell = maze.cellSize
  const gateColumn = Math.floor(maze.columns / 2)
  const gateX = (gateColumn + .5 - maze.columns / 2) * cell
  const gateZ = -maze.rows * cell / 2
  const walls = maze.toMesh({ color: 0xffffff, texture: 'walls/stone-wall.jpg', connect(a, b) {
    // The gate takes the place of the middle section of the outer wall.
    if (a.z === 0 && b.z === 0 && a.x === gateColumn * cell) {
      const jambs = [createWall(a, a.clone().lerp(b, .15), 1.8, 5),
        createWall(b.clone().lerp(a, .15), b, 1.8, 5)]
      return stoneUV(mergeGeometries(jambs).translate(0, -2.5, 0))
    }
    const height = 3 + Math.random() * 3
    const longX = a.z === b.z
    const wall = createWall(a, b, 1.8, height + 2)
    const { position } = wall.attributes
    const drop = Math.random() * 1.6
    for (let i = 0; i < position.count; i++)
      if (position.getY(i) > 0 && (longX ? position.getX(i) > a.x + cell / 2 : position.getZ(i) > a.z + cell / 2))
        position.setY(i, position.getY(i) - drop)

    wall.computeVertexNormals()
    return stoneUV(wall.translate(0, -2.5, 0))
  } })
  walls.material.emissive.setHex(0x999b9f)
  walls.castShadow = walls.receiveShadow = true

  const stones = []
  const limestone = 0xfffdf5, trimStone = 0xe4dfd3, glaze = 0x7caaa6
  function add(geometry, color) {
    const tint = new Color(color)
    const colors = new Float32Array(geometry.attributes.position.count * 3)
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i)
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    stones.push(geometry)
  }

  function arch(x, z, radius, pierHeight, left, right, turn = 0) {
    const base = groundAt(x, z) - 1.8
    const width = radius * .32, depth = width * 1.6
    const place = (stone, color) => add(stone.rotateY(turn).translate(x, base, z), color)
    for (const side of [-1, 1]) {
      const center = side * (radius + width / 2)
      const fullPier = (side < 0 ? left : right) > 0
      const levels = fullPier ? 6 : 3
      for (let i = 0; i < levels; i++) {
        const step = pierHeight / 6
        const lip = i === 0 || i === 5 ? .28 : 0
        place(new BoxGeometry(width + lip, step - .018, depth + lip)
          .translate(center, (i + .5) * step, 0), i % 3 === 0 ? trimStone : limestone)
      }
      if (fullPier)
        place(new BoxGeometry(width + .32, .16, depth + .32).translate(center, pierHeight - .24, 0), glaze)
    }
    const count = 13, step = Math.PI / count
    for (let i = 0; i < count; i++) {
      if (i >= right && i < count - left) continue
      const start = i * step + .003, end = (i + 1) * step - .003
      const key = i === 6
      place(ringStone(start, end, radius - (key ? .13 : 0), radius + width, depth + (key ? .24 : 0))
        .translate(0, pierHeight, 0), key ? trimStone : limestone)
      place(ringStone(start, end, radius + width - .04, radius + width + .17, depth + .13)
        .translate(0, pierHeight, 0), i % 3 === 1 ? glaze : trimStone)
    }
  }

  function rubble(x, z, scale, angle) {
    const block = new BoxGeometry(scale * 1.6, scale, scale * .85)
    block.rotateZ(.24).rotateX(.15).rotateY(angle).translate(x, groundAt(x, z), z)
    add(block, trimStone)
  }

  arch(gateX, gateZ, 3.25, 7, 7, 6)
  // The gatehouse retains its stepped cornice and the glazed inlay on the street side.
  for (const side of [-1, 1]) {
    const x = gateX + side * 5.1, y = groundAt(gateX, gateZ) - 1.8
    const course = (w, h, d, level, color) =>
      add(new BoxGeometry(w, h, d).translate(x, y + level, gateZ), color)
    course(2.95, 2.8, 3.5, 1.4, trimStone)
    course(2.55, 4.2, 3, 4.9, limestone)
    course(2.8, .22, 3.2, 7.1, glaze)
    course(3, .36, 3.45, 7.36, trimStone)
    course(2.6, .32, 3.1, 7.68, limestone)
    const seal = new BoxGeometry(.66, .66, .16).rotateZ(Math.PI / 4)
    add(seal.translate(x, y + 5.8, gateZ - 1.52), glaze)
  }
  for (const [dx, dz, left, right, turn] of [[-8, -8, 5, 0, .45], [8, -6, 0, 4, -.6], [10, -15, 2, 0, -.8]]) {
    arch(gateX + dx, gateZ + dz, 2.1, 4.6, left, right, turn)
    rubble(gateX + dx * .82, gateZ + dz + 1, 1.1, dx)
    rubble(gateX + dx * .72, gateZ + dz + 2.2, .65, dz)
  }
  // Straddle linked cells so broken arcades carry on down real streets.
  for (let row = 2; row < maze.rows; row += 3)
    for (let col = 1; col < maze.columns - 1; col += 3) {
      const site = maze.cell(row, col)
      const east = site.linked(site.east)
      if (!east && !site.linked(site.north)) continue
      const x = (col + (east ? 1 : .5) - maze.columns / 2) * cell
      const z = (row + (east ? .5 : 0) - maze.rows / 2) * cell
      arch(x, z, 2.4, 5.3, 4, 2, east ? Math.PI / 2 : 0)
      rubble(x + (east ? 0 : 3.4), z + (east ? 3.4 : 0), .9, row)
    }

  const masonry = new Mesh(mergeGeometries(stones), new MeshLambertMaterial({
    vertexColors: true, emissive: 0x4c5058,
  }))
  masonry.castShadow = masonry.receiveShadow = true
  return { walls, masonry, gateX, gateZ }
}
