import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Health from '/core/gameplay/Health.js'
import { loadedModel } from '/core3d/assets/models.js'
import { regular, resistanceFighterModel } from '/core3d/actor/derived/ww2/partisanLooks.js'
import { fitCrewPose } from './crewPose.js'

/** The two who serve the gun: the gunner at the trail and the loader at the breech. */
export const stations = [
  { x: .87, z: .48, yaw: 1.02, loader: false, model: regular },
  { x: -.45, z: .98, yaw: -.68, loader: true, model: resistanceFighterModel },
]
export const memberHealth = 48
/** What to load; a game awaits requestModels(models) before it makes a crew. */
export const models = stations.map(station => station.model)

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
export const reload = { align: .25, insert: .48, total: .75 }
const roundBase = -.18, roundTip = .193
function loadRound(member, elevation, dt) {
  const { mesh, pose, round } = member
  member.reload = Math.min(reload.total, member.reload + dt)
  const align = THREE.MathUtils.smoothstep(member.reload, 0, reload.align)
  const insert = THREE.MathUtils.smoothstep(member.reload, reload.align, reload.insert)
  const withdraw = THREE.MathUtils.smoothstep(member.reload, reload.insert, reload.total)
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
  constructor(carriage, { elevation = carriage.getObjectByName('Elevation'), positions = stations, fallModel = regular } = {}) {
    this.elevation = elevation
    this.deathClip = loadedModel(fallModel).userData.animations.find(clip => clip.name === fallModel.animDict.death)
    this.members = positions.map(({ x, z, yaw, loader, model }) => {
      const mesh = new THREE.Group(), figure = clone(loadedModel(model))
      const pose = fitCrewPose(figure, loader)
      mesh.add(figure)
      mesh.position.set(x, 0, z)
      mesh.rotation.y = yaw
      carriage.add(mesh)
      const member = { mesh, figure, pose, health: new Health({ maximum: memberHealth }) }
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

  get ready() {
    return this.loader.health.alive && this.loader.reload === reload.total && !this.loader.needsRound
  }

  fired() {
    this.brace()
    this.loader.needsRound = true
  }

  brace() {
    this.recoil = 1
  }

  /** The living member a hit takes: the gunner first, then the loader, so the gun fires until the last falls (owner). */
  pickTarget() {
    return this.members.find(member => member.health.alive)
  }

  hit(member, damage, scene) {
    if (!member.health.damage(damage)) return false
    scene.attach(member.mesh)
    if (member.round) member.round.visible = false
    member.figure.position.set(0, 0, 0)
    const mixer = new THREE.AnimationMixer(member.figure)
    const fall = mixer.clipAction(this.deathClip)
    fall.setLoop(THREE.LoopOnce, 1)
    fall.clampWhenFinished = true
    fall.play()
    member.fallMixer = mixer
    mixer.update(0)
    return true
  }

  /** Lays the fallen member on the ground, measured in his final pose. */
  finishFall(member) {
    member.mesh.updateMatrixWorld(true)
    member.figure.traverse(part => part.skeleton?.update())
    member.mesh.position.y -= new THREE.Box3().setFromObject(member.figure, true).min.y
    member.fallMixer = null
  }

  update(dt, charge, loading = false) {
    this.recoil = Math.max(0, this.recoil - dt * 4)
    for (const member of this.members)
      if (member.fallMixer) {
        member.fallMixer.update(dt)
        if (member.fallMixer.time >= this.deathClip.duration) this.finishFall(member)
      } else if (member.health.alive && member.round) {
        if (loading && member.reload === reload.total && member.needsRound) {
          member.reload = 0
          member.needsRound = false
        }
        if (loading && member.reload < reload.total) loadRound(member, this.elevation, dt)
      } else if (member.health.alive && (this.recoil !== this.lastRecoil || charge !== this.lastCharge))
        member.pose.blend(charge, this.recoil)

    this.lastCharge = charge
    this.lastRecoil = this.recoil
  }
}
