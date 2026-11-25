import CharacterAI from './CharacterAI.js'

/**
 * A hunting character keeps a stable visible target and searches its last seen position before resuming its way.
 * The scene supplies candidates and navigation: route(from, to) returns XZ waypoints, clear(from, to) tests a segment.
 * Navigation owns the world's bounds and obstacles; this controller has no level or rendering dependencies.
 */
export default class PursuitAI extends CharacterAI {
  constructor(body, { candidates, navigation, ...options } = {}) {
    super(body, options)
    if (typeof navigation?.route !== 'function' || typeof navigation?.clear !== 'function')
      throw new TypeError('PursuitAI requires navigation.route and navigation.clear')
    this.candidates = candidates ?? [this.target].filter(Boolean)
    this.navigation = navigation
    this.lastSeen = null
    this.searchLeft = 0
    this.looked = 0
    this.route = []
    this.repath = 0
  }

  update(dt) {
    if (this.body.dead) return
    this.repath -= dt
    if (!this.body.swing || !this.target?.alive) {
      const previous = this.target
      const visible = this.candidates.filter(target => {
        this.target = target
        return this.spotted
      }).sort((a, b) => Math.hypot(a.x - this.body.x, a.z - this.body.z)
        - Math.hypot(b.x - this.body.x, b.z - this.body.z))
      const nearest = visible[0]
      const distance = target => Math.hypot(target.x - this.body.x, target.z - this.body.z)
      const keep = visible.includes(previous) && (!nearest || distance(nearest) >= distance(previous) * .7)
      this.target = keep ? previous : nearest ?? (previous?.alive ? previous : null)
      this.body.targets = this.candidates
    }
    if (this.spotted) {
      this.lastSeen = { x: this.target.x, z: this.target.z, target: this.target }
      this.searchLeft = 12
      this.looked = 0
      if (this.doing === 'search') this.set('pursue')
    } else if (this.lastSeen) {
      // The base hit reaction must not turn toward a hidden target's current position.
      this.hits = this.body.hitsTaken
      this.searchLeft -= dt
      if (this.searchLeft <= 0 || this.lastSeen.target.dead) this.endSearch()
      else this.set('search')
    }
    super.update(dt)
  }

  endSearch() {
    this.lastSeen = null
    this.route = []
    this.destination = null
    this.repath = 0
    this.set(this.way)
  }

  moveTo(point) {
    const { body, navigation } = this
    if (this.repath <= 0 || !this.destination || Math.hypot(point.x - this.destination.x, point.z - this.destination.z) > 1) {
      this.route = navigation.route(body, point)
      this.destination = { x: point.x, z: point.z }
      this.repath = 1
    }
    if (this.route.length === 1 && navigation.clear(body, point)) this.route[0] = { x: point.x, z: point.z }
    while (this.route.length && Math.hypot(body.x - this.route[0].x, body.z - this.route[0].z) < .4) this.route.shift()
    while (this.route.length > 1 && navigation.clear(body, this.route[1])) this.route.shift()
    if (!this.route.length) return this.stand()
    body.face(this.route[0])
    this.walk(true)
  }

  pursue() {
    if (!this.spotted) return this.set(this.lastSeen ? 'search' : this.way)
    if (this.inReach) {
      this.stand()
      this.set('attack')
    } else this.moveTo(this.lastSeen)
  }

  search(dt) {
    const { body, lastSeen } = this
    if (Math.hypot(body.x - lastSeen.x, body.z - lastSeen.z) > .5) return this.moveTo(lastSeen)
    this.stand()
    if (!this.looked) this.searchYaw = body.yaw
    this.looked += dt
    this.faceAngle(this.searchYaw + Math.sin(this.looked * 2) * Math.PI / 3)
    if (this.looked >= 2) this.endSearch()
  }

  attack() {
    if (this.spotted) super.attack()
    else this.set(this.lastSeen ? 'search' : this.way)
  }
}
