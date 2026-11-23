import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Health from '/core/gameplay/Health.js'
import { loadedModel } from '/core3d/assets/models.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { italianLooks } from '/core3d/actor/derived/ww2/italianLooks.js'
import { regular } from '/core3d/actor/derived/ww2/partisanLooks.js'
import { fitCrewPose } from './crewPose.js'
import { makeMortar, makeRound, models as mortarModels } from './mortarModel.js'

const looks = [italianLooks.rifle, italianLooks.berthier]
export const models = [...mortarModels, ...looks.map(look => look.model), regular]
const point = (x, y, z) => new THREE.Vector3(x, y, z)
const up = point(0, 1, 0)
const liftTime = .9, releaseTime = 1.3, cycleTime = 2.1

/** Shared mortar and crew animation; combat targets and ballistics belong to the scene. */
export default class MortarCrew {
  constructor() {
    this.mesh = makeMortar()
    this.states = ['idle', 'load', 'attack', 'dead']
    this.state = 'idle'
    this.health = new Health({ maximum: 96 })
    this.shotsFired = 0
    this.muzzle = this.mesh.getObjectByName('Muzzle')
    const death = loadedModel(regular).userData.animations.find(clip => clip.name === regular.animDict.death)
    this.members = looks.map((look, index) => {
      const figure = clone(loadedModel(look.model)), mesh = new THREE.Group()
      dressFighter(figure, look.outfit)
      look.equip(figure)
      const pose = fitCrewPose(figure, index === 1)
      mesh.add(figure)
      mesh.position.set(index ? .48 : -.50, 0, index ? .38 : .12)
      mesh.rotation.y = index ? 1.45 : -1.5
      this.mesh.add(mesh)
      const tracks = death.tracks.filter(track => figure.getObjectByName(track.name.split('.')[0]))
      return { mesh, figure, pose, health: new Health({ maximum: 48 }),
        death: new THREE.AnimationClip(death.name, death.duration, tracks) }
    })
    this.round = makeRound()
    this.mesh.add(this.round)
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffdba0, transparent: true, depthWrite: false }))
    this.flash.scale.setScalar(.001)
    this.flash.visible = false
    this.mesh.add(this.flash)
    this.smoke = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xc6c2af, transparent: true, depthWrite: false }))
    this.smoke.scale.setScalar(.001)
    this.smoke.visible = false
    this.mesh.add(this.smoke)
    this.time = 0
    this.effect = 1
    this.pose(0)
  }

  get ready() {
    return this.members.every(member => member.health.alive)
  }

  setState(state) {
    if (!this.states.includes(state) || !this.health.alive) return
    if (state === 'dead') return this.takeHit(this.health.current)
    if (state === 'idle') {
      this.state = state
      this.time = 0
      return
    }
    if (!this.ready || this.state === 'attack') return
    this.time = state === 'attack' && this.state === 'load' ? this.time : 0
    this.state = state
    this.released = false
  }

  /** Hit one operator at a time; a lost operator stops the drill until Reset. */
  takeHit(amount) {
    this.health.damage(amount)
    let remaining = amount
    for (const member of this.members) {
      const damage = Math.min(member.health.current, remaining)
      remaining -= damage
      if (!member.health.damage(damage)) continue
      member.figure.position.set(0, 0, 0)
      member.mixer = new THREE.AnimationMixer(member.figure)
      const fall = member.mixer.clipAction(member.death)
      fall.setLoop(THREE.LoopOnce, 1)
      fall.clampWhenFinished = true
      fall.play()
      member.mixer.update(0)
    }
    if (!this.ready) {
      this.state = this.health.alive ? 'idle' : 'dead'
      this.round.visible = false
      this.time = 0
    }
  }

  muzzleFrame() {
    const origin = this.mesh.worldToLocal(this.muzzle.getWorldPosition(new THREE.Vector3()))
    const axis = this.mesh.worldToLocal(this.muzzle.localToWorld(point(0, 0, 1))).sub(origin).normalize()
    return { origin, axis }
  }

  pose(time) {
    const { origin, axis } = this.muzzleFrame()
    const lift = THREE.MathUtils.smoothstep(time, 0, liftTime)
    const drop = THREE.MathUtils.smoothstep(time, liftTime, releaseTime)
    const withdraw = THREE.MathUtils.smoothstep(time, releaseTime, cycleTime)
    const gunner = this.members[0], loader = this.members[1]
    if (gunner.health.alive) {
      gunner.pose.blend(lift, withdraw * (1 - withdraw))
      gunner.pose.placeHands(this.mesh.localToWorld(point(-.17, .65, .14)),
        this.mesh.localToWorld(point(-.08, .72, .08)))
    }
    if (!loader.health.alive) return
    loader.pose.blend(lift * (1 - withdraw), withdraw * (1 - withdraw))
    if (!this.ready) return
    this.round.visible = drop < 1
    this.round.position.copy(point(.30, .72, .40)).lerp(origin.clone().addScaledVector(axis, .025 - drop * .35), lift)
    this.round.quaternion.identity().slerp(new THREE.Quaternion().setFromUnitVectors(up, axis), lift)
    const grip = (y, x) => this.round.localToWorld(point(x, y, 0))
    const left = grip(.10, -.027), right = grip(.22, .027)
    // Both hands clear the opening as soon as the round is released.
    const clear = THREE.MathUtils.smoothstep(time, liftTime, releaseTime)
    left.lerp(loader.pose.left.getWorldPosition(new THREE.Vector3()), clear)
    right.lerp(loader.pose.right.getWorldPosition(new THREE.Vector3()), clear)
    loader.pose.placeHands(left, right)
  }

  update(dt) {
    for (const member of this.members) if (member.mixer) {
      member.mixer.update(dt)
      if (member.mixer.time >= member.death.duration) {
        member.mesh.updateMatrixWorld(true)
        member.figure.traverse(part => part.skeleton?.update())
        const ground = this.mesh.getWorldPosition(new THREE.Vector3()).y
        member.mesh.position.y += ground - new THREE.Box3().setFromObject(member.figure, true).min.y
        member.mixer = null
      }
    }
    if (this.ready) {
      if (this.state === 'load') this.time = Math.min(liftTime, this.time + dt)
      if (this.state === 'attack') {
        this.time += dt
        if (!this.released && this.time >= releaseTime) {
          this.released = true
          this.shotsFired++
          this.effect = 0
        }
        if (this.time >= cycleTime) {
          this.state = 'idle'
          this.time = 0
        }
      }
    }
    this.pose(this.time)
    this.effect += dt
    const { origin, axis } = this.muzzleFrame()
    this.flash.visible = this.effect < .08
    this.flash.position.copy(origin)
    this.flash.scale.setScalar(.07)
    this.smoke.visible = this.effect < .8
    this.smoke.position.copy(origin).addScaledVector(axis, this.effect * .35)
    this.smoke.position.y += this.effect * .12
    this.smoke.scale.setScalar(.045 + this.effect * .16)
    this.smoke.material.opacity = Math.max(0, .32 * (1 - this.effect / .8))
  }

  end() {
    for (const member of this.members) member.mixer?.stopAllAction()
  }
}
