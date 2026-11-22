/**
 * In seconds, how long a machine gunner waits before his first burst at most, beyond `firstWait`, and how long between
 * bursts at least and at most; how likely a burst hits a crew member, and how much damage it deals.
 */
export const gunner = { firstWait: 2, firstSpread: 3, wait: { least: 5, most: 9 }, hitChance: .3, damage: 8 }

/** An Italian machine gunner behind a firing slit, who fires a burst at the gun now and then while his post stands. */
export default class Gunner {
  constructor({ random = Math.random } = {}) {
    this.random = random
    this.wait = gunner.firstWait + random() * gunner.firstSpread
  }

  /** Waits out `dt` seconds while `manned`; gives the burst he fires now, `{ hit }`, or null. */
  update(dt, manned) {
    if (!manned) return null
    this.wait -= dt
    if (this.wait > 0) return null
    const { least, most } = gunner.wait
    this.wait = least + this.random() * (most - least)
    return { hit: this.random() < gunner.hitChance }
  }
}
