import Character from '/core/gameplay/bodies/characters/Character.js'
import PursuitAI from '/core/gameplay/controllers/PursuitAI.js'
import CharacterKeys from '/core/gameplay/controllers/CharacterKeys.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import CampNavigation from './CampNavigation.js'

export const crouchKey = { codes: ['KeyC'], label: 'C' }
const crouchSpeed = .45
/** A crouching prisoner's height, as a share of his standing height. */
export const crouchHeight = .70
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
    body.crouched = body.alive && !body.airborne && !body.swing && !input.attack
      && (input.keyboard.isDown(crouchKey) || input.screen.special)
    super.update(dt)
  }
}

export class PrisonerFootsteps extends CharacterModel {
  step(before) {
    this.stepSound.volume = this.body.crouched ? .22 : 1
    super.step(before)
  }
}

/** How far, in metres, a guard's shout is heard by the others, and how many seconds they search where it came from. */
export const alarm = { hearing: 20, search: 12 }

export class CampGuard extends PursuitAI {
  constructor(body, { litAt = () => false, navigation = new CampNavigation(body.isBlocked), ...options }) {
    super(body, { ...options, navigation })
    this.litAt = litAt
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

  /** Hearing another guard's shout at `point` while he sees no one himself, he runs there and searches for `target`. */
  alarm(point, target) {
    if (this.body.dead || this.spotted || this.lastSeen) return
    this.lastSeen = { x: point.x, z: point.z, target }
    this.searchLeft = alarm.search
    this.set('search')
  }
}

/** The guard `caller` shouts on spotting a prisoner: every other guard of `guards` in hearing comes to look. */
export function raiseAlarm(guards, caller) {
  for (const guard of guards)
    if (guard.body !== caller.body && Math.hypot(guard.body.x - caller.body.x, guard.body.z - caller.body.z) <= alarm.hearing)
      guard.alarm(caller.body, caller.target)
}
