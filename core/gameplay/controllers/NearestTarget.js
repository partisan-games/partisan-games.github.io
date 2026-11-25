/**
 * Turns a fighter's attention to the nearest living one of `candidates`, an array the scene keeps: every `interval`
 * seconds, and at once when its target falls, it sets `ai.target`, the target of the controller that fights.
 */
export default class NearestTarget {
  constructor(ai, { candidates, interval = 1 }) {
    Object.assign(this, { ai, candidates, interval })
    this.wait = 0
  }

  update(dt) {
    const { ai } = this
    if (ai.body.dead) return
    this.wait -= dt
    if (this.wait > 0 && ai.target?.alive) return
    this.wait = this.interval
    let nearest = null, nearestDistance = Infinity
    for (const candidate of this.candidates) {
      const distance = Math.hypot(candidate.x - ai.body.x, candidate.z - ai.body.z)
      if (candidate.alive && distance < nearestDistance) [nearest, nearestDistance] = [candidate, distance]
    }
    ai.target = nearest
  }
}
