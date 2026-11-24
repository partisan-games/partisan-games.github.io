/**
 * Measured from the earlier 3D AI. It sees `sight` metres, or only `near` of that when the target is not ahead, within
 * `cone` radians of its way; a follower keeps `followDistance` and a patrol turns back every `patrolDistance` metres.
 * Standing, it looks about every `look` seconds; wandering, every `roam` seconds for each metre of its height. Fleeing,
 * it runs at least `flee` seconds. Each swing it aims within `spread` radians of the target.
 */
export const characterAI = {
  sight: 25, near: .3, cone: .8, followDistance: 1.5, patrolDistance: 10,
  look: { min: 3, max: 5 }, roam: { min: 1.5, max: 2.5 }, flee: { min: .5, max: 1 }, spread: Math.PI / 32,
}

/** The calm ways a character keeps when it has no target to chase, and whether each one chases a target it sees. */
const calm = { idle: true, wander: true, patrol: true, defend: false, flee: false, follow: false }

/**
 * The decisions of a character with no player: it keeps its calm `way` (stands, wanders, patrols, defends its place,
 * flees from its target or follows it) until it sees its `target`, a body; then it chases it, swings at it in reach
 * and goes back to its way once it loses it. `sees(from, to)` is the scene's answer whether nothing stands between.
 * `onFirstSpot(body)` runs when this character first spots a target and starts pursuit.
 */
export default class CharacterAI {
  constructor(body, { target = null, way = 'wander', sight = characterAI.sight,
    followDistance = characterAI.followDistance, patrolDistance = characterAI.patrolDistance,
    sees = () => true, random = Math.random, onFirstSpot } = {}) {
    if (!Object.hasOwn(calm, way)) throw new RangeError(`Unknown way: ${way}`)
    Object.assign(this, { body, target, way, sight, followDistance, patrolDistance, sees, random, onFirstSpot })
    this.doing = way
    this.since = 0
    this.wait = this.lasting(characterAI.look)
    this.walked = 0
    this.turning = 0
    this.hits = body.hitsTaken
    this.faceAngle(random() * Math.PI * 2)
  }

  /** Faces the body at `angle`, a yaw, through its own command. */
  faceAngle(angle) {
    const { body } = this
    body.face({ x: body.x + Math.cos(angle), z: body.z - Math.sin(angle) })
  }

  lasting({ min, max }) {
    return min + this.random() * (max - min)
  }

  get distance() {
    const { body, target } = this
    return target ? Math.hypot(target.x - body.x, target.z - body.z) : Infinity
  }

  /** How far, in radians, the target is from the way it faces. */
  get offAim() {
    const { body, target } = this
    const toward = Math.atan2(body.z - target.z, target.x - body.x)
    return Math.abs(Math.atan2(Math.sin(toward - body.yaw), Math.cos(toward - body.yaw)))
  }

  /** It sees a living target on its level close by, or ahead within sight, with nothing between them. */
  get spotted() {
    const { body, target, distance } = this
    if (!target?.alive || target.feet >= body.feet + body.size.height / 2) return false
    const near = distance < this.sight * characterAI.near || (distance < this.sight && this.offAim < characterAI.cone)
    return near && this.sees(body, target)
  }

  get inReach() {
    return this.distance < this.body.reach
  }

  get inSight() {
    return Boolean(this.target?.alive) && this.distance < this.sight
  }

  set(doing) {
    if (doing === this.doing) return
    this.doing = doing
    this.since = 0
    this.walked = 0
    this.turning = 0
    if (doing === 'idle' || doing === 'defend') this.wait = this.lasting(characterAI.look)
    if (doing === 'wander') this.wait = this.lasting(characterAI.roam) * this.body.size.height
    if (doing === 'flee') this.wait = this.lasting(characterAI.flee)
    // a follower that stopped short, as its target blocked the way, waits until the target moves well away
    if (doing === 'idle') this.resumeAt = Math.max(this.followDistance, this.distance) * 1.25
  }

  /** Turns by `angle` over the next frames, at the body's own turning speed. */
  turnBy(angle) {
    this.turning = angle
  }

  update(dt) {
    const { body } = this
    if (body.dead) return
    this.since += dt
    if (this.target?.dead) this.target = null
    if (body.hitsTaken > this.hits && this.target) body.face(this.target)
    this.hits = body.hitsTaken
    this.steering = { ahead: 0, running: false }
    this[this.doing](dt)
    body.steer({ ...this.steering, turn: this.turnShare(dt) })
  }

  /** The share of its full turn it takes this frame, so that it ends the turn it began exactly. */
  turnShare(dt) {
    if (!this.turning || !dt) return 0
    const rate = this.body.turnRate(this.steering.running) * dt
    const share = Math.max(-1, Math.min(1, this.turning / rate))
    this.turning -= share * rate
    if (Math.abs(this.turning) < 1e-9) this.turning = 0
    return share
  }

  walk(running = false) {
    this.steering = { ahead: 1, running }
  }

  stand() {
    this.steering = { ahead: 0, running: false }
  }

  chaseIfSpotted() {
    if (!calm[this.way] || !this.spotted) return
    this.set('pursue')
    const notify = this.onFirstSpot
    this.onFirstSpot = null
    notify?.(this.body)
  }

  idle() {
    this.stand()
    if (this.since >= this.wait) {
      this.turnBy((this.random() * 2 - 1) * Math.PI / 4)
      this.since = 0
      this.wait = this.lasting(characterAI.look)
    }
    this.chaseIfSpotted()
    if (this.way === 'defend' && this.inReach) this.set('attack')
    if (this.way === 'flee' && this.inSight) this.set('flee')
    if (this.way === 'follow' && this.inSight && this.distance > this.resumeAt) this.set('follow')
  }

  defend() {
    this.idle()
  }

  wander() {
    this.walk()
    if (this.body.blocked && !this.turning) this.turnBy(Math.PI)
    else if (this.since >= this.wait) {
      this.turnBy((this.random() * 2 - 1) * Math.PI / 2)
      this.since = 0
    }
    this.chaseIfSpotted()
  }

  patrol(dt) {
    this.walk()
    // the way back is counted once it has turned
    if (!this.turning) this.walked += Math.hypot(this.body.vx, this.body.vz) * dt
    if (this.walked >= this.patrolDistance || (this.body.blocked && !this.turning)) {
      this.turnBy(Math.PI)
      this.walked = 0
    }
    this.chaseIfSpotted()
  }

  pursue() {
    const { body, target } = this
    if (!this.spotted) return this.set(this.way)
    body.face(target)
    this.walk(true)
    if (this.inReach) this.set('attack')
  }

  attack() {
    const { body, target } = this
    if (!target || !this.inReach) return this.set(calm[this.way] ? 'pursue' : this.way)
    this.stand()
    if (body.swing) return
    body.face(target)
    this.faceAngle(body.yaw + (this.random() * 2 - 1) * characterAI.spread)
    body.attack()
  }

  flee() {
    const { body, target } = this
    if (!target) return this.set('idle')
    body.face({ x: body.x * 2 - target.x, z: body.z * 2 - target.z })
    this.walk(true)
    if (this.since > this.wait && !this.inSight) this.set('idle')
  }

  follow() {
    const { body, target } = this
    if (!this.inSight || this.distance < this.followDistance || body.blocked) return this.set('idle')
    body.face(target)
    this.walk()
  }
}
