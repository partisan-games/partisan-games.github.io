import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createTexture } from '/core3d/helpers.js'
import { dirLight, hemLight } from '/core3d/light.js'
import { Ammo, createRigidBody } from '/core3d/physics/index.js'

export const canyon = { river: { near: -24, far: -28 }, riverBed: -1.5, water: -.4, wall: { width: 160 } }

const palette = { haze: 0xc7d1d6, limestone: 0xd4cbb5, soil: 0x92917a, water: 0x497e7e }

// Cross-section from the river to the gun. The shallow terrace is a scenic reconstruction.
const profile = [[-23, 0], [-18, 1.2], [-10, 1.2], [-5, .4], [-2, 0]]
const bankOffset = x => THREE.MathUtils.clamp(x, -10, 10) * .08

export function bankHeight(x, z) {
  const along = z - bankOffset(x)
  for (let i = 1; i < profile.length; i++) {
    const [start, a] = profile[i - 1], [end, b] = profile[i]
    if (along >= start && along <= end) return THREE.MathUtils.lerp(a, b, (along - start) / (end - start))
  }
  return 0
}

function material(file, color, repeat = 1) {
  const map = createTexture({ file, repeat })
  map.colorSpace = THREE.SRGBColorSpace
  map.magFilter = THREE.LinearFilter
  const made = new THREE.MeshLambertMaterial({ map, color })
  made.userData.outlineParameters = { visible: false }
  return made
}

/** Map stone in metres, rather than stretching one texture over an entire cliff. */
function surface(points, indices, map, { scale = 3, shade = false } = {}) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(points.flatMap(([x, y, z]) => [x / scale + z / (scale * 2), (y + z) / scale]), 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  if (shade) {
    const light = new THREE.Color(0xf4eddb), dark = new THREE.Color(0xa7ac9b)
    const colors = points.flatMap(([x, y, z]) => {
      const color = dark.clone().lerp(light, .4 + .25 * Math.sin(y * 1.6 + z * .42) + .12 * Math.cos(x * .9))
      return [color.r, color.g, color.b]
    })
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }
  const mesh = new THREE.Mesh(geometry, map)
  mesh.receiveShadow = true
  return mesh
}

function groundBox({ near, far, top, physics, terrain }) {
  const depth = near - far, height = 4
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(canyon.wall.width, height, depth), terrain)
  const { uv } = mesh.geometry.attributes
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * canyon.wall.width / 3, uv.getY(i) * depth / 3)
  mesh.position.set(0, top - height / 2, (near + far) / 2)
  mesh.receiveShadow = true
  physics.add(mesh, 0)
}

function terracedBank(physics, earth) {
  const points = [], indices = [], halfWidth = canyon.wall.width / 2
  for (const x of [-halfWidth, -10, 10, halfWidth]) {
    points.push([x, 0, canyon.river.near])
    for (const [z, height] of profile) points.push([x, height, z + bankOffset(x)])
    points.push([x, 0, 35])
  }
  const rows = profile.length + 2
  for (let i = rows; i < points.length; i++) {
    if (i % rows === 0) continue
    indices.push(i - rows - 1, i - rows, i, i - rows - 1, i, i - 1)
  }
  addSolidSurface(physics, surface(points, indices, earth))
}

function addSolidSurface(physics, mesh) {
  const positions = mesh.geometry.attributes.position, indices = mesh.geometry.index
  const triangles = physics.own(new Ammo.btTriangleMesh())
  const vertices = Array.from({ length: 3 }, () => physics.own(new Ammo.btVector3()))
  for (let i = 0; i < indices.count; i += 3) {
    vertices.forEach((vertex, j) => {
      const n = indices.getX(i + j)
      vertex.setValue(positions.getX(n), positions.getY(n), positions.getZ(n))
    })
    triangles.addTriangle(...vertices, true)
  }
  const shape = physics.own(new Ammo.btBvhTriangleMeshShape(triangles, true, true))
  mesh.userData.body = createRigidBody({ mesh, shape, mass: 0, own: physics.own })
  physics.add(mesh)
}

/** Uneven limestone strata flank the firing lane, leaving an open valley behind the fort. */
function cliff(side, rock) {
  const points = [], indices = []
  const rows = 28, layers = 7
  for (let row = 0; row <= rows; row++) {
    const z = 28 - row * 4.5
    const foot = 11.5 + 2.6 * Math.sin(row * .53 + side) + row * .24
    const height = 17 + 6 * Math.sin(row * .67 + side * 2) + row * .3
    for (let layer = 0; layer <= layers; layer++) {
      const rise = layer / layers
      const ledge = Math.sin(row * 1.7 + layer * .65) * (layer ? 1.3 : .2)
      points.push([side * (foot + rise ** 1.35 * 17 + ledge), rise * height - .35, z + Math.sin(layer * 1.7 + row) * .8])
      if (!row || !layer) continue
      const n = row * (layers + 1) + layer
      if (side > 0) indices.push(n - layers - 2, n, n - 1, n - layers - 2, n - layers - 1, n)
      else indices.push(n - layers - 2, n - 1, n, n - layers - 2, n, n - layers - 1)
    }
  }
  const mesh = surface(points, indices, rock, { shade: true })
  mesh.castShadow = true
  return mesh
}

function skyline(rock) {
  const points = [], indices = []
  for (let i = 0; i <= 24; i++) {
    const x = -105 + i * 8.75
    const height = 30 + 14 * Math.sin(i * .76) ** 2 + 9 * Math.cos(i * 1.43) ** 2
    points.push([x, -3, -116], [x, height, -118 - Math.sin(i) * 7])
    if (i) indices.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1)
  }
  return surface(points, indices, rock, { scale: 7, shade: true })
}

function shoreline(side, earth) {
  const points = [], indices = []
  const edge = side > 0 ? canyon.river.near : canyon.river.far
  for (let i = 0; i <= 64; i++) {
    const x = -80 + i * 2.5
    const uneven = .18 * Math.sin(x * .71) + .09 * Math.cos(x * 1.6)
    points.push([x, .012, edge + side * .55], [x, -.95, edge - side * (.85 + uneven)])
    if (i) {
      const n = i * 2
      if (side > 0) indices.push(n - 2, n, n - 1, n - 1, n, n + 1)
      else indices.push(n - 2, n - 1, n, n - 1, n + 1, n)
    }
  }
  return surface(points, indices, earth)
}

function bankDetails(random, rock, scope, scenery) {
  const stones = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rock, 54)
  scope.add(() => stones.dispose())
  const dummy = new THREE.Object3D()
  const brush = new THREE.LineBasicMaterial({ color: 0x655f4b })
  for (let i = 0; i < stones.count; i++) {
    const side = i % 2 ? 1 : -1
    const x = side * (5.6 + random() * 19)
    let z = i % 5 === 0 ? -3 + random() * 9 : -10 - random() * 40
    if (z < canyon.river.near + 1) z -= canyon.river.near - canyon.river.far + 2
    const size = .12 + random() ** 2 * .65
    const ground = bankHeight(x, z)
    dummy.position.set(x, ground + size * .24, z)
    dummy.scale.set(size * 1.5, size * .7, size)
    dummy.rotation.set(random() * .6, random() * Math.PI, random() * .4)
    dummy.updateMatrix()
    stones.setMatrixAt(i, dummy.matrix)
    if (i % 3) continue
    const branches = []
    for (let stem = 0; stem < 4; stem++) {
      const height = .3 + random() * .65, spread = .12 + random() * .25
      branches.push(0, 0, 0, spread, height, spread * side,
        spread * .5, height * .5, spread * side * .5, -spread, height * .85, spread)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(branches, 3))
    geometry.translate(0, -.3, 0)
    const shrub = new THREE.LineSegments(geometry, brush)
    const shrubX = x + side * (size * 1.5 + .15)
    shrub.position.set(shrubX, bankHeight(shrubX, z) + .3, z)
    scenery.add(shrub, .4)
  }
  stones.castShadow = stones.receiveShadow = true
  scenery.addInstances(stones, scale => Math.max(.3, 18 * scale.x * scale.y * scale.z))
  return stones
}

/** The bare, forked tree beside the rounded wall in the barracks photograph. */
function courtyardTree(scenery, fortFront) {
  const limbs = []
  function branch(from, to, base, tip) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
    const direction = b.clone().sub(a)
    const geometry = new THREE.CylinderGeometry(tip, base, direction.length(), 7)
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()))
    const centre = a.lerp(b, .5)
    limbs.push(geometry.translate(centre.x, centre.y - 1.6, centre.z))
  }
  branch([0, 0, 0], [-.14, 1.7, .08], .24, .17)
  branch([-.14, 1.7, .08], [.06, 3.3, 0], .18, .095)
  branch([.06, 3.3, 0], [-.24, 4.45, -.19], .10, .026)
  branch([.06, 3.3, 0], [.79, 3.72, .13], .085, .042)
  branch([.79, 3.72, .13], [1.14, 4.33, .21], .045, .012)
  branch([-.14, 1.7, .08], [-.64, 2.58, -.1], .12, .073)
  branch([-.64, 2.58, -.1], [-1.23, 2.76, -.27], .075, .028)
  branch([-.64, 2.58, -.1], [-.83, 3.5, -.32], .063, .014)
  const tree = new THREE.Mesh(mergeGeometries(limbs), new THREE.MeshLambertMaterial({ color: 0x4f4b40, flatShading: true }))
  tree.castShadow = true
  tree.position.set(-5.8, bankHeight(-5.8, fortFront - .9) + 1.6, fortFront - .9)
  scenery.add(tree, 18, limbs)
  limbs.forEach(limb => limb.dispose())
}

function wire(scenery) {
  const wood = new THREE.MeshLambertMaterial({ color: 0x625c49 })
  const post = new THREE.CylinderGeometry(.025, .045, .72, 5)
  const metal = new THREE.LineBasicMaterial({ color: 0x454b45 })
  for (let section = 0; section < 8; section++) {
    const x = -5.8 + (section + .5) * 1.45
    const mesh = new THREE.Mesh(post, wood)
    mesh.position.set(x, bankHeight(x, -10.9) + .36, -10.9)
    const positions = []
    for (let i = 0; i < 55; i++) {
      const along = (i / 55 - .5) * 1.45, next = along + 1.45 / 55
      const angle = (section * 55 + i) * Math.PI / 11, nextAngle = angle + Math.PI / 11
      positions.push(along, -.05 + Math.sin(angle) * .21, Math.cos(angle) * .21,
        next, -.05 + Math.sin(nextAngle) * .21, Math.cos(nextAngle) * .21)
      if (i % 11 === 0) positions.push(along - .045, -.07, 0, along + .045, .03, 0)
    }
    const coil = new THREE.BufferGeometry()
    coil.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    mesh.add(new THREE.LineSegments(coil, metal))
    scenery.add(mesh, 2, [post, coil])
  }
}

export function buildCanyon({ scene, physics, scenery, scope, fortFront }) {
  let seed = 1943
  const random = () => {
    seed = Math.imul(1664525, seed) + 1013904223 | 0
    return (seed >>> 0) / 4294967296
  }
  const earth = material('terrain/rocks.jpg', palette.soil)
  const rock = material('walls/stone-wall.jpg', palette.limestone)
  rock.vertexColors = true
  const looseRock = material('terrain/rocks.jpg', 0xc2baa4)
  const bank = material('terrain/sand.jpg', 0xb3aa8c)
  terracedBank(physics, earth)
  groundBox({ near: canyon.river.near, far: canyon.river.far, top: canyon.riverBed, physics, terrain: bank })
  groundBox({ near: canyon.river.far, far: -145, top: 0, physics, terrain: earth })
  const water = new THREE.Mesh(new THREE.PlaneGeometry(canyon.wall.width, canyon.river.near - canyon.river.far + .1),
    material('water512.jpg', palette.water, 12))
  water.rotation.x = -Math.PI / 2
  water.position.set(0, canyon.water, (canyon.river.near + canyon.river.far) / 2)
  const ripples = [], foam = new THREE.LineBasicMaterial({ color: 0x9fbfba, transparent: true, opacity: .4 })
  for (let i = 0; i < 100; i++) {
    const x = -50 + random() * 100, z = canyon.river.far + .5 + random() * (canyon.river.near - canyon.river.far - 1)
    ripples.push(x, canyon.water + .012, z, x + .25 + random() * 1.2, canyon.water + .012, z + .025)
  }
  const rippleGeometry = new THREE.BufferGeometry()
  rippleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ripples, 3))
  for (const side of [-1, 1]) {
    addSolidSurface(physics, cliff(side, rock))
    addSolidSurface(physics, shoreline(side, bank))
  }
  scene.add(water, new THREE.LineSegments(rippleGeometry, foam), skyline(rock), bankDetails(random, looseRock, scope, scenery))
  wire(scenery)
  courtyardTree(scenery, fortFront)
  scene.fog = new THREE.Fog(palette.haze, 17, 75)
  hemLight({ scene, skyColor: 0xe3edf0, groundColor: 0x9e937d, intensity: 1.5 })
  const focus = new THREE.Object3D()
  focus.position.set(0, 0, -13)
  scene.add(focus)
  const sun = dirLight({ scene, target: focus, pos: [-24, 32, 12], color: 0xffe1b0,
    intensity: 2.25, area: 22, mapSize: 2048 })
  sun.shadow.normalBias = .025
  sun.shadow.bias = -.0002
}
