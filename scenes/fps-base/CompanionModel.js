import { AnimationUtils, LoopOnce } from 'three'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import { loadedModel } from '/core3d/assets/models.js'
import { mountMetalPipe, smoothPipeSwing, pipeSwingName } from '/core3d/actor/derived/ww2/WorkerPipe.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { variants } from '/core3d/actor/derived/ww2/partisanLooks.js'
import { escapingPrisoner } from './EscapingPrisoners.js'

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

export default class CompanionModel extends CharacterModel {
  constructor(body, { index, textures, ...options }) {
    const mesh = loadedModel(escapingPrisoner.model)
    const { animDict } = escapingPrisoner
    const source = mesh.userData.animations
    const idle = source.find(clip => clip.name === animDict.crouchIdle)
    const swing = smoothPipeSwing(source)
    // The first/last holds are not part of getting up; keep the recorded movement and recovery.
    const stand = alignCrouch(AnimationUtils.subclip(source.find(clip => clip.name === animDict.crouchUp),
      animDict.crouchUp, 24, 72, 30), idle, true)
    const animations = source.map(clip => {
      if (clip.name === pipeSwingName) return swing
      if (clip.name === animDict.crouchUp) return stand
      if (clip.name === animDict.crouchWalk) return alignCrouch(clip, idle, true)
      if ([animDict.crouchRest, animDict.crouchPeek].includes(clip.name)) return alignCrouch(clip, idle)
      return clip
    })
    animations.push(reverseTransition(stand))
    body.actions.attack = swing.duration
    super(body, { mesh, animations, animDict: { ...animDict, crouchDown: 'Stand To Crouch' }, ...options })
    this.mesh.scale.multiplyScalar(companionLooks[index].height / 1.8)
    dressFighter(this.mesh, companionLooks[index].outfit, textures)
    mountMetalPipe(this.mesh, { tipLength: .32 })
    this.idlePhases = {}
    for (const state of ['crouchIdle', 'crouchRest']) {
      this.idlePhases[state] = this.actions[state].getClip().duration * index / companionLooks.length
      this.actions[state].time = this.idlePhases[state]
      this.actions[state].setEffectiveTimeScale(.94 + index * .06)
    }
  }

  play(name) {
    const changed = name !== this.clip
    super.play(name)
    if (changed && ['crouchIdle', 'crouchRest'].includes(name)) this.actions[name].time = this.idlePhases?.[name] ?? 0
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
