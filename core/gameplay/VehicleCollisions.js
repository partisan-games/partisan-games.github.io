// Balance rules, deliberately separate from the historical model statistics.
export const collisionRules = { referenceSpeed: 12, damage: .55, crushMassRatio: 3, crushSpeed: 1 }

export function collisionRank(physical) {
  if (!physical || !Number.isFinite(physical.massKg) || physical.massKg <= 0) return null
  if (physical.structure === 'soft' || physical.structure === 'towed') return 1
  return physical.massKg < 10000 ? 2 : physical.massKg < 30000 ? 3 : 4
}

/** Fractions of maximum health, with softer obstacles transmitting less damage.
 * Mass weighting and relative speed inform an arcade rule, not a crash simulation.
 */
export function collisionDamage(first, second, speed) {
  const rankA = collisionRank(first), rankB = collisionRank(second)
  if (!rankA || !rankB || !Number.isFinite(speed) || speed <= 0) return null
  const energy = collisionRules.damage * (speed / collisionRules.referenceSpeed) ** 2
  const total = first.massKg + second.massKg
  const resistance = rank => rank === 1 ? .2 : rank === 2 ? .5 : 1
  const crushes = (heavy, light, lightRank) => lightRank <= 2
    && collisionRank(heavy) >= 3 && heavy.massKg / light.massKg >= collisionRules.crushMassRatio
    && speed >= collisionRules.crushSpeed
  return {
    first: crushes(second, first, rankA) ? 1 : energy * 2 * second.massKg / total * resistance(rankB),
    second: crushes(first, second, rankB) ? 1 : energy * 2 * first.massKg / total * resistance(rankA),
    crushFirst: crushes(second, first, rankA),
    crushSecond: crushes(first, second, rankB),
  }
}

const epsilon = 1e-6

/** Longitudinal contacts for ground vehicles. A scene supplies the bodies sharing its road.
 * Capture before movement, resolve afterward; dead wrecks and actors without known mass are ignored.
 */
export default class VehicleCollisions {
  constructor(driver) {
    this.driver = driver
    this.touching = new Map()
    this.previous = new Map()
  }

  get blocked() {
    return this.driver.alive && [...this.touching].some(([body, side]) => body.alive && side === this.driver.forward)
  }

  capture(others) {
    this.previous = new Map([this.driver, ...others].map(body => [body, { x: body.x, vx: body.vx }]))
  }

  resolve(others, dt) {
    if (!(dt > 0)) return
    const { driver } = this, start = this.previous.get(driver)
    const touching = new Map()
    if (!start || driver.dead || !collisionRank(driver.physical)) {
      this.touching = touching
      return
    }
    const ordered = [...others].sort((a, b) => Math.abs(a.x - start.x) - Math.abs(b.x - start.x))
    for (const body of ordered) {
      if (driver.dead) break
      const previous = this.previous.get(body)
      if (!previous || body.dead || !collisionRank(body.physical)) continue
      if (Math.abs(driver.z - body.z) >= (driver.size.width + body.size.width) / 2
        || Math.abs(driver.y - body.y) >= (driver.size.height + body.size.height) / 2) continue
      const side = Math.sign(previous.x - start.x) || driver.forward
      const half = (driver.size.length + body.size.length) / 2
      const before = side * (previous.x - start.x)
      const after = side * (body.x - driver.x)
      if (after > half + epsilon) continue
      const closing = before - after
      if (closing < -epsilon) continue
      const time = closing > epsilon ? Math.max(0, Math.min(1, (before - half) / closing)) : 0
      const speed = Math.max(0, closing / dt, side * (start.vx - previous.vx))
      const damage = collisionDamage(driver.physical, body.physical, speed)
      if (!this.touching.has(body) && damage) {
        driver.takeHit(driver.health.maximum * damage.first)
        body.takeHit(body.health.maximum * damage.second)
      }
      if (body.dead) body.vx = 0
      if (driver.dead) driver.vx = 0
      if (body.dead || driver.dead) continue
      // Stop at the first contact, even when a large step would cross the whole body.
      driver.x = start.x + (driver.x - start.x) * time
      body.x = driver.x + side * half
      driver.vx = body.vx = 0
      touching.set(body, side)
    }
    this.touching = touching
  }
}
