import Body from '../Body.js'
import Grenade from '../projectiles/Grenade.js'

/**
 * A soldier on foot seen from above, 1.8 m tall as drawn, measured from the earlier pixel grenadier at 40 px a metre
 * and 30 frames a second: the push of a key in metres a second squared, and the share of his speed he keeps each
 * second. His throw lasts `duration` seconds and lets the grenade go at `release` from his hand, to land on the ground
 * at his feet, `feet` metres down the view from his middle, `ahead` metres in front of his middle. Where his `hand`
 * lets go, ahead of his middle and above that ground, is measured from the picture of his throw.
 */
export const grenadier = {
  thrust: 56.25, keep: .7 ** 30,
  throw: { duration: .8, release: .4, ahead: 5, feet: .85, hand: { ahead: .375, up: 1.675 } },
}

/** He walks as he is steered, or stands and throws a grenade, or lies dead. */
const states = {
  idle: {},
  throw: {
    enter: soldier => {
      soldier.released = false
    },
    update: soldier => {
      // also when a long step passes the moment of release
      if (!soldier.released && soldier.stateTime >= grenadier.throw.release) soldier.release()
      if (soldier.stateTime >= grenadier.throw.duration) soldier.setState('idle')
    },
  },
  dead: {},
}

/**
 * A grenadier seen from above; one hit kills him. He faces left (`facing` -1) or right (1), the way he last walked
 * across the view, and throws his grenade that way; `onBurst(point)` is where it bursts, for the world to judge.
 */
export default class Grenadier extends Body {
  constructor({ onBurst, ...options } = {}) {
    super({ size: { length: 1.65, height: 1.8, width: 1.8 }, health: 1, yaw: Math.PI / 2, ...options, states })
    this.facing = -1
    this.grenade = new Grenade({ onBurst })
  }

  get forward() {
    return 1
  }

  get throwing() {
    return this.state === 'throw'
  }

  /** Pushes him across the view, `x` and `z` -1, 0 or 1 each; not while he throws. */
  steer(x, z, dt) {
    if (this.dead || this.throwing) return
    if (x) this.facing = Math.sign(x)
    this.vx += x * grenadier.thrust * dt
    this.vz += z * grenadier.thrust * dt
  }

  /** Throws his grenade, if he is not throwing and it is not still flying; returns whether he began. */
  shoot() {
    if (this.dead || this.throwing || this.grenade.active) return false
    this.vx = this.vz = 0
    this.setState('throw')
    return true
  }

  /** The grenade leaves his hand for the ground in front of him; seen from above, he stands up the view from his feet. */
  release() {
    this.released = true
    const { ahead, hand } = grenadier.throw
    const feet = this.z + grenadier.throw.feet
    this.grenade.launch(
      { x: this.x + this.facing * hand.ahead, y: hand.up, z: feet },
      { x: this.x + this.facing * ahead, y: 0, z: feet })
  }

  get speed() {
    return Math.hypot(this.vx, this.vz)
  }

  update(dt) {
    super.update(dt)
    const keep = grenadier.keep ** dt
    this.vx *= keep
    this.vz *= keep
    if (this.dead) this.vx = this.vz = 0
    this.grenade.update(dt)
  }
}
