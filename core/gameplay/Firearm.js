/**
 * The partisans' guns: a bolt-action rifle, a shot a click, five rounds in its clip; and the ZB vz. 26 light machine
 * gun, firing while the trigger is held, twenty rounds in its magazine. `repeat` is the seconds between shots,
 * `reload` the seconds to fill it again, `reach` metres and `damage` the range of a hit's damage.
 */
export const firearms = {
  rifle: { automatic: false, repeat: 1.2, magazine: 5, reload: 3, reach: 300, damage: [80, 120] },
  machineGun: { automatic: true, repeat: .12, magazine: 20, reload: 3, reach: 300, damage: [40, 60] },
}

/**
 * A gun in a shooter's hands: it fires when its trigger is pulled, a rifle once a pull, an automatic again and again
 * while it is held, each shot after `repeat` seconds. Its last round spent, it reloads for `reload` seconds.
 */
export default class Firearm {
  constructor(kind) {
    Object.assign(this, kind)
    this.rounds = kind.magazine
    this.wait = 0
    this.held = false
  }

  get reloading() {
    return this.rounds === 0
  }

  /** Whether it fires now, with its trigger `held` or not this frame. */
  pull(held, dt) {
    this.wait -= dt
    const pulled = held && (this.automatic || !this.held)
    this.held = held
    if (this.reloading && this.wait <= 0) this.rounds = this.magazine
    // the time a shot is late carries over to the next, so its rate keeps to `repeat` at any frame rate
    if (!pulled) this.wait = Math.max(0, this.wait)
    if (!pulled || this.wait > 0) return false
    this.rounds--
    this.wait += this.reloading ? this.reload : this.repeat
    return true
  }
}
