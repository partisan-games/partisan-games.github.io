import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial } from 'three'
import { createTexture } from '/core3d/helpers.js'
import { createCityWall } from '/core3d/mazes/index.js'

// Lay the masonry in metres, so the blocks have the same scale on every tier.
function stoneUV(geometry) {
  const { position, normal, uv } = geometry.attributes
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    const u = Math.abs(normal.getY(i)) > .5 ? x : x * normal.getZ(i) - z * normal.getX(i)
    uv.setXY(i, u / 6, (Math.abs(normal.getY(i)) > .5 ? z : y) / 6)
  }
  return geometry
}

export function buildCitadel(maze) {
  const city = new Group()
  const outer = maze.grid.at(-1)
  let gate = outer[outer.length * .75]
  for (let i = 0; i < 4; i++) {
    gate.link(gate.inward)
    gate = gate.inward
  }
  const walls = maze.toCity({ color: 0xffffff, connect: (a, b) => {
    const wall = createCityWall(a, b)
    const tier = Math.floor((maze.rows - Math.hypot(a.x, a.z) / maze.cellSize + .05) / 3)
    wall.scale(1, 1 + Math.max(0, tier) * .055, 1)
    return stoneUV(wall)
  } })
  walls.material.map = createTexture({ file: 'walls/bricks-gray.jpg' })
  walls.material.emissive.setHex(0x606675)
  // A pale limewash lets the mortar show through the sunlit stone.
  walls.material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
      'diffuseColor.rgb *= mix(vec3(1.0), texture2D(map, vMapUv).rgb, 0.35);')
  }
  walls.castShadow = walls.receiveShadow = true
  city.add(walls)
  const tower = (x, z, width, depth, height) => {
    const block = new Mesh(stoneUV(new BoxGeometry(width, height, depth)), walls.material)
    block.position.set(x, height / 2, z)
    block.castShadow = block.receiveShadow = true
    city.add(block)
  }
  const radius = maze.rows * maze.cellSize
  const gateWidth = radius * Math.sin(2 * Math.PI / outer.length)
  for (const x of [-2, gateWidth + 2]) {
    tower(x, -radius, 4, 4.5, 9)
    tower(x, -radius, 3.2, 3.7, 10)
  }
  tower(0, 0, 8, 10, 144)
  tower(0, 0, 4, 5, 153)
  return { city, gateX: gateWidth / 2 }
}

export function approachPath(gateX, radius, groundAt) {
  const positions = [], uv = [], colors = [], indices = []
  for (let i = 0; i <= 55; i++) {
    const z = -radius - 65 + 2 * i
    const center = gateX + 1.2 * Math.sin((z + radius) / 12)
    for (const side of [-1, -.72, .72, 1]) {
      const x = center + side * (2.85 + .22 * Math.sin(i * 1.7 + side))
      positions.push(x, groundAt(x, z) + .045, z)
      uv.push(x / 5, z / 5)
      colors.push(1, 1, 1, Math.abs(side) === 1 ? 0 : 1)
    }
    if (i) for (let j = 0; j < 3; j++) {
      const n = i * 4 + j
      indices.push(n - 4, n, n - 3, n - 3, n, n + 1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 4))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const road = new Mesh(geometry, new MeshLambertMaterial({ color: 0xf2d6b2, map: createTexture({ file: 'terrain/dirt.jpg' }),
    vertexColors: true, transparent: true, depthWrite: false }))
  road.receiveShadow = true
  return road
}
