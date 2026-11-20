import StateMachine from '/core/gameplay/StateMachine.js'
import GroundTarget from '/core/actor/GroundTarget.js'

/** How fast a vehicle drives, in pixels per second. */
export const drive = { speed: 40 }

/**
 * A vehicle stands with its engine running, or drives the way its picture faces, or burns where it was destroyed.
 * Each lasts until it is set to another; who does it, and when, is up to the world.
 */
const states = {
  idle: {
    enter: vehicle => vehicle.play('idle'),
  },
  drive: {
    enter: vehicle => vehicle.play('drive'),
    update: (vehicle, dt) => {
      vehicle.x += vehicle.heading * drive.speed * dt
    },
  },
  dead: {
    enter: vehicle => {
      if (vehicle.alive) vehicle.die()
    },
  },
}

/** A truck, tank or train on the ground: a target that may stand or drive, and burns when destroyed. */
export default class Vehicle extends GroundTarget {
  /** `facing` is the way the picture faces: -1 left, 1 right. */
  constructor({ facing = -1, ...options }) {
    super({ ...options, vehicle: true })
    this.facing = facing
    this.machine = new StateMachine(this, states, 'idle')
  }

  /** Where the vehicle drives: the way its picture faces, mirrored with it. */
  get heading() {
    return this.facing * this.flipY
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  die() {
    if (this.dead) return
    super.die()
    this.machine.set('dead')
  }

  update(dt) {
    super.update(dt)
    if (this.alive) this.machine.update(dt)
  }
}
