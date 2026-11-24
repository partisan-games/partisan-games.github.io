import { AnimationMixer, LoopOnce, Vector3 } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { loadedModel } from '/core3d/assets/models.js'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'
import { Flame } from '/core3d/Particles.js'
import { model as worker } from '/core3d/actor/derived/ww2/Worker.js'
import { mountMetalPipe, pipeSwingName, smoothPipeSwing } from '/core3d/actor/derived/ww2/WorkerPipe.js'

const heldFrame = .32

const motions = {
  pipe: { idle: 'Shooting', walk: 'Pistol Walk', attack: pipeSwingName },
  rifle: { idle: 'Rifle Aiming Idle', walk: 'Rifle Walk', attack: 'Firing Rifle' },
  pistol: { idle: 'Shooting', walk: 'Pistol Walk', attack: 'Shooting' },
  heavy: { idle: 'Rifle Aiming Idle', walk: 'Rifle Walk', attack: 'Crouch Rapid Fire' },
}
const animDict = {
  ...Object.fromEntries(Object.entries(motions).flatMap(([pose, clips]) =>
    Object.entries(clips).map(([state, name]) => [pose + state, name]))),
  pipeRest: 'Warrior Idle',
}
export const prisonerModel = { ...worker, animDict }

const leftArmTrack = /^mixamorigLeft(?:Shoulder|Arm|ForeArm|Hand)/

function inPlace(clip, state) {
  const animation = clip.clone()
  // Keep the left arm in the worker's relaxed pose while the right hand holds the pipe.
  if (state === 'pipeRest') animation.tracks = animation.tracks.filter(track => leftArmTrack.test(track.name))
  else if (state.startsWith('pipe')) animation.tracks = animation.tracks.filter(track => !leftArmTrack.test(track.name))
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
    const rest = clips.get(motions.pipe.idle)
    // The full combo winds up behind the camera. Blend it toward the held pose in first person.
    clips.set(pipeSwingName, smoothPipeSwing(animations, { restName: rest.name, restTime: rest.duration * heldFrame, strength: .18 }))
    this.clips = new Map(Object.entries(animDict).map(([state, name]) =>
      [state, this.mixer.clipAction(inPlace(clips.get(name), state))]))
    this.attachments = new Map()
    this.current = { grip: mountMetalPipe(this.model, { tipLength: .32 }), pose: 'pipe' }
    this.update(0)
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
    this.current.grip.visible = false
    this.current = attachment
    this.current.grip.visible = true
    this.update(0)
  }

  update(dt, time) {
    const { body, current } = this
    this.model.visible = body.alive
    if (!body.alive) return

    const { swing } = body
    const holdingPipe = current.pose === 'pipe'
    const motion = swing ? 'attack' : body.moving ? 'walk' : 'idle'
    const action = this.clips.get(current.pose + motion)
    if (action !== this.action) {
      this.action?.stop()
      action.reset()
      if (motion === 'attack') action.setLoop(LoopOnce, 1).setEffectiveTimeScale(action.getClip().duration / swing.length)
      if ((holdingPipe || current.pose === 'pistol') && motion === 'idle') {
        action.time = action.getClip().duration * heldFrame
        action.paused = true
      }
      action.play()
      this.action = action
    }
    const arm = holdingPipe ? this.clips.get('pipeRest') : null
    if (arm !== this.armAction) {
      this.armAction?.stop()
      if (arm) {
        arm.reset()
        arm.time = arm.getClip().duration * heldFrame
        arm.paused = true
        arm.play()
      }
      this.armAction = arm
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
