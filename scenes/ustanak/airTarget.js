/** An airplane of the scenery as a target of the duel's shells, measured in metres by `projection`: a burst fells it. */
export default function airTarget(plane, projection) {
  return {
    airborne: true,
    get x() {
      return projection.toWorld(plane).x
    },
    get y() {
      return projection.toWorld(plane).y
    },
    z: 0,
    // the shells fly in the plane of the picture, so the depth of the box never misses them
    get size() {
      return { length: plane.width / projection.pxPerMeter, height: plane.height / projection.pxPerMeter, width: Infinity }
    },
    get alive() {
      return plane.alive && plane.shown
    },
    get dead() {
      return !this.alive
    },
    takeHit() {
      plane.die()
    },
  }
}
