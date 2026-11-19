import { Quaternion, Vector3 } from 'three'

const positions = new WeakMap()
const listeners = new WeakMap()
const forwardAxis = Object.freeze({ x: 0, y: 0, z: -1 })
const upAxis = Object.freeze({ x: 0, y: 1, z: 0 })

/** Read the physical world transform after simulation, including any parent transforms. */
export function audioPosition(mesh) {
  let position = positions.get(mesh)
  if (!position) {
    position = new Vector3()
    positions.set(mesh, position)
  }
  return mesh.getWorldPosition(position)
}

export const audioPoint = owner => ({ getPosition: () => audioPosition(owner.mesh) })

/** Model axes are explicit; only a camera attached to the player's body supplies the FPS look direction. */
export function audioListener(player) {
  if (!player?.mesh) throw new Error('A spatial scene needs its actual player mesh')
  let frame = listeners.get(player)
  if (!frame) {
    frame = { position: new Vector3(), forward: new Vector3(), up: new Vector3(), rotation: new Quaternion(), identity: player }
    listeners.set(player, frame)
  }
  const view = player.camera?.parent === player.mesh ? player.camera : player.mesh
  view.getWorldQuaternion(frame.rotation)
  frame.position.copy(audioPosition(player.mesh))
  frame.forward.copy(view === player.mesh ? player.audioForward ?? forwardAxis : forwardAxis).applyQuaternion(frame.rotation)
  frame.up.copy(view === player.mesh ? player.audioUp ?? upAxis : upAxis).applyQuaternion(frame.rotation)
  frame.revision = player.audioRevision ?? 0
  return frame
}
