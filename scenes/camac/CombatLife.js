import Health from '/core/gameplay/Health.js'

/** Health and the identity of one combat life, shared by local actor adapters. */
export default class CombatLife {
  constructor({ session, maximum = 100, onDeath }) {
    this.session = session
    this.health = new Health({ maximum })
    this.lifeId = 1
    this.onDeath = onDeath
  }

  damage(amount, lifeId = this.lifeId) {
    if (this.session.state !== 'running' || lifeId !== this.lifeId || !this.health.alive) return false
    if (this.health.damage(amount)) this.onDeath?.()
    return true
  }

  reset() {
    this.lifeId++
    this.health.reset()
  }
}
