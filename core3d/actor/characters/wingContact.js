import { AnimationMixer, BufferAttribute, LoopOnce, Matrix4, Vector3 } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

/** The demon's skin includes long wing tips without wing bones. Fold the parts that meet the floor as it settles. */
export default function wingContact(mesh, clip, height) {
  const sample = clone(mesh)
  const mixer = new AnimationMixer(sample)
  const fall = mixer.clipAction(clip).setLoop(LoopOnce, 1)
  fall.clampWhenFinished = true
  fall.play()
  mixer.update(clip.duration)
  sample.updateMatrixWorld(true)
  const point = new Vector3()
  const floor = Math.min(...[['Hips', .11], ['Head', .08], ['LeftFoot', .04], ['RightFoot', .04]]
    .map(([bone, clearance]) => sample.getObjectByName('mixamorig' + bone).getWorldPosition(point).y - height * clearance))
  const parts = []
  for (const skin of sample.getObjectsByProperty('isSkinnedMesh', true)) {
    const target = mesh.getObjectByName(skin.name)
    const geometry = skin.geometry.clone()
    const { position, skinIndex, skinWeight } = geometry.attributes
    const offsets = new Float32Array(position.count * 3)
    const bone = new Matrix4(), transform = new Matrix4()
    for (let i = 0; i < position.count; i++) {
      skin.localToWorld(skin.getVertexPosition(i, point))
      if (point.y >= floor) continue
      const lift = floor - point.y
      transform.elements.fill(0)
      for (let j = 0; j < 4; j++) {
        const weight = skinWeight.getComponent(i, j)
        if (!weight) continue
        const index = skinIndex.getComponent(i, j)
        bone.multiplyMatrices(skin.skeleton.bones[index].matrixWorld, skin.skeleton.boneInverses[index])
        for (let k = 0; k < 16; k++) transform.elements[k] += weight * bone.elements[k]
      }
      transform.premultiply(skin.bindMatrixInverse).multiply(skin.bindMatrix).premultiply(skin.matrixWorld).invert()
      point.fromArray(transform.elements, 4).multiplyScalar(lift).toArray(offsets, i * 3)
    }
    geometry.morphTargetsRelative = true
    geometry.morphAttributes.position = [new BufferAttribute(offsets, 3)]
    target.geometry = geometry
    target.updateMorphTargets()
    parts.push(target)
  }
  mixer.stopAllAction()
  return parts
}
