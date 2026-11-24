import * as THREE from 'three'
import { createTexture, similarColor } from '/core3d/helpers.js'

const { randFloat } = THREE.MathUtils

/** The green of the default ground and of grassy floors. */
export const grassColor = 0x509f53
/** The olive green of the large hilly terrains. */
export const meadowColor = 0x91A566

export const groundColors = [0xA62A2A, 0x7a8a46, 0x228b22, 0xf0e68c]
export const desertPlanetColors = [0xB0E0E6, 0xCD853F, 0xEEE8AA, 0xA62A2A, 0x666666] // 0xbf8040

export function createGroundMaterial({ color = grassColor, file, repeat } = {}) {
  const params = { side: THREE.FrontSide }
  const material = new THREE.MeshBasicMaterial({
    ...params,
    ...(file ? { map: createTexture({ file, repeat }) } : { color }),
  })
  return material
}

export function crateGroundGeometry({ size, width = size, height = size, circle = true, segments = circle ? 32 : 1 }) {
  const geometry = circle
    ? new THREE.CircleGeometry(size, segments)
    : new THREE.PlaneGeometry(width, height, segments, segments)

  geometry.rotateX(-Math.PI * 0.5)
  return geometry
}

export function createGround({ size = 1000, color, circle, file, repeat = size / 8 } = {}) {
  const material = createGroundMaterial({ file, color, repeat })
  const geometry = crateGroundGeometry({ size, circle })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

export function createFloor({ color = 0x808080, circle = false, ...rest } = {}) {
  return createGround({ color, circle, ...rest })
}

export async function createLava({ size = 100 } = {}) {
  const geometry = new THREE.CircleGeometry(size)
  geometry.rotateX(- Math.PI / 2)
  const { createMaterial } = await import('/core3d/shaders/lava.js')
  const mesh = new THREE.Mesh(geometry, createMaterial())
  mesh.translateY(.1)
  return mesh
}

async function hillyNoise(geometry, segments, factorX, factorY, factorZ, aboveSea) {
  const { position } = geometry.attributes
  const vertex = new THREE.Vector3()
  const { SimplexNoise } = await import('three/examples/jsm/math/SimplexNoise.js')
  const simplex = new SimplexNoise()

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i)
    const dist = simplex.noise(vertex.x / segments / factorX, vertex.z / segments / factorZ)
    position.setY(i, factorY * (dist + aboveSea))
  }
}

function randomShades(geometry, colorParam, range) { // h = .25, s = 0.5, l = 0.2
  const colors = []
  for (let i = 0, l = geometry.attributes.position.count; i < l; i++) {
    const color = similarColor(colorParam, range)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
}

export async function heightColors({ geometry, maxY, minY = 0, terrainColors = groundColors } = {}) {
  const { position } = geometry.attributes
  const obj = await import('/libs/chroma.js')
  const chroma = obj.default

  const f = chroma.scale(terrainColors).domain([minY, maxY])
  const colors = []
  const vertex = new THREE.Vector3()

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i)
    const nuance = new THREE.Color(f(vertex.y).hex())
    colors.push(nuance.r, nuance.g, nuance.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
}

function createTerrainMesh({ size = 400, width = size, height = size, segments = 100 } = {}) {
  const geometry = crateGroundGeometry({ size, width, height, segments, circle: false })

  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = true
  return mesh
}

const deform = (mesh, max = 7, min = 0) => {
  const vertex = new THREE.Vector3()
  const { position } = mesh.geometry.attributes

  for (let i = 0, l = position.count; i < l; i ++) {
    vertex.fromBufferAttribute(position, i)
    const angle = Math.random() * Math.PI * 2
    const amp = randFloat(min, max)
    vertex.z += Math.cos(angle) * amp
    vertex.y += Math.sin(angle) * amp
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
}

export function createTerrain({ size = 400, width, height, segments = 50, colorParam = 0x44aa44, max, min, wireframe = false, colorRange = .15 } = {}) {
  const mesh = createTerrainMesh({ size, width, height, segments })
  deform(mesh, max, min)
  randomShades(mesh.geometry, colorParam, colorRange)
  if (wireframe) mesh.material.wireframe = true
  return mesh
}

export const createHillyTerrain = async(
  { size = 400, segments = size / 20, factorX = size / 20, factorZ = size / 40, factorY = size / 10, aboveSea = .5, terrainColors = groundColors } = {}
) => {
  const mesh = createTerrainMesh({ size, segments })
  await hillyNoise(mesh.geometry, segments, factorX, factorY, factorZ, aboveSea)
  await heightColors({ geometry: mesh.geometry, maxY: factorY * 1.25, minY: -factorY * .25, terrainColors })
  return mesh
}

function setInitialHeight(geometry) {
  const { position } = geometry.attributes
  const initialHeight = []
  const vertex = new THREE.Vector3()
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    initialHeight.push(vertex.y)
  }
  geometry.setAttribute('initialHeight', new THREE.Float32BufferAttribute(initialHeight, 1))
}

export function wave({ geometry, time, amplitude = 1, frequency = 1, passage }) {
  if (!geometry.attributes.initialHeight) setInitialHeight(geometry)

  const { position, initialHeight } = geometry.attributes
  const vertex = new THREE.Vector3()

  for (let i = 0, l = position.count; i < l; i++)
    if (passage && i >= passage.start && i <= passage.end)
      position.setY(i, -10)
    else {
      vertex.fromBufferAttribute(position, i)
      const { x, z } = vertex

      let change = 0
      // change X
      change += 0.32 * amplitude * Math.sin(x * 1.9 * frequency + time)
      change += 3 * amplitude * Math.sin(x * 0.1 * frequency + time)
      // change Z
      change += .42 * amplitude * Math.sin(z * 2.1 * frequency + time)
      change += 2.8 * amplitude * Math.sin(z * 0.2 * frequency + time)
      change *= amplitude * 0.6

      position.setY(i, change + initialHeight.array[i])
    }

  position.needsUpdate = true
}

export function shake({ geometry, time }) {
  if (!geometry.attributes.initialHeight) setInitialHeight(geometry)

  const { position, initialHeight } = geometry.attributes
  for (let i = 0, l = position.count; i < l; i++) {
    const y = Math.sin(i + time) * initialHeight.array[i] * 0.5
    position.setY(i, y)
  }
  position.needsUpdate = true
}
