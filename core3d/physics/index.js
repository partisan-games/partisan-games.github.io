import * as THREE from 'three'
import { getSize, getMesh } from '/core3d/helpers.js'
import AmmoPromise from '/libs/ammo.js'

export const Ammo = await AmmoPromise()

// `own` takes ownership of each new native object (see NativeAllocations); without an owner nothing is freed
const unowned = object => object

/* WORLD */

export function createPhysicsWorld({ gravity = 9.82, softBody = false, own = unowned } = {}) {
  const collisionConfiguration = own(new Ammo.btDefaultCollisionConfiguration())
  const dispatcher = own(new Ammo.btCollisionDispatcher(collisionConfiguration))
  const broadphase = own(new Ammo.btDbvtBroadphase())
  const solver = own(new Ammo.btSequentialImpulseConstraintSolver())
  const softBodySolver = softBody && own(new Ammo.btDefaultSoftBodySolver())

  const physicsWorld = own(new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver))
  physicsWorld.setGravity(own(new Ammo.btVector3(0, -gravity, 0)))
  return physicsWorld
}

/* SHAPE */

const guessMassFromMesh = obj => {
  const mesh = getMesh(obj)
  const { geometry, scale: s } = mesh
  const p = geometry.parameters
  let mass
  if (geometry.type === 'BoxGeometry')
    mass = p.width * s.x * p.height * s.y * p.depth * s.z
  else if (geometry.type === 'SphereGeometry')
    mass = 4 / 3 * Math.PI * Math.pow(p.radius * s.x, 3)
  else if (geometry.type === 'CylinderGeometry')
  // from http://jwilson.coe.uga.edu/emt725/Frustum/Frustum.cone.html
    mass = Math.PI * p.height / 3 * (p.radiusBottom * p.radiusBottom * s.x * s.x
                  + p.radiusBottom * p.radiusTop * s.y * s.y
                  + p.radiusTop * p.radiusTop * s.x * s.x)
  else {
    const { x, y, z } = getSize(mesh)
    mass = x * s.x * y * s.y * z * s.z
  }
  return mass
}

export const createShape = (obj, own = unowned) => {
  const mesh = getMesh(obj)
  const { scale } = mesh
  const { parameters, type } = mesh.geometry
  const btVector3 = own(new Ammo.btVector3())
  switch (type) {
    case 'BoxGeometry':
      btVector3.setX(parameters.width / 2 * scale.x)
      btVector3.setY(parameters.height / 2 * scale.y)
      btVector3.setZ(parameters.depth / 2 * scale.z)
      return own(new Ammo.btBoxShape(btVector3))
    case 'SphereGeometry':
    case 'DodecahedronGeometry':
      const radius = parameters.radius * scale.x
      return own(new Ammo.btSphereShape(radius))
    case 'CylinderGeometry':
      const size = own(new Ammo.btVector3(parameters.radiusTop * scale.x,
        parameters.height * .5 * scale.y,
        parameters.radiusBottom * scale.x))
      return own(new Ammo.btCylinderShape(size))
    default:
      const { x, y, z } = getSize(mesh)
      btVector3.setX(x / 2 * scale.x)
      btVector3.setY(y / 2 * scale.y)
      btVector3.setZ(z / 2 * scale.z)
      return own(new Ammo.btBoxShape(btVector3))
  }
}

export const createShapeFromMesh = (mesh, own = unowned) => {
  const shape = createShape(mesh, own)
  shape.setMargin(.05)
  return shape
}

/* BODIES */

export function createRigidBody({ own = unowned, mesh, mass = guessMassFromMesh(mesh), shape = createShapeFromMesh(mesh, own), friction, kinematic = false }) {
  const { position, quaternion: quat } = mesh

  own(shape) // a shape passed in also belongs to the body's owner; owning it twice frees it once
  const transform = own(new Ammo.btTransform())
  transform.setIdentity()
  transform.setOrigin(own(new Ammo.btVector3(position.x, position.y, position.z)))
  if (quat) transform.setRotation(own(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)))
  const motionState = own(new Ammo.btDefaultMotionState(transform))
  const inertia = own(new Ammo.btVector3(0, 0, 0))
  shape.calculateLocalInertia(mass, inertia)

  const rbInfo = own(new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, inertia))
  const body = own(new Ammo.btRigidBody(rbInfo))

  if (friction) body.setFriction(friction)
  if (mass > 0) body.setActivationState(4) // disable deactivation
  if (kinematic) body.setCollisionFlags(2) // kinematic object

  return body
}

/* TERRAIN */

/** Its height data stays in the Ammo heap for the page's life: this build cannot free `_malloc` memory. */
function createTerrainShape({ data, width, depth, mapWidth, mapDepth, minHeight, maxHeight, own = unowned }) {
  const heightScale = 1
  const upAxis = 1 // 0: X, 1: Y, 2: Z. normally Y is used.
  const hdt = 'PHY_FLOAT' // height data type
  const flipQuadEdges = false // inverts the triangles
  const ammoHeightData = Ammo._malloc(4 * width * depth) // Creates height data buffer in Ammo heap
  // Copy the javascript height data array to the Ammo one
  let p = 0
  let p2 = 0
  for (let j = 0; j < depth; j++)
    for (let i = 0; i < width; i++) {
      // write 32-bit float data to memory
      Ammo.HEAPF32[ammoHeightData + p2 >> 2] = data[p]
      p++
      // 4 bytes/float
      p2 += 4
    }

  const shape = own(new Ammo.btHeightfieldTerrainShape(
    width, depth, ammoHeightData, heightScale, minHeight, maxHeight, upAxis, hdt, flipQuadEdges
  ))

  const scaleX = mapWidth / (width - 1)
  const scaleZ = mapDepth / (depth - 1)
  shape.setLocalScaling(own(new Ammo.btVector3(scaleX, 1, scaleZ)))
  shape.setMargin(0.05)

  return shape
}

export async function createTerrain({ data, width, depth, minHeight = 0, maxHeight = 24, own = unowned } = {}) {
  const averageHeight = (maxHeight + minHeight) / 2

  const { meshFromData } = await import('/core3d/terrain/heightmap.js')
  const mesh = await meshFromData({ data, width, depth, minHeight, maxHeight })
  mesh.translateY(-averageHeight)

  const shape = createTerrainShape({ data, width, depth, mapWidth: width, mapDepth: depth, minHeight, maxHeight, own })

  const position = new THREE.Vector3(0, mesh.position.y + averageHeight, 0)
  const body = createRigidBody({ own, mesh: { position }, mass: 0, shape })
  body.setRestitution(0.9)

  mesh.userData.body = body
  return mesh
}

/* TERRAIN ALT */

export function createTerrainBodyFromData({ data, width, depth, mapWidth, mapDepth, minHeight, maxHeight }) {
  const shape = createTerrainShape({ data, width, depth, mapWidth, mapDepth, minHeight, maxHeight })
  const position = new THREE.Vector3(0, (maxHeight + minHeight) / 2, 0)
  return createRigidBody({ mesh: { position }, mass: 0, shape })
}

/* UPDATE */

export function updateMeshTransform(mesh, transform) {
  const position = transform.getOrigin()
  const quaternion = transform.getRotation()
  mesh.position.set(position.x(), position.y(), position.z())
  mesh.quaternion.set(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w())
}

// one for every call: a new native transform each frame would never be freed
const worldTransform = new Ammo.btTransform()

export function updateMesh(mesh) {
  const { body } = mesh.userData
  const motionState = body.getMotionState()
  if (!motionState || body.isStaticOrKinematicObject()) return
  motionState.getWorldTransform(worldTransform)
  updateMeshTransform(mesh, worldTransform)
}
