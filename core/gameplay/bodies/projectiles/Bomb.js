import Body from '../Body.js'

/**
 * Fall acceleration in metres a second squared, chosen for play: dropped 10 m above the ground at takeoff speed, a
 * bomb falls about a second and lands some 11 m ahead of where it left the plane.
 */
export const bomb = { gravity: 16.21 }

const states = {
  idle: {
    enter: bomb => {
      bomb.vx = bomb.vy = bomb.vz = 0
    },
  },
  flight: {
    update: (bomb, dt) => {
      bomb.vy -= bomb.gravity * dt
      bomb.pitch = Math.atan2(bomb.vy, Math.abs(bomb.vx))
      const ground = bomb.groundAt(bomb.x)
      if (bomb.y + bomb.vy * dt > ground) return
      bomb.y = ground
      bomb.bursts++
      bomb.setState('idle')
      bomb.onImpact({ x: bomb.x, y: ground })
    },
  },
}

/**
 * An aerial bomb: out of play (`idle`) or falling with the velocity it was released with (`flight`), its nose along
 * its path, until it reaches `groundAt(x)`, where it bursts and `onImpact(point)` deals the damage. `bursts` counts
 * its bursts for the view; it stays where it burst.
 */
export default class Bomb extends Body {
  constructor({ gravity = bomb.gravity, groundAt = () => 0, onImpact = () => {}, ...rest } = {}) {
    super({ size: { length: .29, height: .64, width: .29 }, ...rest, states })
    Object.assign(this, { gravity, groundAt, onImpact })
    this.bursts = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  /** Falls from `point` with the velocity of `plane`, facing the way it flies. */
  release(point, plane) {
    Object.assign(this, point)
    this.yaw = plane.vx < 0 ? Math.PI : 0
    this.vx = plane.vx
    this.vy = plane.vy
    this.setState('idle')
    this.setState('flight')
  }
}
