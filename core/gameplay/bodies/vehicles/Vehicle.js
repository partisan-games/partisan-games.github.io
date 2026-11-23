import Body from '../Body.js'
import { modelStatistics } from '../../modelStatistics.js'

/**
 * The hit box of each vehicle in metres, its health in bullet damage and how fast it drives, in metres a second:
 * trucks fall to a few bullets, the tank to a short burst and the armoured train only to a long one. Measured from the
 * earlier pixel vehicles at 30.8 px a metre.
 */
export const vehicleKinds = {
  truck: { size: { length: 6.65, height: 2.87, width: 1.71 }, health: 45, speed: 4.5, physical: modelStatistics['opel-blitz'] },
  legionTruck: { size: { length: 6.99, height: 2.87, width: 1.71 }, health: 45, speed: 4.5 },
  /** About a second of steady hits, as the owner set it for the tank. */
  tank: { size: { length: 7.26, height: 3.36, width: 2.14 }, health: 150, speed: 1.29 },
  train: { size: { length: 12.29, height: 4.82, width: 2.21 }, health: 300, speed: 1.29 },
}

const stand = vehicle => {
  vehicle.vx = 0
}

/** A vehicle stands with its engine running, drives the way it faces, or lies destroyed where it stopped. */
export const vehicleStates = {
  idle: { enter: stand },
  move: {
    update: vehicle => {
      vehicle.vx = vehicle.forward * vehicle.kind.speed
    },
  },
  dead: { enter: stand },
}

/** A truck, tank or train on the ground, facing right (yaw 0) or left (yaw π). */
export default class Vehicle extends Body {
  constructor({ kind = vehicleKinds.truck, states = vehicleStates, ...rest } = {}) {
    super({ size: kind.size, health: kind.health, ...rest, states })
    this.kind = kind
    this.physical = kind.physical
  }

  /** The way it faces and drives: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  setState(name) {
    if ((this.dead && name !== 'dead') || !this.states.includes(name)) return
    super.setState(name)
  }
}
