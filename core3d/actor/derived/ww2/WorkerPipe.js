import { AnimationClip, Group, LatheGeometry, Mesh, MeshStandardMaterial, Quaternion, Vector2, Vector3 } from 'three'
import { model as worker } from './Worker.js'

export const pipeSwingName = 'One Hand Sword Combo'
const animDict = { ...worker.animDict, attack: pipeSwingName }
// Both FBXs use the same Mixamo rig and bind axes.
export const pipeSwingModel = { ...worker, animDict }

const clamp = value => Math.max(0, Math.min(value, 1))
const smooth = value => value * value * (3 - 2 * value)

/** Ease the recorded swing into the pose used when the worker holds the pipe. */
export function smoothPipeSwing(animations, { restName = worker.animDict.idle, restTime = 0, strength = 1 } = {}) {
  const swing = animations.find(clip => clip.name === pipeSwingName)
  const rest = animations.find(clip => clip.name === restName)
  const restTracks = new Map(rest.tracks.map(track => [track.name, track]))
  const lead = .18
  const recovery = .36
  const duration = lead + swing.duration + recovery
  const samples = Math.ceil(duration * 30)
  const times = Array.from({ length: samples + 1 }, (_, i) => i * duration / samples)
  const tracks = swing.tracks.map(track => {
    const neutralTrack = restTracks.get(track.name)
    if (!neutralTrack) {
      const held = track.clone()
      held.shift(lead)
      return held
    }

    const source = track.createInterpolant()
    const neutral = neutralTrack.createInterpolant().evaluate(restTime)
    const first = Array.from(source.evaluate(0))
    const hips = track.name === 'mixamorigHips.position'
    const rotation = track.ValueTypeName === 'quaternion'
    const start = rotation ? new Quaternion().fromArray(neutral) : null
    const toward = rotation ? new Quaternion() : null
    const values = times.flatMap(time => {
      const pose = Array.from(source.evaluate(Math.max(0, Math.min(time - lead, swing.duration))))
      if (hips) for (const axis of [0, 2]) pose[axis] += neutral[axis] - first[axis]
      const weight = strength * smooth(clamp(Math.min(time / (lead + .09), (duration - time) / (recovery + .06))))
      if (rotation) return toward.fromArray(pose).slerp(start, 1 - weight).toArray()
      return pose.map((value, axis) => neutral[axis] + (value - neutral[axis]) * weight)
    })
    return new track.constructor(track.name, times, values)
  })
  return new AnimationClip(pipeSwingName, duration, tracks)
}

export function mountMetalPipe(model, { tipLength = .25 } = {}) {
  const hand = model.getObjectByName('mixamorigRightHand')
  const finger = model.getObjectByName('mixamorigRightHandIndex1')
  const thumb = model.getObjectByName('mixamorigRightHandThumb1')
  const grip = new Group()
  grip.name = 'MetalPipe'
  hand.add(grip)
  finger.getWorldPosition(grip.position).lerp(thumb.getWorldPosition(new Vector3()), .48)
  hand.worldToLocal(grip.position)
  grip.scale.setScalar(1 / hand.getWorldScale(new Vector3()).x)

  const profile = [[.011, -tipLength], [.014, -tipLength], [.014, .14], [.011, .14], [.011, -tipLength]]
    .map(([radius, y]) => new Vector2(radius, y))
  const material = new MeshStandardMaterial({ color: 0x747c80, metalness: .28, roughness: .69 })
  const tube = new Mesh(new LatheGeometry(profile, 14), material)
  tube.rotation.set(.15, 0, Math.PI / 2 - .23)
  grip.add(tube)
  return grip
}
