import { AnimationMixer, LoopOnce, Vector3 } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { loadedModel } from '/core3d/assets/models.js'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'
import { Flame } from '/core3d/Particles.js'
import { model as worker } from '/core3d/actor/derived/ww2/Worker.js'

const heldFrame = .32
const crouchClip = 'Crouched Walking'
const postureBlend = .16

const motions = {
  rifle: { idle: 'Rifle Aiming Idle', walk: 'Rifle Walk', attack: 'Firing Rifle' },
  pistol: { idle: 'Shooting', walk: 'Pistol Walk', attack: 'Shooting' },
  heavy: { idle: 'Rifle Aiming Idle', walk: 'Rifle Walk', attack: 'Crouch Rapid Fire' },
}
const animDict = {
  ...Object.fromEntries(Object.entries(motions).flatMap(([pose, clips]) =>
    Object.entries(clips).map(([state, name]) => [pose + state, name]))),
  sneakIdle: crouchClip,
  sneakWalk: crouchClip,
}
export const prisonerModel = { ...worker, animDict }

const armTrack = /^mixamorig(?:Left|Right)(?:Shoulder|Arm|ForeArm|Hand)/

function inPlace(clip, state) {
  const animation = clip.clone()
  if (state.startsWith('sneak')) animation.tracks = animation.tracks.filter(track => !armTrack.test(track.name))
  const root = animation.tracks.find(track => track.name === 'mixamorigHips.position')
  if (!root) return animation

  for (let i = 0; i < root.values.length; i += 3) {
    root.values[i] = root.values[0]
    root.values[i + 2] = root.values[2]
  }
  return animation
}

/** The whole worker is rendered. The first-person camera sits in front of his animated face. */
export default class PrisonerAvatar {
  constructor(body, scene, camera) {
    const source = loadedModel(prisonerModel)
    this.body = body
    this.camera = camera
    this.model = clone(source)
    this.model.name = 'PrisonerWorker'
    scene.add(this.model)
    this.model.updateMatrixWorld(true)
    this.head = this.model.getObjectByName('mixamorigHead')
    this.hand = this.model.getObjectByName('mixamorigRightHand')
    this.headPosition = new Vector3()
    this.mixer = new AnimationMixer(this.model)
    const { animations } = source.userData
    const clips = new Map(animations.map(clip => [clip.name, clip]))
    this.clips = new Map(Object.entries(animDict).map(([state, name]) =>
      [state, this.mixer.clipAction(inPlace(clips.get(name), state))]))
    this.crouchHolds = new Map(Object.entries(motions).map(([pose, { idle }]) => {
      const hold = clips.get(idle).clone()
      hold.tracks = hold.tracks.filter(({ name }) => armTrack.test(name))
      return [pose, this.mixer.clipAction(hold)]
    }))
    this.attachments = new Map()
  }

  equip(model, { pose, fire }) {
    let attachment = this.attachments.get(model.file)
    if (!attachment) {
      if (pose === 'pistol') {
        const grip = loadedModel(model).clone(true)
        this.hand.add(grip)
        attachment = { grip, pose }
      } else {
        const support = new TwoHandedGrip(this.model, model)
        if (pose === 'heavy') {
          support.propScale *= .78
          support.rifle.scale.multiplyScalar(.78)
        }
        attachment = { grip: support.rifle, support, pose }
        if (fire) {
          const flame = attachment.flame = new Flame({ num: 26, size: .38, minRadius: 0, maxRadius: .09, unitAngle: .08 })
          flame.mesh.visible = false
          flame.mesh.frustumCulled = false
          support.muzzle.add(flame.mesh)
          flame.mesh.scale.setScalar(1 / support.muzzle.getWorldScale(new Vector3()).x)
        }
      }
      attachment.grip.name = model.file
      this.attachments.set(model.file, attachment)
    }
    if (this.current) this.current.grip.visible = false
    this.current = attachment
    this.current.grip.visible = true
    this.update(0)
  }

  update(dt, time) {
    const { body, current } = this
    this.model.visible = body.alive
    if (!body.alive) return

    const { swing } = body
    const motion = swing ? 'attack' : body.moving ? 'walk' : 'idle'
    const crouching = body.crouched && !swing
    const creeping = crouching && Math.hypot(body.vx, body.vz) > .04
    const action = this.clips.get(crouching ? (creeping ? 'sneakWalk' : 'sneakIdle') : current.pose + motion)
    if (action !== this.action) {
      const previous = this.action
      action.reset()
      if (swing) action.setLoop(LoopOnce, 1).setEffectiveTimeScale(action.getClip().duration / swing.length)
      if ((crouching && !creeping) || (!crouching && current.pose === 'pistol' && motion === 'idle')) {
        action.time = action.getClip().duration * heldFrame
        action.paused = true
      }
      if (previous && (crouching || this.wasCrouching)) action.crossFadeFrom(previous, postureBlend)
      else previous?.stop()
      action.play()
      this.action = action
    }
    this.wasCrouching = crouching
    // The motion supplies the legs and back; the equipped weapon keeps its existing hand pose.
    const hold = crouching ? this.crouchHolds.get(current.pose) : null
    if (hold !== this.holdAction) {
      this.holdAction?.stop()
      if (hold) {
        hold.reset()
        hold.time = hold.getClip().duration * heldFrame
        hold.paused = true
        hold.play()
      }
      this.holdAction = hold
    }
    this.mixer.update(dt)
    this.model.updateMatrixWorld(true)
    current.support?.fitHands()
    if (current.flame) {
      const { flame } = current
      const firing = Boolean(swing?.landed)
      if (firing && !flame.mesh.visible) flame.reset({ unitAngle: .08 })
      flame.mesh.visible = firing
      flame.update(dt, time, { max: 7, loop: true })
    }

    this.head.getWorldPosition(this.headPosition)
    this.camera.position.copy(this.headPosition)
    this.camera.position.y -= .034
    this.camera.position.z -= .137
    this.camera.rotation.x = body.pitch
  }
}
