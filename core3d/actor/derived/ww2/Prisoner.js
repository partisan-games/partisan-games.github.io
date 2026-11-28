import { AnimationUtils, LoopOnce } from 'three'
import { loadedModel } from '/core3d/assets/models.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { mountMetalPipe, smoothPipeSwing, pipeSwingName } from './WorkerPipe.js'
import { description as worker } from './Worker.js'

/** Ways to stand and wait, one for each companion in turn, so they do not all move alike; one stretches. */
export const standingIdles = ['Idle', 'Dwarf Idle', worker.animDict.idle]
const animDict = { ...worker.animDict, idle: standingIdles[0], restIdle: standingIdles[1],
  // the pipe swing eases from this pose
  swingRest: worker.animDict.idle, run: 'Running', attack: pipeSwingName,
  crouchWalk: 'Crouched Walking', crouchIdle: 'Crouching Idle', crouchRest: 'Crouch Idle',
  crouchPeek: 'Crouch Look Around Corner', crouchUp: 'Crouch To Stand', crouchDown: 'Standing To Crouched',
  injuredIdle: 'Injured Idle' }
/**
 * A prisoner of the camp: the worker's model with the crouching, resting, peering, getting-up and crouching-down
 * recordings, and a wounded man's way of standing.
 */
export const description = { ...worker, model: { ...worker.model, animDict }, animDict }
export const models = [description.model]

const shirt = 'mat_15-27374EA0.jpg', trousers = 'mat_9-27375500.jpg'
const cap = 'mat_11-27373E00.jpg', face = 'mat_12-27374460.jpg'

/** The three men who break out with the player, in their own civilian clothes and proportions. */
export const prisonerLooks = [
  { name: 'Ilija', height: 1.70, breadth: 1.09, outfit: { [shirt]: 'brown-wool-shirt.jpg', [trousers]: 0xa08c72,
    [cap]: 0x87766a, [face]: 'prisoners-pixel-art/ilija.webp' } },
  { name: 'Petar', height: 1.82, breadth: .94, outfit: { [shirt]: 'indigo-work-shirt.jpg', [trousers]: 0x777d7f,
    [cap]: 0x535965, [face]: 'prisoners-pixel-art/petar.webp' } },
  { name: 'Jovan', height: 1.76, breadth: 1, outfit: { [shirt]: 'brka-pixel-art/shirt.webp', [trousers]: 0xa89775,
    [cap]: 0xc0a987, [face]: 'prisoners-pixel-art/jovan.webp' } },
]

/** Keep every crouching recording on the same horizontal origin; the controller moves the body. */
function alignCrouch(clip, idle, inPlace = false) {
  const animation = clip.clone()
  const origin = idle.tracks.find(track => track.name === 'mixamorigHips.position').values
  const root = animation.tracks.find(track => track.name === 'mixamorigHips.position')
  const x = root.values[0], z = root.values[2]
  for (let i = 0; i < root.values.length; i += 3) {
    root.values[i] = origin[0] + (inPlace ? 0 : root.values[i] - x)
    root.values[i + 2] = origin[2] + (inPlace ? 0 : root.values[i + 2] - z)
  }
  return animation
}

/** How far forward the hips of `clip` have gone at `time` since its start, in the model's units. */
function hipsForward(clip, time) {
  const root = clip.tracks.find(track => track.name === 'mixamorigHips.position')
  return root.createInterpolant().evaluate(time)[2] - root.values[2]
}

/** A character whose steps are quieter while he crouches. */
export class PrisonerFootsteps extends CharacterModel {
  step(before) {
    this.stepSound.volume = this.body.crouched ? .22 : 1
    super.step(before)
  }
}

/**
 * A prisoner as `prisonerLooks[index]`, with a metal pipe: his crouching rests start at different moments and tempos
 * from the others', getting up or down follows his `posture`, and wounded he stands as one.
 */
export default class PrisonerModel extends PrisonerFootsteps {
  constructor(body, { index, textures, ...options }) {
    const mesh = loadedModel(description.model)
    const { animDict } = description
    const source = mesh.userData.animations
    const idle = source.find(clip => clip.name === animDict.crouchIdle)
    const swing = smoothPipeSwing(source)
    // The first/last holds are not part of getting up; keep the recorded movement and recovery.
    const recordedStand = AnimationUtils.subclip(source.find(clip => clip.name === animDict.crouchUp),
      animDict.crouchUp, 24, 72, 30)
    // played in place: the body itself takes the recorded step, so the planted foot stays put
    const stand = alignCrouch(recordedStand, idle, true)
    const recordedCrouch = source.find(clip => clip.name === animDict.crouchDown)
    const animations = source.map(clip => {
      if (clip.name === pipeSwingName) return swing
      if (clip.name === animDict.crouchUp) return stand
      if (clip.name === animDict.crouchDown) return alignCrouch(clip, idle, true)
      if (clip.name === animDict.crouchWalk) return alignCrouch(clip, idle, true)
      if ([animDict.crouchRest, animDict.crouchPeek].includes(clip.name)) return alignCrouch(clip, idle)
      return clip
    })
    body.actions.attack = swing.duration
    super(body, { mesh, animations,
      animDict: { ...animDict, idle: standingIdles[index % standingIdles.length] }, ...options })
    const look = prisonerLooks[index]
    this.mesh.scale.multiplyScalar(look.height / 1.8)
    this.mesh.scale.x *= look.breadth
    dressFighter(this.mesh, look.outfit, textures)
    mountMetalPipe(this.mesh, { tipLength: .32 })
    this.recorded = { crouchUp: recordedStand, crouchDown: recordedCrouch }
    this.idlePhases = {}
    for (const state of ['idle', 'crouchIdle', 'crouchRest']) {
      this.idlePhases[state] = this.actions[state].getClip().duration * index / prisonerLooks.length
      this.actions[state].time = this.idlePhases[state]
      this.actions[state].setEffectiveTimeScale(.94 + index * .06)
    }
  }

  /**
   * How far forward, in metres, the body has stepped `time` seconds into getting up or crouching down, as the
   * recording moves his hips: up he steps forward, down back, about as far, so he keeps his place in the group.
   */
  postureShift(name, time) {
    return hipsForward(this.recorded[name], time) * this.hipsScale
  }

  /** How long getting up and crouching down take, as recorded. */
  get postureDurations() {
    return { crouchDown: this.actions.crouchDown.getClip().duration, crouchUp: this.actions.crouchUp.getClip().duration }
  }

  /** How many metres a unit of the recorded hips is: the scales of everything between the hips and the whole. */
  get hipsScale() {
    let scale = 1
    for (let part = this.mesh.getObjectByName('mixamorigHips').parent; part !== this.mesh.parent; part = part.parent)
      scale *= part.scale.z
    return scale
  }

  play(name) {
    const changed = name !== this.clip
    super.play(name)
    if (name === 'run') this.actions.run.setEffectiveTimeScale(Math.max(.85, Math.min(1.15,
      Math.hypot(this.body.vx, this.body.vz) / 4)))
    if (changed && ['idle', 'crouchIdle', 'crouchRest'].includes(name)) this.actions[name].time = this.idlePhases?.[name] ?? 0
    if (this.body.posture?.name === name) {
      this.actions[name].setLoop(LoopOnce, 1)
      this.actions[name].paused = true
      this.actions[name].time = this.body.posture.time
    }
  }

  chooseClip() {
    const { body } = this
    if (body.alive && !body.swing && body.posture) return body.posture.name
    if (body.alive && !body.swing && body.crouched)
      return body.state === 'move' ? 'crouchWalk' : (body.waitPose ?? 'crouchIdle')
    const clip = super.chooseClip()
    return clip === 'idle' && this.wounded ? 'injuredIdle' : clip
  }

  /** Hit down to under half his health, he stands bent over his wound. */
  get wounded() {
    return this.body.health.current < this.body.health.maximum / 2
  }
}
