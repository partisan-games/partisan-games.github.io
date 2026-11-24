import * as THREE from 'three'

const { Vector3 } = THREE

/** The two ends of the gradient skies: blue overhead, white at the horizon. */
export const skyColors = { top: 0x0077ff, horizon: 0xffffff }

export const dir = {
  upForward: new Vector3(0, 1, -1),
  forward: new Vector3(0, 0, -1),
  upBackward: new Vector3(0, 1, 1),
  backward: new Vector3(0, 0, 1),
  left: new Vector3(-1, 0, 0),
  right: new Vector3(1, 0, 0),
  up: new Vector3(0, 1, 0),
  down: new Vector3(0, -1, 0),
}
