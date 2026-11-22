import { AnimationClip, Quaternion } from 'three'

/** Orientation of a bone in its skeleton's bind pose, independent of the model's scene scale and heading. */
function bindRotation(bone) {
  const rotation = new Quaternion()
  for (let joint = bone; joint?.isBone; joint = joint.parent) rotation.premultiply(joint.quaternion)
  return rotation
}

/** Transfer a Mixamo motion to matching bones, conserving their bind axes and the destination hip height. */
export default function fitClip(source, target, name) {
  const original = source.animations[0]
  const hips = target.getObjectsByProperty('isBone', true).find(bone => /^mixamorig.*Hips$/.test(bone.name))
  const prefix = hips?.name.slice(0, -4)
  const tracks = []
  for (const track of original.tracks) {
    const [joint, channel] = track.name.split('.')
    const from = source.getObjectByName(joint), to = target.getObjectByName(joint.replace(/^mixamorig/, prefix ?? 'mixamorig'))
    if (!from?.isBone || !to?.isBone) continue
    const copy = track.clone()
    copy.name = to.name + '.' + channel
    if (channel === 'quaternion') {
      const left = bindRotation(to.parent).invert().multiply(bindRotation(from.parent))
      const right = bindRotation(from).invert().multiply(bindRotation(to))
      const q = new Quaternion()
      for (let i = 0; i < copy.values.length; i += 4)
        q.fromArray(copy.values, i).premultiply(left).multiply(right).normalize().toArray(copy.values, i)
    } else if (joint === 'mixamorigHips' && channel === 'position') {
      const ratio = to.position.y / from.position.y
      for (let i = 0; i < copy.values.length; i++) copy.values[i] *= ratio
    } else continue
    tracks.push(copy)
  }
  if (!tracks.length) throw new Error(`No matching bones for ${name}`)
  return new AnimationClip(name, original.duration, tracks)
}
