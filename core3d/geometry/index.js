import * as THREE from 'three'
import { randomGray } from '../helpers.js'
import { assets } from '/config.js'

const { randFloat, randFloatSpread } = THREE.MathUtils

const textureLoader = new THREE.TextureLoader()

const translateY = (mesh, y) => {
  mesh.translateY(y)
  mesh.updateMatrix()
  mesh.geometry.applyMatrix4(mesh.matrix)
}

export function createBox({ size = 1, width = size, height = size, depth = size, file, bumpFile, normalFile, color = randomGray(), castShadow = true, receiveShadow = true, translateHeight = true, pos, quat } = {}) {
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const options = {
    map: file ? textureLoader.load(`${assets.textures}${file}`) : null,
    color: !file ? color : null,
    bumpMap: bumpFile ? textureLoader.load(`${assets.textures}${bumpFile}`) : null,
    normalMap: normalFile ? textureLoader.load(`${assets.textures}${normalFile}`) : null,
  }
  const material = new THREE.MeshPhongMaterial(options)
  const mesh = new THREE.Mesh(geometry, material)

  if (translateHeight) translateY(mesh, height / 2)
  else mesh.translateY(height / 2)

  if (pos) mesh.position.set(pos.x, pos.y, pos.z)
  if (quat) mesh.quaternion.copy(quat)

  mesh.castShadow = castShadow
  mesh.receiveShadow = receiveShadow
  return mesh
}

export const createPlayerBox = ({ visible = true, ...params } = {}) => {
  const mesh = createBox({ height: 1.78, width: .4, depth: .4, ...params })
  mesh.visible = visible
  return mesh
}

export const createCrate = ({ file = 'crate.gif', ...params } = {}) =>
  createBox({ file, ...params })

export function createTremplin({ width = 8, height = 4, depth = 12, y = -1.5, color } = {}) {
  const jumpBoard = createBox({ width, height, depth, translateHeight: false, color })
  jumpBoard.position.y = y
  jumpBoard.rotateX(-Math.PI / 15)
  return jumpBoard
}

export function createSphere({
  r = 1, segments = 32, color = null, castShadow = true, receiveShadow = false, file, bumpFile } = {}
) {
  const geometry = new THREE.SphereGeometry(r, segments, segments)
  const material = new THREE.MeshStandardMaterial({
    color,
    map: file ? textureLoader.load(`${assets.textures}${file}`) : null,
    bumpMap: bumpFile ? textureLoader.load(`${assets.textures}${bumpFile}`) : null,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.receiveShadow = receiveShadow
  mesh.castShadow = castShadow
  return mesh
}

export const createMoonSphere = () => createSphere({ r: .5, file: 'planets/moon.jpg' })

export function createRustyBarrel({ r = .5, height = 1.5, segments = 32, file = 'metal/rust.jpg', topFile = 'barrel/rust-top.jpg', translateHeight = true, pos } = {}) {
  const geometry = new THREE.CylinderGeometry(r, r, height, segments)
  const sideMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load(`${assets.textures}${file}`),
    bumpMap: textureLoader.load(`${assets.textures}${file}`),
    bumpScale: .02
  })
  const topMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load(`${assets.textures}${topFile || file}`),
    bumpMap: textureLoader.load(`${assets.textures}${topFile || file}`),
    bumpScale: .02
  })
  const materials = [
    sideMaterial,
    topMaterial,
    topMaterial, // bottom
  ]
  const mesh = new THREE.Mesh(geometry, materials)
  if (translateHeight) translateY(mesh, height / 2)
  if (pos) mesh.position.set(pos.x, pos.y, pos.z)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

export const createMetalBarrel = param => createRustyBarrel({ file: 'barrel/metal-barrel-side.jpg', topFile: 'metal/metal01.jpg', ...param })

export function createRandomBoxes({ n = 100, size = 5, mapSize = 100 } = {}) {
  const arr = []
  for (let i = 0; i < n; i++) {
    const color = randomGray()
    const x = randFloatSpread(mapSize), y = randFloat(-5, mapSize * .25), z = randFloatSpread(mapSize)
    const box = createBox({ size, color })
    box.position.set(x, y, z)
    arr.push(box)
  }
  return arr
}

export function createWall({ brickWidth = 0.6, brickDepth = 1, rows = 8, columns = 6, brickMass = 2, friction, x = 0 } = {}) {
  const bricks = []
  const brickHeight = brickDepth * 0.5
  const z = -columns * brickDepth * 0.5
  const pos = new THREE.Vector3()
  pos.set(x, brickHeight * 0.5, z)

  for (let j = 0; j < rows; j++) {
    const oddRow = (j % 2) === 1
    const nRow = oddRow ? columns + 1 : columns

    pos.z = oddRow ? z - brickDepth * .25 : z

    for (let i = 0; i < nRow; i++) {
      const firstOrLast = oddRow && (i === 0 || i === nRow - 1)
      const depth = firstOrLast ? brickDepth * .5 : brickDepth
      const mass = firstOrLast ? brickMass * .5 : brickMass
      const brick = createBox({ width: brickWidth, height: brickHeight, depth, mass, pos, friction, translateHeight: false })

      bricks.push(brick)

      pos.z = oddRow && (i === 0 || i === nRow - 2)
        ? pos.z + brickDepth * .75
        : pos.z + brickDepth
    }

    pos.y += brickHeight
  }
  return bricks
}

export function createFlag({ file = 'prva-proleterska.jpg', scale = 1 } = {}) {
  const group = new THREE.Group()
  group.rotateY(-Math.PI * .5)

  const texture = new THREE.TextureLoader().load(`${assets.images}${file}`)
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 430, 20, 20, true),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }))
  plane.scale.set(.0025, .0025, .0025)
  plane.position.set(.75, 3.5, 0)
  plane.castShadow = true
  plane.name = 'canvas'
  group.add(plane)

  const geometry = new THREE.CylinderGeometry(.03, .03, 4, 32)
  const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(0x654321) })
  const pole = new THREE.Mesh(geometry, material)
  pole.translateY(2)
  pole.castShadow = true
  group.add(pole)

  group.scale.set(scale, scale, scale)
  return group
}
