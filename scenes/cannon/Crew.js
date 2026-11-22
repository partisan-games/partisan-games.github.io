import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Health from '/core/gameplay/Health.js'
import { loadedModel } from '/core3d/assets/models.js'
import { fitCrewPose } from './crewPose.js'
import Rifleman from './Rifleman.js'

const uniformScale = { prefix: 'character/soldier/', fitVisible: true, size: 1.74, angle: Math.PI }
// Both figures use the same Mixamo fall clip; load it once with the gunner.
const gunnerModel = { ...uniformScale, file: 'partisan.fbx', animDict: { death: 'Crouch Death' } }
export const resistanceFighterModel = { ...uniformScale, file: 'resistance-fighter.fbx' }
export const riflemanModel = { ...uniformScale, file: 'soviet-partisan.fbx',
  animDict: { fire: 'Fire Rifle Crouch', burst: 'Crouch Rapid Fire' } }

export const stations = [
  { x: .87, z: .48, yaw: 1.02, loader: false, model: gunnerModel },
  { x: -.45, z: .98, yaw: -.68, loader: true, model: resistanceFighterModel },
  { x: -2.25, z: -.35, yaw: 0, model: riflemanModel },
]
export const memberHealth = 48

function cartridge() {
  const profile = [[0, -.18], [.04, -.18], [.04, -.17], [.036, -.167], [.036, .045],
    [.032, .058], [.032, .123], [.024, .158], [.011, .183], [0, .193]]
  const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 16)
  const colors = []
  const brass = new THREE.Color(0xa28b57), steel = new THREE.Color(0xadb5ba)
  const vertices = geometry.attributes.position
  for (let i = 0; i < vertices.count; i++)
    (vertices.getY(i) > .05 ? steel : brass).toArray(colors, i * 3)
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .36, roughness: .56 }))
}

const up = new THREE.Vector3(0, 1, 0)
const reloadTime = 1.25
const roundBase = -.18, roundTip = .193
function loadRound(member, elevation, dt) {
  const { mesh, pose, round } = member
  member.reload = Math.min(reloadTime, member.reload + dt)
  const align = THREE.MathUtils.smoothstep(member.reload, 0, .65)
  const insert = THREE.MathUtils.smoothstep(member.reload, .65, .97)
  const withdraw = THREE.MathUtils.smoothstep(member.reload, .97, reloadTime)
  pose.blend(align * (1 - withdraw), 0)
  round.visible = insert < 1
  if (withdraw === 1) return

  // The rear face of the breech casting is at z=.47 in the GLB's Elevation node.
  // Track that moving face in the loader's coordinates, including when the player changes pitch.
  const atBreech = z => mesh.worldToLocal(elevation.localToWorld(new THREE.Vector3(0, 0, z)))
  const opening = atBreech(.47)
  const axis = atBreech(-.53).sub(opening).normalize()
  const seated = opening.clone().addScaledVector(axis, THREE.MathUtils.lerp(-roundTip, -roundBase, insert))
  round.position.copy(member.pickup).lerp(seated, align)
  round.quaternion.copy(member.pickupRotation).slerp(new THREE.Quaternion().setFromUnitVectors(up, axis), align)

  const grip = distance => mesh.localToWorld(up.clone().multiplyScalar(distance)
    .applyQuaternion(round.quaternion).add(round.position))
  const left = grip(.08), right = grip(roundBase + .035)
  const relaxedLeft = pose.left.getWorldPosition(new THREE.Vector3())
  const relaxedRight = pose.right.getWorldPosition(new THREE.Vector3())
  left.lerp(relaxedLeft, insert)
  right.lerp(relaxedRight, withdraw)
  pose.placeHands(left, right)
}

export default class Crew {
  constructor(carriage, scene) {
    this.elevation = carriage.getObjectByName('Elevation')
    this.deathClip = loadedModel(gunnerModel).userData.animations.find(clip => clip.name === gunnerModel.animDict.death)
    this.members = stations.map(({ x, z, yaw, loader, model }) => {
      const source = loadedModel(model)
      const mesh = new THREE.Group(), figure = clone(source)
      const rifleman = model === riflemanModel
      const pose = rifleman ? { chest: figure.getObjectByName('mixamorigSpine2') } : fitCrewPose(figure, loader)
      mesh.add(figure)
      mesh.position.set(x, 0, z)
      mesh.rotation.y = yaw
      const parent = rifleman ? scene : carriage
      parent.add(mesh)
      const member = { mesh, figure, pose, health: new Health({ maximum: memberHealth }) }
      if (rifleman) {
        member.rifleman = new Rifleman(figure, source.userData.animations.find(clip => clip.name === model.animDict.fire))
        this.shooter = member
      }
      if (loader) {
        member.round = cartridge()
        mesh.add(member.round)
        const left = mesh.worldToLocal(pose.left.getWorldPosition(new THREE.Vector3()))
        const right = mesh.worldToLocal(pose.right.getWorldPosition(new THREE.Vector3()))
        member.pickup = left.clone().lerp(right, .5)
        member.pickupRotation = new THREE.Quaternion().setFromUnitVectors(up, left.sub(right).normalize())
        member.reload = 0
        this.loader = member
        loadRound(member, this.elevation, 0)
      }
      return member
    })
    this.recoil = 0
    this.lastCharge = this.lastRecoil = 0
  }

  fired() {
    this.recoil = 1
    this.loader.needsRound = true
  }

  pickTarget() {
    const living = this.members.filter(member => member.health.alive)
    return living[Math.floor(Math.random() * living.length)]
  }

  hit(member, damage, scene) {
    if (!member.health.damage(damage)) return false
    scene.attach(member.mesh)
    if (member.round) member.round.visible = false
    if (member.rifleman) member.rifleman.mixer.stopAllAction()
    member.figure.position.set(0, 0, 0)
    const mixer = new THREE.AnimationMixer(member.figure)
    const fall = mixer.clipAction(this.deathClip)
    fall.setLoop(THREE.LoopOnce, 1)
    fall.clampWhenFinished = true
    fall.play()
    member.fallMixer = mixer
    mixer.update(0)
    // A final burst can catch the other crew member mid-fall as simulation stops.
    if (this.members.every(other => !other.health.alive))
      for (const other of this.members)
        if (other.fallMixer) {
          other.fallMixer.update(this.deathClip.duration)
          this.finishFall(other)
        }
    return true
  }

  finishFall(member) {
    member.mesh.position.y -= new THREE.Box3().setFromObject(member.figure, true).min.y
    member.fallMixer = null
  }

  update(dt, charge) {
    this.recoil = Math.max(0, this.recoil - dt * 4)
    for (const member of this.members) {
      if (member.fallMixer) {
        member.fallMixer.update(dt)
        if (member.fallMixer.time >= this.deathClip.duration) this.finishFall(member)
      } else if (member.health.alive && member.round) {
        if (member.reload === reloadTime && member.needsRound) {
          member.reload = 0
          member.needsRound = false
        }
        if (member.reload < reloadTime) loadRound(member, this.elevation, dt)
      } else if (member.health.alive && !member.rifleman && (this.recoil !== this.lastRecoil || charge !== this.lastCharge)) {
        member.pose.blend(charge, this.recoil)
      }
    }
    this.lastCharge = charge
    this.lastRecoil = this.recoil
  }
}
