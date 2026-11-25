import { LoopOnce, LoopRepeat } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Animator from '/core3d/actor/Animator.js'
import { loadedModel } from '/core3d/assets/models.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'

/**
 * The German rifleman with the clips of a soldier who fights from cover: he rises to fire, and he crouches behind it
 * with the top of his head 1.04 m up, under the `crouch` height of his body.
 */
const animDict = { run: 'Rifle Run', crouch: 'Crouching Idle', aim: 'Rifle Aiming Idle', fire: 'Firing Rifle', death: 'Dying' }
const meshModel = { file: 'german-soldier.fbx', angle: Math.PI, animDict, prefix: 'character/soldier/', size: 1.8 }
const rifleModel = { file: 'weapon/rifle.fbx', scale: 1.33, angle: Math.PI }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rifleModel]

/** Seconds one clip blends into the next. */
const fade = .25
/**
 * Many of them fill a scene, so one farther than `distance` metres from the viewer, where the difference does not
 * show, casts no shadow and moves his bones only every `frames` frames.
 */
export const far = { distance: 50, frames: 3 }

/**
 * A `CoverSoldier` as a 3D German rifleman, who faces where he runs, then his target, and otherwise the `front`
 * `{ x, z }` he holds. In the open he stands aiming; behind cover he crouches until he rises to aim and fire, and he
 * falls where he is shot, and lies still. His burst sounds from where he is. A `viewer` `{ x, z }` lets a far one
 * cost less.
 */
export default class CoverSoldierModel {
  constructor(body, { front = { x: 0, z: 0 }, viewer = null } = {}) {
    Object.assign(this, { body, front, viewer })
    const mesh = loadedModel(meshModel)
    this.mesh = clone(mesh)
    this.anim = new Animator({ mesh: this.mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon: loadedModel(rifleModel) })
    this.burstSound = new Sound('rafal.mp3', { loop: true, profile: 'rifle', spatial: audioPoint(this) })
    this.sounds = [this.burstSound]
    this.clip = null
    this.yaw = 0
    this.distant = false
    this.frame = 0
    this.pending = 0
    this.update(0)
  }

  /** The clip of what the body does now. */
  get chosenClip() {
    const { state, inCover } = this.body
    if (state === 'dead') return 'death'
    if (state === 'move') return 'run'
    if (state === 'attack') return 'fire'
    return inCover && state !== 'aim' ? 'crouch' : 'aim'
  }

  /** The point he faces: where he runs, whom he fires at, or else his front. */
  get facing() {
    const { body } = this
    if (body.state === 'move' && body.goal) return body.goal
    if ((body.state === 'aim' || body.state === 'attack') && body.target) return body.target
    return this.front
  }

  play(name) {
    if (name === this.clip) return
    const { actions } = this.anim
    const previous = actions[this.clip], action = actions[name]
    this.clip = name
    action.reset()
    action.setLoop(name === 'death' ? LoopOnce : LoopRepeat, Infinity)
    action.clampWhenFinished = true
    if (previous) action.crossFadeFrom(previous, fade)
    action.play()
  }

  update(dt) {
    const { body, mesh } = this
    if (body.alive) {
      const { x, z } = this.facing
      if (x !== body.x || z !== body.z) this.yaw = Math.atan2(body.z - z, x - body.x)
    }
    mesh.position.set(body.x, body.y - body.size.height / 2, body.z)
    // the model faces -z, the body +x at yaw 0
    mesh.rotation.set(0, this.yaw - Math.PI / 2, 0)
    this.burstSound.setPlaying(body.state === 'attack')
    this.play(this.chosenClip)
    this.animate(dt)
  }

  get lying() {
    return this.clip === 'death' && !this.anim.actions.death.isRunning()
  }

  animate(dt) {
    const { body, viewer } = this
    const distant = Boolean(viewer) && Math.hypot(body.x - viewer.x, body.z - viewer.z) > far.distance
    if (distant !== this.distant) {
      this.distant = distant
      this.mesh.traverse(part => {
        if (part.isMesh) part.castShadow = !distant
      })
    }
    if (this.lying) return
    this.pending += dt
    if (distant && ++this.frame % far.frames) return
    this.anim.update(this.pending)
    this.pending = 0
  }
}
