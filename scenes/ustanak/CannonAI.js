import Cooldown from '/core/gameplay/Cooldown.js'

export default class CannonAI {
  constructor({ cannon, target, clock, random = Math.random }) {
    this.cannon = cannon
    this.target = target
    this.random = random
    this.nextForce = null
    this.lastShot = null
    this.previousMiss = 0
    this.wait = new Cooldown({ seconds: 1.2, clock })
    this.beginTurn()
  }

  beginTurn() {
    this.observeShot()
    this.wait.start()
  }

  prepareAim() {
    const { cannon, target } = this
    const { gravity, wind } = cannon.projektili[0]
    const solutions = [.15, .22, .3, .4, .5].map(elevation => {
      cannon.elevation = elevation
      const distance = Math.abs(target.x - cannon.vrhX)
      const height = target.y - cannon.vrhY
      const acceleration = cannon.direction * (wind?.acceleration || 0)
      const timeSquared = 2 * (distance * Math.tan(elevation) + height)
        / (gravity + acceleration * Math.tan(elevation))
      const force = timeSquared > 0
        ? (distance - acceleration * timeSquared / 2) / (Math.cos(elevation) * Math.sqrt(timeSquared))
        : cannon.minSila
      return { elevation, force }
    })
    const reachable = solutions.filter(aim => aim.force >= cannon.minSila && aim.force <= cannon.maxForce)
    const choices = reachable.length ? reachable : solutions.slice(0, 1)
    const aim = choices[Math.floor(this.random() * choices.length)]
    this.elevation = aim.elevation
    this.adjustment = Math.max(30, aim.force * .12)
    // Range grows roughly with power squared, so a small power error is enough.
    const error = .22 + this.random() * .02
    const short = aim.force * (1 - error)
    const long = aim.force * (1 + error)
    this.nextForce = this.random() < .5 && short >= cannon.minSila ? short : long
    if (this.nextForce > cannon.maxForce) this.nextForce = short
  }

  observeShot() {
    if (!this.lastShot || this.cannon.hasActiveShot) return
    const { projectile, force, health } = this.lastShot
    if (this.target.energija < health) {
      this.nextForce = force
      this.previousMiss = 0
    } else {
      const miss = Math.sign(this.cannon.direction * (this.target.x - projectile.x))
      if (this.previousMiss && miss !== this.previousMiss) this.adjustment = Math.max(15, this.adjustment * .5)
      this.previousMiss = miss
      this.nextForce = force + miss * this.adjustment
      // At a power limit, change the trajectory instead of repeating an unreachable shot.
      if (this.nextForce < this.cannon.minSila || this.nextForce > this.cannon.maxForce) {
        this.cannon.elevation = this.elevation + miss * .04
        this.elevation = this.cannon.elevation
      }
    }
    this.nextForce = Math.max(this.cannon.minSila, Math.min(this.cannon.maxForce, this.nextForce))
    this.lastShot = null
  }

  update() {
    if (!this.wait.ready) return
    const { cannon } = this
    if (this.nextForce === null) this.prepareAim()
    cannon.elevation = this.elevation
    cannon.sila = Math.max(cannon.minSila, Math.min(cannon.maxForce, this.nextForce * (.98 + this.random() * .04)))
    const force = cannon.sila
    const health = this.target.energija
    if (cannon.launch()) {
      this.lastShot = { projectile: cannon.projektili.find(projectile => projectile.visible), force, health }
      this.wait.start()
    }
  }
}
