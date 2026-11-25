import Body from '../Body.js'
import Cooldown from '../../Cooldown.js'
import ProjectilePool from '../projectiles/ProjectilePool.js'
import Missile, { missile } from '../projectiles/Missile.js'

/**
 * Measured from the earlier warplane, which flew on into the screen while the world came at it: its `speed` in
 * metres a second, its cruising `height`, its health and the seconds between missiles. Steered, it takes up its new
 * speed across or up by `steering`, and down to none by `braking`, each a second; it banks as it moves across, up to
 * `maxRoll`, by `banking` a second. Landing, it sinks at `sink` of its speed and brakes `brake` metres a second each
 * second on the ground; shot down, it rolls over by `crashRoll` a second. Missiles fly at `missileSpeed`, diving at
 * `missileDive` below level.
 */
export const warplane = { speed: 40, height: 60, health: 500, reload: .5, steering: 12, braking: 18, banking: 6,
  maxRoll: Math.PI / 6, sink: .5, brake: 3, crashRoll: .375, missileSpeed: 60, missileDive: Math.atan2(50, 75) }

/** It flies, or it is shot down. */
const states = {
  move: {},
  dead: {},
}

/**
 * A warplane flying on its way, `yaw`, while the world moves past it: steered, it moves across within `limit` metres
 * either side and up or down between half and twice its cruising height, banking as it goes. It fires missiles ahead
 * and down at the living ones of `targets`; they burst on the ground `groundAt(x, z)` gives. Told to land, or shot
 * down, it sinks to the ground. `clock` is the game clock.
 */
export default class Warplane extends Body {
  constructor({ clock, limit = 50, height = warplane.height, groundAt = () => 0, targets = [],
    size = { length: 6, height: 2, width: 6 }, ...rest } = {}) {
    super({ size, health: warplane.health, y: height, yaw: Math.PI / 2, ...rest, states })
    Object.assign(this, { limit, targets, groundAt, speed: warplane.speed })
    this.heights = { min: height / 2, max: height * 2 }
    this.velocity = { x: 0, y: 0 }
    this.roll = 0
    this.landing = false
    this.steering = { across: 0, climb: 0 }
    this.reload = new Cooldown({ seconds: warplane.reload, clock })
    this.missiles = new ProjectilePool(() => new Missile({ groundAt }))
  }

  get airborne() {
    return this.y > this.groundAt(this.x, this.z) + this.size.height * 2 / 3
  }

  setState(name) {
    if (this.alive || name === 'dead') super.setState(name)
  }

  /** Moves across (1 to its right) and up (1) until steered again. */
  steer({ across = 0, climb = 0 } = {}) {
    Object.assign(this.steering, { across, climb })
  }

  /** Where its missiles leave it, under its belly. */
  get launchPoint() {
    return { x: this.x, y: this.y - this.size.height * .33, z: this.z }
  }

  /**
   * Where the ground is now that a missile fired now would strike, as the ground comes at the plane at its speed, the
   * world moving past it; found within `step` seconds of flight. Null if the missile would not come down in its life.
   */
  aim(step = .02) {
    const from = this.launchPoint
    const level = Math.cos(warplane.missileDive) * warplane.missileSpeed, sink = Math.sin(warplane.missileDive) * warplane.missileSpeed
    for (let time = 0; time <= missile.life; time += step) {
      const x = from.x + Math.cos(this.yaw) * level * time, z = from.z - Math.sin(this.yaw) * level * time
      const ground = this.groundAt(x, z)
      if (from.y - sink * time <= ground) return { x, y: ground, z: z - this.speed * time }
    }
    return null
  }

  /** Fires a missile ahead and down if it may and has reloaded; returns whether it fired. */
  fire() {
    if (this.dead || this.landing || !this.reload.ready) return false
    this.missiles.fire(this.launchPoint, this.yaw, -warplane.missileDive, warplane.missileSpeed)
    this.shotsFired++
    this.reload.start()
    return true
  }

  /** From now on it comes down and rolls to a stop. */
  land() {
    this.landing = true
  }

  /** Takes up `target` speed along `axis` within `min` and `max`, its speed easing in as the earlier plane's did. */
  move(axis, target, dt, min, max) {
    const previous = this.velocity[axis]
    const response = target ? warplane.steering : warplane.braking
    const decay = Math.exp(-response * dt)
    const position = this[axis] + target * dt + (previous - target) * (1 - decay) / response
    this[axis] = Math.max(min, Math.min(max, position))
    this.velocity[axis] = position <= min || position >= max ? 0 : target + (previous - target) * decay
  }

  update(dt) {
    if (this.dead || this.landing) {
      this.velocity.x = this.velocity.y = 0
      if (this.airborne) {
        this.y = Math.max(this.groundAt(this.x, this.z) + this.size.height * 2 / 3, this.y - this.speed * warplane.sink * dt)
        if (this.dead) this.roll -= warplane.crashRoll * dt
      } else this.speed = Math.max(0, this.speed - warplane.brake * dt)
    } else {
      // its right, flying into the screen, is +x
      this.move('x', this.steering.across * this.speed, dt, -this.limit, this.limit)
      this.move('y', this.steering.climb * this.speed * .5, dt, this.heights.min, this.heights.max)
    }
    if (!this.dead) {
      const roll = this.landing ? 0 : -this.velocity.x / Math.max(this.speed, .001) * warplane.maxRoll
      this.roll += (roll - this.roll) * (1 - Math.exp(-warplane.banking * dt))
    }
    super.update(dt)
    this.missiles.update(dt, this.targets)
  }
}
