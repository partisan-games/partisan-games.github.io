import StateMachine from '../StateMachine.js'
import Health from '../Health.js'

/**
 * The model of an actor, with no picture: where it is and how it moves, in metres, seconds and radians with +y up;
 * `yaw` turns about +y with 0 facing +x, and `pitch` is above level. `size` is its hit box and the size every view
 * fits its art to. It knows what it can do, not when: controllers and the scene decide that.
 *
 * Views read it every frame and never write to it; they start effects when `shotsFired` or `hitsTaken` grows.
 */
export default class Body {
  constructor({
    x = 0, y = 0, z = 0, yaw = 0, pitch = 0, size = { length: 1, height: 1, width: 1 }, health = 100,
    states = { idle: {} }, initial = Object.keys(states)[0],
  } = {}) {
    Object.assign(this, { x, y, z, yaw, pitch, size })
    this.vx = this.vy = this.vz = 0
    this.health = new Health({ maximum: health })
    this.shotsFired = 0
    this.hitsTaken = 0
    /** Seconds in the current state. */
    this.stateTime = 0
    this.machine = new StateMachine(this, states, initial)
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  /** Enters `name`; set to `dead`, it dies whatever its health. */
  setState(name) {
    if (name !== this.state) this.stateTime = 0
    if (name === 'dead' && this.alive) this.health.damage(this.health.current)
    this.machine.set(name)
  }

  get alive() {
    return this.health.alive
  }

  get dead() {
    return !this.alive
  }

  /** Takes the damage of a hit; a kind with a `dead` state enters it when the hit kills. Returns whether it killed. */
  takeHit(damage) {
    if (this.dead) return false
    this.hitsTaken++
    const killed = this.health.damage(damage)
    if (killed && this.states.includes('dead')) this.setState('dead')
    return killed
  }

  /** The world point `distance` metres ahead along yaw and pitch, and `above` metres higher. */
  ahead(distance, above = 0) {
    const level = Math.cos(this.pitch) * distance
    return {
      x: this.x + Math.cos(this.yaw) * level,
      y: this.y + Math.sin(this.pitch) * distance + above,
      z: this.z - Math.sin(this.yaw) * level,
    }
  }

  /** Plays its state, which may change its velocity, then moves by it; a dead body only coasts. */
  update(dt) {
    this.stateTime += dt
    if (this.alive) this.machine.update(dt)
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.z += this.vz * dt
  }

  end() {}
}
