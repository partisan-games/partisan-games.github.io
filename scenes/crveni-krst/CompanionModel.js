import { AnimationUtils, LoopOnce } from 'three'
import { loadedModel } from '/core3d/assets/models.js'
import { mountMetalPipe, smoothPipeSwing, pipeSwingName } from '/core3d/actor/derived/ww2/WorkerPipe.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import { escapingPrisoner, standingIdles } from './EscapingPrisoners.js'
import { PrisonerFootsteps } from './stealth.js'

export const companionLooks = [
  { name: 'Ilija', height: 1.70, outfit: variants.vuna.outfit },
  { name: 'Petar', height: 1.82, outfit: variants.indigo.outfit },
  { name: 'Jovan', height: 1.76, outfit: { ...variants.oker.outfit, 'mat_12-27374460.jpg': 0xd6baa1 } },
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

function reverseTransition(clip) {
  const reversed = clip.clone()
  reversed.name = 'Stand To Crouch'
  for (const track of reversed.tracks) {
    const size = track.getValueSize(), values = track.values.slice()
    track.times = track.times.map(time => clip.duration - time).reverse()
    for (let i = 0; i < track.times.length; i++)
      track.values.set(values.subarray((track.times.length - i - 1) * size, (track.times.length - i) * size), i * size)
  }
  return reversed
}

export default class CompanionModel extends PrisonerFootsteps {
  constructor(body, { index, textures, ...options }) {
    const mesh = loadedModel(escapingPrisoner.model)
    const { animDict } = escapingPrisoner
    const source = mesh.userData.animations
    const idle = source.find(clip => clip.name === animDict.crouchIdle)
    const swing = smoothPipeSwing(source)
    // The first/last holds are not part of getting up; keep the recorded movement and recovery.
    const recordedStand = AnimationUtils.subclip(source.find(clip => clip.name === animDict.crouchUp),
      animDict.crouchUp, 24, 72, 30)
    // played in place: the body itself takes the recorded step, so the planted foot stays put
    const stand = alignCrouch(recordedStand, idle, true)
    const animations = source.map(clip => {
      if (clip.name === pipeSwingName) return swing
      if (clip.name === animDict.crouchUp) return stand
      if (clip.name === animDict.crouchWalk) return alignCrouch(clip, idle, true)
      if ([animDict.crouchRest, animDict.crouchPeek].includes(clip.name)) return alignCrouch(clip, idle)
      return clip
    })
    animations.push(reverseTransition(stand))
    body.actions.attack = swing.duration
    super(body, { mesh, animations,
      animDict: { ...animDict, idle: standingIdles[index % standingIdles.length], crouchDown: 'Stand To Crouch' }, ...options })
    this.mesh.scale.multiplyScalar(companionLooks[index].height / 1.8)
    dressFighter(this.mesh, companionLooks[index].outfit, textures)
    mountMetalPipe(this.mesh, { tipLength: .32 })
    this.recordedStand = recordedStand
    this.idlePhases = {}
    for (const state of ['idle', 'crouchIdle', 'crouchRest']) {
      this.idlePhases[state] = this.actions[state].getClip().duration * index / companionLooks.length
      this.actions[state].time = this.idlePhases[state]
      this.actions[state].setEffectiveTimeScale(.94 + index * .06)
    }
  }

  /**
   * How far forward, in metres, the body has stepped `time` seconds into getting up, as the recording moves his hips.
   * Crouching down stays in place: a step back would move him off his place in the group each time he stops.
   */
  postureShift(name, time) {
    return name === 'crouchUp' ? hipsForward(this.recordedStand, time) * this.mesh.scale.z : 0
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
    return super.chooseClip()
  }
}
