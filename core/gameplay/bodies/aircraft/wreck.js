import { earthGravity } from '../../gravity.js'

/**
 * A shot down plane keeps its speed and gravity bends its path down: how much harder than its world pulls, and the
 * share of its forward speed the dead engine loses each second, so the dive steepens as it falls.
 */
export const wreckFall = { fall: 19.5 / earthGravity, drag: .5 }

/**
 * One step of a shot down plane's fall, nose along its path. Once it reaches `groundAt(x)` it stops there, `crashed`,
 * and `onCrash(point)` destroys what it hits.
 */
export function fall(plane, dt) {
  if (plane.crashed) return
  plane.vx *= Math.exp(-wreckFall.drag * dt)
  plane.vy -= plane.gravity * wreckFall.fall * dt
  plane.pitch = Math.atan2(plane.vy, plane.forward * plane.vx)
  const ground = plane.groundAt(plane.x)
  if (plane.y + plane.vy * dt > ground) return
  plane.crashed = true
  plane.y = ground
  plane.vx = plane.vy = 0
  plane.onCrash({ x: plane.x, y: ground })
}
