/**
 * How a 2D view draws a world in metres (+y up) on the canvas in pixels (y down). The scene owns its projection and
 * gives it to its views; bodies never know which one is in use.
 */

/** Seen from the side: x across, y up from the ground line at `groundY` pixels; z is depth and is not drawn. */
export function sideProjection({ pxPerMeter, groundY }) {
  return {
    pxPerMeter,
    point: ({ x, y }) => ({ x: x * pxPerMeter, y: groundY - y * pxPerMeter }),
    length: metres => metres * pxPerMeter,
    /** The screen angle of the world direction `yaw`, `pitch`. */
    angle: (yaw, pitch = 0) => Math.atan2(-Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)),
    /** Whether a picture drawn facing right is turned to face the body's way. */
    mirrored: body => Math.cos(body.yaw) < 0,
    toWorld: ({ x, y }) => ({ x: x / pxPerMeter, y: (groundY - y) / pxPerMeter, z: 0 }),
  }
}

/** Seen from above: x across, z down the screen; altitude y is not drawn. */
export function topProjection({ pxPerMeter }) {
  return {
    pxPerMeter,
    point: ({ x, z }) => ({ x: x * pxPerMeter, y: z * pxPerMeter }),
    length: metres => metres * pxPerMeter,
    angle: yaw => -yaw,
    mirrored: () => false,
    toWorld: ({ x, y }) => ({ x: x / pxPerMeter, y: 0, z: y / pxPerMeter }),
  }
}
