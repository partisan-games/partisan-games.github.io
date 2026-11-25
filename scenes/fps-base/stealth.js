import Character from '/core/gameplay/bodies/characters/Character.js'
import CharacterAI from '/core/gameplay/controllers/CharacterAI.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'

export const crouchKey = { codes: ['KeyC'], label: 'C' }
const crouchSpeed = .45
const crouchHeight = .70
const postureSpeed = 3.5

export class Prisoner extends Character {
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

export class PrisonerKeys extends CharacterKeys {
  update(dt) {
    const { body, input } = this
    body.crouched = body.alive && !body.airborne && !body.swing && !input.attack && input.keyboard.isDown(crouchKey)
    super.update(dt)
  }
}

export class PrisonerFootsteps extends CharacterModel {
  step(before) {
    this.stepSound.volume = this.body.crouched ? .22 : 1
    super.step(before)
  }
}

export class CampGuard extends CharacterAI {
  constructor(body, { litAt, candidates, ...options }) {
    super(body, options)
    this.litAt = litAt
    this.candidates = candidates
  }

  update(dt) {
    if (this.candidates && !this.body.swing) {
      const previous = this.target
      const visible = this.candidates.filter(target => {
        this.target = target
        return this.spotted
      }).sort((a, b) => Math.hypot(a.x - this.body.x, a.z - this.body.z)
        - Math.hypot(b.x - this.body.x, b.z - this.body.z))
      this.target = visible[0] ?? (previous?.alive ? previous : null)
      this.body.targets = this.candidates
    }
    super.update(dt)
  }

  get spotted() {
    const { target } = this
    return super.spotted && (!target.crouched || this.distance < 9 || this.litAt(target.eye))
  }

  chaseIfSpotted() {
    const { body, target } = this
    // Footsteps can turn a guard toward the prisoner. The shout still requires sight.
    if (target?.alive && !target.crouched && target.moving && this.distance < (target.running ? 11 : 5)
      && this.sees(body, target)) body.face(target)
    super.chaseIfSpotted()
  }

  attack() {
    if (this.spotted) super.attack()
    else this.set(this.way)
  }
}
