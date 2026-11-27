/**
 * The gun of a vehicle crossing the street: once it may fire it waits `first` seconds, then fires every `interval`
 * seconds, each shot taking `damage` of the player's health; `sinceShot` is for the view.
 */
export default class VehicleGun {
  constructor({ interval, damage, first = 1.5 }) {
    Object.assign(this, { interval, damage })
    this.wait = first
    this.sinceShot = Infinity
  }

  /** Whether it fires in this step; it counts down only while it is `ready`. */
  update(dt, ready) {
    this.sinceShot += dt
    if (!ready) return false
    this.wait -= dt
    if (this.wait > 0) return false
    this.wait += this.interval
    this.sinceShot = 0
    return true
  }
}
