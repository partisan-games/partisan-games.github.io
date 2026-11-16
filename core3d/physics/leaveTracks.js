import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

import { Ammo } from '/core3d/physics/index.js'
import { getMesh } from '/core3d/helpers.js'

const textureLoader = new THREE.TextureLoader()

const trackMaterial = new THREE.MeshPhongMaterial({
  specular: 0x444444,
  map: textureLoader.load('/assets/images/car-track.png'),
  shininess: 900,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  wireframe: false,
  opacity: .4
})

const oldCarPos = new THREE.Vector3(0, 0, 0)
const oldCarPos2 = new THREE.Vector3(0, 0, 0)

let tracks = []
let decRot = 0

function fixAngleRad(a) {
  if (a > Math.PI) return a - Math.PI * 2
  if (a < -Math.PI) return a + Math.PI * 2
  return a
}

// shared by every call: tracks are left every frame, and new native vectors would never be freed
const dec = new Ammo.btVector3(0, 0, 0)
const dec2 = new Ammo.btVector3(0, 0, 0)
const dec3 = new Ammo.btVector3(0, 0, 0)

const position = new THREE.Vector3()
const velocity = new THREE.Vector3()
const orientation = new THREE.Euler(0, 0, 0, 'XYZ')
const size = new THREE.Vector3()

/** One decal under a wheel, offset in the body's frame and turned along the way it moved since the last one. */
function addTrack({ basis, offset, wheel, lastPosition, groundMesh, scene, material }) {
  dec.setValue(...offset)
  dec2.setValue(
    basis.getRow(0).x() * dec.x() + basis.getRow(0).y() * dec.y() + basis.getRow(0).z() * dec.z(),
    basis.getRow(1).x() * dec.x() + basis.getRow(1).y() * dec.y() + basis.getRow(1).z() * dec.z(),
    basis.getRow(2).x() * dec.x() + basis.getRow(2).y() * dec.y() + basis.getRow(2).z() * dec.z()
  )
  dec3.setValue(dec2.x() + wheel.position.x, dec2.y() + wheel.position.y, dec2.z() + wheel.position.z)
  position.set(dec3.x(), Math.floor(dec3.y()), dec3.z()) // bugfix: Math.floor

  velocity.subVectors(position, lastPosition)
  lastPosition.copy(position)
  decRot = -fixAngleRad(Math.atan2(velocity.z, velocity.x) + Math.PI / 2)
  orientation.set(0, decRot, 0)
  if (velocity.length() > 2) velocity.set(0, 0, 0)
  size.set(1, 1, velocity.length())

  const track = new THREE.Mesh(new DecalGeometry(groundMesh, position, orientation, size), material)
  tracks.push(track)
  scene.add(track)
}

export function leaveTracks({ ground, scene, body, wheelMeshes }) {
  const groundMesh = getMesh(ground)
  const basis = body.getWorldTransform().getBasis()
  const material = trackMaterial.clone()
  addTrack({ basis, offset: [-.05, 0, .05], wheel: wheelMeshes[3], lastPosition: oldCarPos, groundMesh, scene, material })
  addTrack({ basis, offset: [.2, 0, .2], wheel: wheelMeshes[2], lastPosition: oldCarPos2, groundMesh, scene, material })
  fadeTracks(scene)
}

export function fadeTracks(scene) {
  tracks.forEach(decal => {
    decal.material.opacity -= .001
    if (decal.material.opacity <= 0) scene.remove(decal)
  })
  tracks = tracks.filter(decal => decal.material.opacity > 0)
}
