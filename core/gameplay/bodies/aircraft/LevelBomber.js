import Body from '../Body.js'
import Bomb, { bomb } from '../projectiles/Bomb.js'
import { fall } from './wreck.js'

/**
 * A He 111: its level speed in metres a second; how many bombs a pass drops, one each `interval` seconds; how far
 * around the aimed point a bomb may land, and the farthest it sees a target, in metres; and its health in bullet
 * damage, the most of the raiders. Sized in the scale of the Kluz planes, from its 690 × 190 px picture.
 */
export const levelBomber = {
  speed: 10.2, bombs: 4, interval: .35, spread: 6, reach: 60, health: 150, size: { length: 16.5, height: 4.54, width: 16.5 },
}

/**
 * The bomber flies level at its height; set to fire, it lets its bombs go one after another while they would land
 * near the aimed point; shot down, it falls and crashes.
 */
const states = {
  idle: { update: plane => plane.cruise() },
  move: { update: plane => plane.cruise() },
  attack: {
    update: (plane, dt) => {
      plane.cruise()
      plane.sinceDrop += dt
      if (plane.sinceDrop >= levelBomber.interval) plane.drop()
    },
  },
  dead: {},
}

/**
 * A He 111 level bomber, facing right (yaw 0) or left (yaw π), that carries a stick of bombs a pass and drops them
 * where it aims, only while `canFire()`. Its bombs and its wreck fall on `groundAt(x)`; `onImpact(point)` destroys
 * what a bomb's burst reaches and `onCrash(point)` what the wreck hits.
 */
export default class LevelBomber extends Body {
  constructor({ canFire = () => true, groundAt = () => 0, onImpact = () => {}, onCrash = () => {}, ...rest } = {}) {
    super({ size: levelBomber.size, health: levelBomber.health, ...rest, states })
    Object.assign(this, { canFire, groundAt, onCrash })
    this.crashed = false
    this.bombs = Array.from({ length: levelBomber.bombs }, () => new Bomb({ gravity: this.gravity, groundAt, onImpact }))
    this.enter()
  }

  /** The way it flies: 1 right, -1 left. */
  get forward() {
    return Math.cos(this.yaw) < 0 ? -1 : 1
  }

  face(way) {
    this.yaw = way < 0 ? Math.PI : 0
  }

  setState(name) {
    if (this.dead && name !== 'dead') return
    super.setState(name)
  }

  /** Starts a pass where it is, with a new stick of bombs. */
  enter() {
    this.loaded = levelBomber.bombs
    this.sinceDrop = levelBomber.interval
    this.cruise()
  }

  get reach() {
    return levelBomber.reach
  }

  /** It drops its bombs on the ground where one let go now would land. */
  get shots() {
    return { drop: { x: this.forward * (this.landing - this.x), y: this.groundAt(this.x) - this.y } }
  }

  /** Where a bomb let go now lands, its path bent by the pull bombs fall with. */
  get landing() {
    const height = Math.max(0, this.y - this.groundAt(this.x))
    const time = Math.sqrt(2 * height / (this.gravity * bomb.fall))
    return this.x + this.vx * time
  }

  /** It can bomb a point while it has bombs left and one let go now would land near it. */
  aimAt(point) {
    return this.loaded > 0 && Math.abs(this.landing - point.x) <= levelBomber.spread
  }

  /** It flies level the way it faces. */
  cruise() {
    this.pitch = 0
    this.vx = this.forward * levelBomber.speed
    this.vy = 0
  }

  /** Lets the next bomb go, if it may and has one. */
  drop() {
    const next = this.bombs.find(round => !round.active)
    if (!this.loaded || !next || !this.canFire()) return
    next.release({ x: this.x, y: this.y, z: this.z }, this)
    this.loaded--
    this.sinceDrop = 0
    this.shotsFired++
  }

  /** A shot down He 111 keeps flying on as it falls; its bombs in the air still burst. */
  update(dt) {
    if (this.dead) fall(this, dt)
    super.update(dt)
    this.bombs.forEach(round => round.update(dt))
  }
}
