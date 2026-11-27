import Character from './Character.js'

const crouchSpeed = .45
/** A crouching prisoner's height, as a share of his standing height. */
export const crouchHeight = .70
const postureSpeed = 3.5

/** A prisoner who can crouch: lower, slower and unable to run or jump; his height follows his `crouchProgress`. */
export default class Prisoner extends Character {
  constructor(options) {
    super(options)
    this.standingHeight = this.size.height
    this.crouched = false
  }

  steer(controls) {
    super.steer({ ...controls, running: !this.crouched && controls?.running })
  }

  jump(dt) {
    if (!this.crouched) super.jump(dt)
  }

  get steered() {
    const speed = super.steered
    return this.crouched ? { x: speed.x * crouchSpeed, z: speed.z * crouchSpeed } : speed
  }

  update(dt) {
    const crouch = this.crouchProgress ?? (this.crouched ? 1 : 0)
    const height = this.standingHeight * (1 - crouch * (1 - crouchHeight))
    const change = Math.sign(height - this.size.height) * Math.min(Math.abs(height - this.size.height), postureSpeed * dt)
    this.size.height += change
    this.y += change / 2
    super.update(dt)
  }
}
