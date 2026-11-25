import { description as worker } from '/core3d/actor/derived/ww2/Worker.js'
import { pipeSwingName } from '/core3d/actor/derived/ww2/WorkerPipe.js'

const animDict = { ...worker.animDict, run: 'Running', attack: pipeSwingName,
  crouchWalk: 'Crouched Walking', crouchIdle: 'Crouching Idle', crouchRest: 'Crouch Idle',
  crouchPeek: 'Crouch Look Around Corner', crouchUp: 'Crouch To Stand' }
export const escapingPrisoner = { ...worker, model: { ...worker.model, animDict }, animDict }
export const models = [escapingPrisoner.model]
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z)

/** Follow through the maze, defend at arm's length and wait out distant fire behind solid cover. */
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
    body.crouched = true
    body.waitPose = index % 2 ? 'crouchRest' : 'crouchIdle'
  }

  exposed(enemy, point = this.body.eye) {
    return this.sees(enemy.eye, point)
  }

  chooseCover(threats) {
    const { body, navigation } = this
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
    this.repath -= dt
    if (this.repath <= 0 || !this.destination || distance(point, this.destination) > 2.5) {
      this.destination = { x: point.x, z: point.z }
      this.route = navigation.route(body, point)
      this.repath = 1 + this.index * .12
    }
    while (this.route.length && distance(body, this.route[0]) < .3) this.route.shift()
    while (this.route.length > 1 && navigation.clear(body, this.route[1])) this.route.shift()
    const next = this.route[0]
    if (!next) return body.steer()
    const crowded = this.companions.some(other => other !== body && other !== this.leader && other.alive && other.moving
      && distance(body, other) < .85
      && (other.x - body.x) * (next.x - body.x) + (other.z - body.z) * (next.z - body.z) > 0
      && distance(other, point) < distance(body, point))
    if (crowded) return body.steer()
    body.crouched = !running
    body.face(next)
    body.steer({ ahead: 1, running })
  }

  update(dt) {
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
      const inDanger = enemy.reach > 9 && distance(body, enemy) < enemy.reach && angle < .55
        && (fired || enemy.swing) && this.exposed(enemy)
      if (inDanger) this.knownThreats.add(enemy)
      if (this.knownThreats.has(enemy) && (fired || enemy.swing)) this.safeTime = 4
      return inDanger
    })
    if (threats.length) {
      this.safeTime = 4
      if (this.state !== 'cover' || !this.cover || threats.some(enemy =>
        this.exposed(enemy, { ...this.cover, y: body.size.height * .9 }))) {
        this.chooseCover(threats)
        this.repath = 1
      }
      this.state = 'cover'
    }
    this.safeTime = Math.max(0, this.safeTime - dt)
    const nearby = alive.filter(enemy => distance(body, enemy) < 1.8 && this.exposed(enemy))
      .sort((a, b) => distance(body, a) - distance(body, b))[0]
    if (nearby) {
      this.state = 'defend'
      body.crouched = false
      body.steer()
      body.face(nearby)
      if (!this.postureDuration || (!body.posture && !this.crouched)) body.attack()
      return
    }
    if (this.safeTime > 0 && this.cover) {
      this.state = 'cover'
      if (distance(body, this.cover) > .4) this.moveTo(this.cover, dt, true)
      else {
        body.steer()
        if (this.safeTime < 3 && !threats.length) {
          body.waitPose = 'crouchPeek'
          const enemy = alive.find(enemy => this.knownThreats.has(enemy))
          if (enemy) body.face(enemy)
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
    if (leader.dead || distance(body, leader) < this.followDistance) return body.steer()
    const gap = distance(body, leader) - this.followDistance
    this.catchUp = gap > (this.catchUp ? 1.5 : 3)
    this.moveTo(leader, dt, this.catchUp)
  }
}
