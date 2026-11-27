import Cooldown from '../Cooldown.js'

/**
 * The computer at a field gun: it opens on the target at a random elevation with a power somewhat short or long,
 * watches where each shot lands and corrects the next towards the target, halving its correction once it has missed
 * on both sides. It fires once each wait of the game `clock` is over and the gun may fire. The gun has `forward`,
 * `elevation`, `force`, `forceFor(point, elevation)`, `launch()`, `hasActiveShot`, `shells` and `settings`, with its
 * `minForce`, `maxForce` and the `aimElevations` to open with; the target has `x`, `y` and `health`.
 */
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
    const { minForce, maxForce, aimElevations } = cannon.settings
    const solutions = aimElevations.map(elevation => {
      cannon.elevation = elevation
      return { elevation, force: cannon.forceFor(target, elevation) ?? minForce }
    })
    const reachable = solutions.filter(aim => aim.force >= minForce && aim.force <= maxForce)
    const choices = reachable.length ? reachable : solutions.slice(0, 1)
    const aim = choices[Math.floor(this.random() * choices.length)]
    this.elevation = aim.elevation
    this.adjustment = Math.max(.75, aim.force * .12)
    // Range grows roughly with power squared, so a small power error is enough.
    const error = .22 + this.random() * .02
    const short = aim.force * (1 - error)
    const long = aim.force * (1 + error)
    this.nextForce = this.random() < .5 && short >= minForce ? short : long
    if (this.nextForce > maxForce) this.nextForce = short
  }

  observeShot() {
    if (!this.lastShot || this.cannon.hasActiveShot) return
    const { minForce, maxForce } = this.cannon.settings
    const { projectile, force, health } = this.lastShot
    if (this.target.health.current < health) {
      this.nextForce = force
      this.previousMiss = 0
    } else {
      const miss = Math.sign(this.cannon.forward * (this.target.x - projectile.x))
      if (this.previousMiss && miss !== this.previousMiss) this.adjustment = Math.max(.375, this.adjustment * .5)
      this.previousMiss = miss
      this.nextForce = force + miss * this.adjustment
      // At a power limit, change the trajectory instead of repeating an unreachable shot: below 45° a higher barrel
      // carries farther, above it nearer.
      if (this.nextForce < minForce || this.nextForce > maxForce) {
        const farther = this.elevation < Math.PI / 4 ? 1 : -1
        this.cannon.elevation = this.elevation + farther * miss * .04
        this.elevation = this.cannon.elevation
      }
    }
    this.nextForce = Math.max(minForce, Math.min(maxForce, this.nextForce))
    this.lastShot = null
  }

  update() {
    if (!this.wait.ready) return
    const { cannon } = this
    const { minForce, maxForce } = cannon.settings
    if (this.nextForce === null) this.prepareAim()
    cannon.elevation = this.elevation
    cannon.force = Math.max(minForce, Math.min(maxForce, this.nextForce * (.98 + this.random() * .04)))
    const { force } = cannon
    const health = this.target.health.current
    if (cannon.launch()) {
      this.lastShot = { projectile: cannon.shells.projectiles.find(projectile => projectile.active), force, health }
      this.wait.start()
    }
  }
}
