import { MathUtils, Vector3 } from 'three'

const linkPitch = .084
const halfGauge = .77

/** Scroll each belt by its own distance between two observed chassis poses. */
export function hotchkissTrackMotion(mesh, readPose) {
  const names = ['track-left', 'track-right']
  const belts = names.map(name => mesh.getObjectByName(name))
  if (belts.some(part => !part?.material.map)) return null
  const originals = belts.map(part => part.material)
  const materials = originals.map(original => {
    const material = original.clone()
    material.map = original.map.clone()
    return material
  })
  belts.forEach((part, index) => {
    part.material = materials[index]
  })
  mesh.updateWorldMatrix(true, true)
  const scale = belts[0].getWorldScale(new Vector3()).x
  let { x, z, yaw } = readPose()
  return {
    update() {
      const pose = readPose()
      const turn = Math.atan2(Math.sin(pose.yaw - yaw), Math.cos(pose.yaw - yaw))
      const heading = yaw + turn / 2
      const ahead = (pose.x - x) * Math.cos(heading) - (pose.z - z) * Math.sin(heading)
      ;({ x, z, yaw } = pose)
      if (pose.dead || Math.abs(ahead) + Math.abs(turn) < 1e-7) return
      materials.forEach(({ map }, index) => {
        const distance = ahead + (index ? 1 : -1) * turn * halfGauge * scale
        map.offset.x = MathUtils.euclideanModulo(map.offset.x + distance / (linkPitch * scale), 1)
      })
    },
    dispose() {
      belts.forEach((part, index) => {
        part.material = originals[index]
      })
      for (const material of materials) {
        material.map.dispose()
        material.dispose()
      }
    },
  }
}

/** The original Hotchkiss faces +z; the character view and its cannon expect -z. */
export default function hotchkissTracks(mesh, body) {
  mesh.children[0]?.rotateY(Math.PI)
  return hotchkissTrackMotion(mesh, () => body)
}
