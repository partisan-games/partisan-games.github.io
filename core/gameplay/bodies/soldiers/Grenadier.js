import Body from '../Body.js'
import Grenade from '../projectiles/Grenade.js'

/**
 * A soldier on foot seen from above, 1.8 m tall as drawn, measured from the earlier pixel grenadier at 40 px a metre
 * and 30 frames a second: the push of a key in metres a second squared, and the share of his speed he keeps each
 * second. His throw lasts `duration` seconds and lets the grenade go at `release` from his hand; it flies `flight`
 * seconds to the ground at his feet, `feet` metres down the view from his middle, from `short` metres in front of his
 * middle for the gentlest throw to `ahead` for the strongest. Where his `hand` lets go, ahead of his middle and above
 * that ground, is measured from the picture of his throw.
 */
export const grenadier = {
  thrust: 56.25, keep: .7 ** 30,
  throw: { duration: .8, release: .4, flight: .8, short: 2.5, ahead: 5, feet: .85, hand: { ahead: .375, up: 1.675 } },
}

/**
 * He stands, walks as he is steered (or, steered by nothing, straight on the way he faces), throws a grenade, or lies
 * dead.
 */
const states = {
  idle: {},
  move: {
    update: (soldier, dt) => {
      if (soldier.steered) return
      // keys let go stop him; with no keys at all he walks on
      if (soldier.wasSteered) soldier.setState('idle')
      else soldier.push(soldier.facing, 0, dt)
    },
  },
  attack: {
    enter: soldier => {
      soldier.released = false
    },
    update: soldier => {
      // set to throw with no grenade to hand or one still flying, as a story's button may, he does not
      if (!soldier.released && (soldier.grenades <= 0 || soldier.grenade.active)) return soldier.setState('idle')
      // also when a long step passes the moment of release
      if (!soldier.released && soldier.stateTime >= grenadier.throw.release) soldier.release()
      if (soldier.stateTime >= grenadier.throw.duration) soldier.setState('idle')
    },
  },
  dead: {},
}

/**
 * A grenadier seen from above; one hit kills him. He faces left (`facing` -1) or right (1), the way he last walked
 * across the view, and throws his grenade that way, as long as he has `grenades`; `onBurst(point)` is where it bursts,
 * for the world to judge.
 */
export default class Grenadier extends Body {
  constructor({ onBurst, grenades = Infinity, ...options } = {}) {
    super({ size: { length: 1.65, height: 1.8, width: 1.8 }, health: 1, yaw: Math.PI / 2, ...options, states })
    this.facing = -1
    this.grenades = grenades
    this.strength = 1
    this.steered = this.wasSteered = false
    this.grenade = new Grenade({ onBurst, gravity: this.gravity })
  }

  get forward() {
    return 1
  }

  /** His attack is a throw. */
  get throwing() {
    return this.state === 'attack'
  }

  /** Walks him across the view, `x` and `z` -1, 0 or 1 each; not while he throws. */
  steer(x, z, dt) {
    if (this.dead || this.throwing) return
    this.steered = true
    if (this.state !== 'move') this.setState('move')
    this.push(x, z, dt)
  }

  push(x, z, dt) {
    if (x) this.facing = Math.sign(x)
    this.vx += x * grenadier.thrust * dt
    this.vz += z * grenadier.thrust * dt
  }

  /**
   * Throws a grenade the way he faces, from his gentlest throw (`strength` 0) to his strongest (1), if he has one, is
   * not throwing and his last one is not still flying; returns whether he began.
   */
  shoot(strength = 1) {
    if (this.dead || this.throwing || this.grenade.active || this.grenades <= 0) return false
    this.strength = Math.min(1, Math.max(0, strength))
    this.vx = this.vz = 0
    this.setState('attack')
    return true
  }

  /** What a story can ask of him once: his gentlest and his strongest throw. */
  get acts() {
    return ['throw short', 'throw long']
  }

  act(name) {
    this.shoot(name === 'throw short' ? 0 : 1)
  }

  /**
   * The grenade leaves his hand to fall on the ground in front of him after its flight; seen from above, he stands up
   * the view from his feet.
   */
  release() {
    this.released = true
    this.shotsFired++
    this.grenades--
    const { short, ahead, hand, flight } = grenadier.throw
    const reach = short + (ahead - short) * this.strength
    this.grenade.launch({ x: this.x + this.facing * hand.ahead, y: hand.up, z: this.z + grenadier.throw.feet }, {
      x: this.facing * (reach - hand.ahead) / flight,
      y: (this.grenade.gravity * flight * flight / 2 - hand.up) / flight,
      z: 0,
    })
  }

  get speed() {
    return Math.hypot(this.vx, this.vz)
  }

  update(dt) {
    super.update(dt)
    this.wasSteered = this.steered
    this.steered = false
    const keep = grenadier.keep ** dt
    this.vx *= keep
    this.vz *= keep
    if (this.dead) this.vx = this.vz = 0
    this.grenade.update(dt)
  }
}
