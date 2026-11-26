/** The chance a second that a waiting soldier rises to fire, and the seconds of his burst. */
export const coverFighter = { rise: .15, burst: 1.5 }

/**
 * Fights a soldier from where he stands: while he waits, now and then he rises to fire at one of the living
 * `targets` within `range` metres that he `sees`, an array the scene keeps, picked by `random`; after a burst he ducks
 * again.
 */
export default class CoverFighter {
  constructor(body, { targets, range = Infinity, sees = () => true, rise = coverFighter.rise, burst = coverFighter.burst,
    random = Math.random }) {
    Object.assign(this, { body, targets, range, sees, rise, burst, random })
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    if (body.state === 'attack' && body.stateTime >= this.burst) return body.ceaseFire()
    if (body.state !== 'idle' || this.random() >= this.rise * dt) return
    const living = this.targets.filter(target => target.alive && Math.hypot(target.x - body.x, target.z - body.z) <= this.range
      && this.sees(body, target))
    if (living.length) body.fireAt(living[Math.floor(this.random() * living.length)])
  }
}
