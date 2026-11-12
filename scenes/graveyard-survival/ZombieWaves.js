/** One zombie per elapsed interval, as before; a slow frame does not release a catch-up crowd. */
export default class ZombieWaves {
  constructor({ session, spawn }) {
    this.session = session
    this.spawn = spawn
    this.last = session.clock.now
  }

  update(interval = 10) {
    if (this.session.state !== 'running') return
    if (this.session.clock.now < this.last + interval) return
    this.last = this.session.clock.now
    this.spawn()
  }
}
