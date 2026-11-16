import * as THREE from 'three'
import { RIGHT_ANGLE } from '/core3d/constants.js'
import { randomGray, getHeight } from '/core3d/helpers.js'

const { randFloatSpread } = THREE.MathUtils

export function createLocomotive() {
  const group = new THREE.Group()

  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff1111 })
  const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })

  const noseGeo = new THREE.CylinderGeometry(0.75, 0.75, 3, 12)
  const cabinGeo = new THREE.BoxGeometry(2, 2.25, 1.5)
  const chimneyGeo = new THREE.CylinderGeometry(0.3, 0.1, 0.5)
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.75, 16)
  wheelGeo.rotateX(RIGHT_ANGLE)

  const nose = new THREE.Mesh(noseGeo, redMaterial)
  nose.rotation.z = RIGHT_ANGLE
  nose.position.x = -1
  const cabin = new THREE.Mesh(cabinGeo, redMaterial)
  cabin.position.set(1.5, 0.4, 0)
  const chimney = new THREE.Mesh(chimneyGeo, blackMaterial)
  chimney.position.set(-2, 0.9, 0)
  const smallWheelRear = new THREE.Mesh(wheelGeo, blackMaterial)
  smallWheelRear.position.set(0, -0.5, 0)
  const smallWheelCenter = smallWheelRear.clone()
  smallWheelCenter.position.x = -1
  const smallWheelFront = smallWheelRear.clone()
  smallWheelFront.position.x = -2
  const bigWheel = smallWheelRear.clone()
  bigWheel.scale.set(2, 2, 1.25)
  bigWheel.position.set(1.5, -0.1, 0)

  group.add(nose, cabin, chimney, smallWheelRear, smallWheelCenter, smallWheelFront, bigWheel)
  group.rotation.y = Math.PI * .5
  group.position.y = .85

  const wrapper = new THREE.Group()
  wrapper.add(group)
  return wrapper
}

const cloudParts = [
  { name: 'leftPart', position: [-1.2, -0.3, 0], scale: 0.8 },
  { name: 'rightPart', position: [1.2, -0.3, 0], scale: 0.8 },
  { name: 'frontPart', position: [0, -0.4, 0.9], scale: 0.7 },
  { name: 'backPart', position: [0, -0.4, -0.9], scale: 0.7 },
]

export function createCloud() {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({
    color: 0xacb3fb,
    roughness: 1,
    flatShading: true
  })

  const upperPart = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), material)
  upperPart.name = 'upperPart'
  group.add(upperPart)

  for (const { name, position, scale } of cloudParts) {
    const part = upperPart.clone()
    part.name = name
    part.position.set(...position)
    part.scale.setScalar(scale)
    group.add(part)
  }

  group.traverse(part => {
    part.castShadow = true
    part.receiveShadow = false
  })
  group.scale.set(1.5, 1.5, 1.5)
  return group
}

export function updateCloud(group, elapsedTime) {
  const time = elapsedTime * 2
  group.getObjectByName('upperPart').position.y = -Math.cos(time) * 0.12
  group.getObjectByName('leftPart').position.y = -Math.cos(time) * 0.1 - 0.3
  group.getObjectByName('rightPart').position.y = -Math.cos(time) * 0.1 - 0.3
  group.getObjectByName('frontPart').position.y = -Math.cos(time) * 0.08 - 0.3
  group.getObjectByName('backPart').position.y = -Math.cos(time) * 0.08 - 0.3
}

function addTankWheels(body, { tankWidth, tankHeight, tankLength }) {
  const radius = 1
  const thickness = 0.5
  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, 8)
  const material = new THREE.MeshPhongMaterial({ color: 0x444444 })
  const side = tankWidth / 2 + thickness / 2
  const y = -tankHeight / 2
  const positions = [tankLength / 3, 0, -tankLength / 3].flatMap(z => [[-side, y, z], [side, y, z]])

  return positions.map(position => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...position)
    mesh.rotation.z = Math.PI * 0.5
    mesh.castShadow = true
    body.add(mesh)
    return mesh
  })
}

function addTankDome(body, material) {
  const geometry = new THREE.SphereGeometry(1.75, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)
  const dome = new THREE.Mesh(geometry, material)
  dome.castShadow = true
  dome.position.set(0, 0.5, -0.75)
  body.add(dome)
  return dome
}

function addTankGun(dome, material, tankLength) {
  const length = tankLength * 0.16
  const geometry = new THREE.CylinderGeometry(0.06, 0.06, length, 12)
  geometry.rotateX(Math.PI / 2)
  const barrel = new THREE.Mesh(geometry, material)
  barrel.castShadow = true
  barrel.position.z = length * .5

  const gun = new THREE.Object3D()
  gun.scale.set(5, 5, 5)
  gun.position.y = .5
  gun.add(barrel)
  dome.add(gun)
  return gun
}

export function createTank({ tankWidth = 4, tankHeight = 1.2, tankLength = 8 } = {}) {
  const tank = new THREE.Object3D()
  const material = new THREE.MeshPhongMaterial({ color: 0x615E3E })
  const body = new THREE.Mesh(new THREE.BoxGeometry(tankWidth, tankHeight, tankLength), material)
  body.position.y = 1.4
  body.castShadow = true
  tank.add(body)

  const wheels = addTankWheels(body, { tankWidth, tankHeight, tankLength })
  const dome = addTankDome(body, material)
  const tankGun = addTankGun(dome, material, tankLength)
  return { tank, wheels, tankGun }
}

const createTombShape = () => new THREE.Shape()
  .moveTo(40, 40)
  .lineTo(40, 100)
  .absarc(60, 100, 20, Math.PI, 0, true)
  .lineTo(80, 40)
  .absarc(60, 40, 20, 2 * Math.PI, Math.PI, true)

export const createTombstone = ({ shape = createTombShape(), color = randomGray(), pos, scale = Math.random() * .01 + .02 } = {}) => {
  const params = { depth: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
  const geometry = new THREE.ExtrudeGeometry(shape, params)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color }))
  mesh.castShadow = mesh.receiveShadow = true
  mesh.scale.set(scale, scale, scale)
  const height = getHeight(mesh)
  pos.y -= height * .5
  mesh.position.copy(pos)
  mesh.rotateX(randFloatSpread(.2))
  mesh.rotateZ(randFloatSpread(.3))
  return mesh
}