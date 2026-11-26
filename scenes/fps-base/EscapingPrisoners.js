import { description as worker } from '/core3d/actor/derived/ww2/Worker.js'
import { pipeSwingName } from '/core3d/actor/derived/ww2/WorkerPipe.js'

/** Ways to stand and wait, one for each companion in turn, so they do not all move alike; one stretches. */
export const standingIdles = ['Standing Idle', 'Dwarf Idle', worker.animDict.idle]
const animDict = { ...worker.animDict, idle: standingIdles[0], restIdle: standingIdles[1],
  // the pipe swing eases from this pose
  swingRest: worker.animDict.idle, run: 'Running', attack: pipeSwingName,
  crouchWalk: 'Crouched Walking', crouchIdle: 'Crouching Idle', crouchRest: 'Crouch Idle',
  crouchPeek: 'Crouch Look Around Corner', crouchUp: 'Crouch To Stand' }
export const escapingPrisoner = { ...worker, model: { ...worker.model, animDict }, animDict }
export const models = [escapingPrisoner.model]
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/** Follow through the maze, charge nearby guards and wait out distant fire behind solid cover. */
export default class CampCompanion {
  constructor(body, { leader, enemies, navigation, coverPoints, sees, index, companions = [], random = Math.random,
    postureDuration = 0 }) {
    Object.assign(this, { body, leader, enemies, navigation, coverPoints, sees, index, companions, random })
    this.state = 'follow'
    this.route = []
    this.repath = 0
    this.safeTime = 0
    this.shots = new Map(enemies.map(enemy => [enemy, enemy.shotsFired]))
    this.knownThreats = new Set()
    this.followDistance = 2.2 + index * 1.3
    this.waitTime = 1 + index * .8 + random() * 2
    this.postureDuration = postureDuration
    this.crouched = true
    this.catchUp = false
    this.baseRun = body.run
    this.formationYaw = leader.yaw
    this.leaderPosition = { x: leader.x, z: leader.z }
    body.crouched = true
    body.waitPose = index % 2 ? 'crouchRest' : 'crouchIdle'
  }

  exposed(enemy, point = this.body.eye) {
    return this.sees(enemy.eye, point)
  }

  turnToward(point, dt) {
    const { body } = this
    if (point.x === body.x && point.z === body.z) return 0
    const target = Math.atan2(body.z - point.z, point.x - body.x)
    const difference = Math.atan2(Math.sin(target - body.yaw), Math.cos(target - body.yaw))
    const limit = Math.PI * 1.5 * dt
    const turn = Math.max(-limit, Math.min(limit, difference))
    body.yaw += turn
    return Math.abs(difference - turn)
  }

  formationPoint() {
    const { leader, navigation } = this
    const dx = leader.x - this.leaderPosition.x, dz = leader.z - this.leaderPosition.z
    if (Math.hypot(dx, dz) > .2) {
      this.formationYaw = Math.atan2(-dz, dx)
      this.leaderPosition = { x: leader.x, z: leader.z }
    }
    const x = Math.cos(this.formationYaw), z = -Math.sin(this.formationYaw)
    const side = [-.9, .9, 0][this.index % 3]
    const behind = this.followDistance - .6
    for (const [back, across] of [[behind, side], [behind, 0], [.8, side], [.8, -side],
      [0, behind], [0, -behind], [-behind, side]]) {
      const point = { x: leader.x - x * back - z * across, z: leader.z - z * back + x * across }
      if (navigation.clear(leader, point)) return point
    }
    return { x: leader.x, z: leader.z }
  }

  avoidCompanions(next) {
    const { body, navigation } = this
    const others = this.companions.filter(other => other !== body && other.alive)
    const clearPeople = (from, to) => {
      const dx = to.x - from.x, dz = to.z - from.z, length = dx * dx + dz * dz
      return others.every(other => {
        const t = length ? Math.max(0, Math.min(1, ((other.x - from.x) * dx + (other.z - from.z) * dz) / length)) : 0
        const gap = distance(other, { x: from.x + dx * t, z: from.z + dz * t })
        return gap >= .8 || gap >= distance(from, other) - 1e-6
      })
    }
    if (this.bypass) {
      while (this.bypass.length && distance(body, this.bypass[0]) < .25) this.bypass.shift()
      if (this.bypass.length && navigation.clear(body, this.bypass[0]) && clearPeople(body, this.bypass[0])) return this.bypass[0]
      this.bypass = null
    }
    const length = distance(body, next)
    const dx = (next.x - body.x) / length, dz = (next.z - body.z) / length
    const blocker = others.filter(other => {
      const x = other.x - body.x, z = other.z - body.z
      const along = x * dx + z * dz
      return along > 0 && along < Math.min(1.6, length + .1) && Math.abs(x * dz - z * dx) < .8
    }).sort((a, b) => distance(body, a) - distance(body, b))[0]
    if (!blocker) return next
    // Let a person moving along the same corridor open the gap; walk around someone who has stopped.
    if (blocker.moving && blocker.vx * dx + blocker.vz * dz > .1) return null
    for (const side of [1, -1]) {
      const around = [-.9, .9].map(along => ({
        x: blocker.x + dx * along - dz * side,
        z: blocker.z + dz * along + dx * side,
      }))
      if (navigation.clear(body, around[0]) && navigation.clear(around[0], around[1])
        && navigation.clear(around[1], next)
        && clearPeople(body, around[0]) && clearPeople(around[0], around[1]) && clearPeople(around[1], next)
        && around.every(point => others.every(other => distance(point, other) >= .8))) {
        this.bypass = around
        return around[0]
      }
    }
    return null
  }

  chooseCover(threats) {
    const { body, navigation } = this
    this.bypass = null
    if (this.cover) this.cover.owner = null
    const candidates = this.coverPoints.filter(point => (!point.owner || point.owner === body || point.owner.dead)
      && distance(body, point) < 18 && threats.every(enemy =>
      !this.exposed(enemy, { ...point, y: body.size.height * .9 })))
      .sort((a, b) => distance(body, a) - distance(body, b))
    for (const point of candidates) {
      const route = navigation.route(body, point)
      if (route.length) {
        this.route = route
        this.cover = point
        point.owner = body
        return
      }
    }
    this.cover = null
    this.route = []
  }

  moveTo(point, dt, running) {
    const { body, navigation } = this
    body.crouched = !running
    this.repath -= dt
    if (this.repath <= 0 || !this.destination || distance(point, this.destination) > 2.5) {
      if (this.destination && distance(point, this.destination) > 2.5) this.bypass = null
      this.destination = { x: point.x, z: point.z }
      this.route = navigation.route(body, point)
      this.repath = 1 + this.index * .12
    }
    // Keep the final leg on the moving formation slot instead of stopping at last second's position.
    if (this.route.length === 1 && navigation.clear(body, point)) this.route[0] = { x: point.x, z: point.z }
    while (this.route.length && distance(body, this.route[0]) < .3) this.route.shift()
    while (this.route.length > 1 && navigation.clear(body, this.route[1])) this.route.shift()
    if (!this.route[0]) return body.steer()
    const next = this.avoidCompanions(this.route[0])
    if (!next) return body.steer()
    const angle = this.turnToward(next, dt)
    // Turn in place at sharp corners instead of walking sideways into their walls.
    const step = body.speed * (running ? body.run : .45) * dt
    const ahead = { x: body.x + Math.cos(body.yaw) * step, z: body.z - Math.sin(body.yaw) * step }
    const crowded = this.companions.some(other => other !== body && other.alive
      && distance(ahead, other) < .8 && distance(ahead, other) < distance(body, other))
    body.steer({ ahead: angle < .3 && !crowded ? 1 : 0, running })
  }

  update(dt) {
    this.body.run = this.baseRun
    this.decide(dt)
    const { body, postureDuration } = this
    if (body.dead) {
      body.posture = this.posture = null
      return
    }
    if (body.crouched !== this.crouched && (!body.swing || !postureDuration)) {
      this.crouched = body.crouched
      this.posture = postureDuration ? { name: this.crouched ? 'crouchDown' : 'crouchUp',
        time: this.posture ? postureDuration - this.posture.time : 0 } : null
    }
    if (this.posture) {
      this.posture.time = Math.min(postureDuration, this.posture.time + dt)
      if (this.posture.time >= postureDuration || body.swing) this.posture = null
      else body.steer()
    }
    body.posture = this.posture
    const fraction = this.posture ? this.posture.time / postureDuration : 1
    body.crouchProgress = this.crouched ? fraction : 1 - fraction
  }

  decide(dt) {
    const { body, leader } = this
    body.crouched = true
    if (body.dead) {
      if (this.cover) this.cover.owner = null
      return
    }
    this.waitTime -= dt
    if (!body.moving && !body.swing && !body.posture && this.waitTime <= 0) {
      this.waitTime = 4 + this.random() * 5
      body.waitPose = body.waitPose === 'crouchIdle' ? 'crouchRest' : 'crouchIdle'
    }
    const alive = this.enemies.filter(enemy => enemy.alive)
    const threats = alive.filter(enemy => {
      const fired = enemy.shotsFired > (this.shots.get(enemy) ?? 0)
      this.shots.set(enemy, enemy.shotsFired)
      const toward = Math.atan2(enemy.z - body.z, body.x - enemy.x)
      const angle = Math.abs(Math.atan2(Math.sin(toward - enemy.yaw), Math.cos(toward - enemy.yaw)))
      const inDanger = distance(body, enemy) < enemy.reach && angle < .55
        && (fired || enemy.swing) && this.exposed(enemy)
      if (inDanger) this.knownThreats.add(enemy)
      if (this.knownThreats.has(enemy) && (fired || enemy.swing)) this.safeTime = 4
      return inDanger
    })
    this.safeTime = Math.max(0, this.safeTime - dt)
    const nearby = alive.filter(enemy => distance(body, enemy) < (enemy === this.combatTarget ? 6 : 4)
      && this.exposed(enemy)).sort((a, b) => distance(body, a) - distance(body, b))[0]
    this.combatTarget = nearby
    if (nearby) {
      if (this.state !== 'defend') {
        this.route = []
        this.bypass = null
        this.destination = null
        this.repath = 0
      }
      if (this.cover) this.cover.owner = null
      this.cover = null
      this.state = 'defend'
      if (body.waitPose === 'crouchPeek') body.waitPose = 'crouchIdle'
      if (distance(body, nearby) > body.reach * .9) this.moveTo(nearby, dt, true)
      else {
        body.crouched = false
        body.steer()
        const angle = this.turnToward(nearby, dt)
        if (angle < .1 && (!this.postureDuration || (!body.posture && !this.crouched))) body.attack()
      }
      return
    }
    if (threats.length) {
      this.safeTime = 4
      if (this.state !== 'cover' || !this.cover || threats.some(enemy =>
        this.exposed(enemy, { ...this.cover, y: body.size.height * .9 }))) {
        this.chooseCover(threats)
        this.repath = 1
      }
      this.state = 'cover'
    }
    if (this.safeTime > 0 && this.cover) {
      this.state = 'cover'
      if (distance(body, this.cover) > .4) this.moveTo(this.cover, dt, true)
      else {
        body.steer()
        if (this.safeTime < 3 && !threats.length) {
          const enemy = alive.find(enemy => this.knownThreats.has(enemy))
          body.waitPose = !enemy || this.turnToward(enemy, dt) < .3 ? 'crouchPeek' : 'crouchIdle'
        } else if (body.waitPose === 'crouchPeek') body.waitPose = 'crouchIdle'
      }
      return
    }
    if (this.safeTime > 0) {
      this.state = 'cover'
      this.moveTo(leader, dt, true)
      return
    }
    this.state = 'follow'
    if (this.cover) this.cover.owner = null
    this.cover = null
    this.knownThreats.clear()
    if (body.waitPose === 'crouchPeek') body.waitPose = 'crouchIdle'
    if (leader.dead) return body.steer()
    if (!this.following && distance(body, leader) < this.followDistance) return body.steer()
    this.following = true
    const point = this.formationPoint()
    const sprinting = leader.moving && leader.running && !leader.crouched
    if (distance(body, point) < .3 && !sprinting) {
      this.bypass = null
      return body.steer()
    }
    const gap = distance(body, leader) - this.followDistance
    this.catchUp = sprinting || gap > (this.catchUp ? 1.5 : 3)
    if (this.catchUp) {
      const normal = body.speed * this.baseRun
      const leaderPace = leader.speed * leader.run
      const along = (point.x - body.x) * Math.cos(this.formationYaw) - (point.z - body.z) * Math.sin(this.formationYaw)
      const pace = sprinting ? leaderPace + Math.max(-.8, Math.min(.6, along * .8))
        : normal + Math.min(1.6, distance(body, point) * .25)
      body.run = Math.min(Math.max(normal, leaderPace * 1.15), Math.max(normal, pace)) / body.speed
    }
    const ahead = { x: point.x + Math.cos(this.formationYaw) * .75,
      z: point.z - Math.sin(this.formationYaw) * .75 }
    this.moveTo(sprinting && this.navigation.clear(point, ahead) ? ahead : point, dt, this.catchUp)
  }
}
