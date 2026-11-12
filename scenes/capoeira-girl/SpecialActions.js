/** Loads an action once per character; only the latest selection may change its state. */
export default class SpecialActions {
  constructor({ player, session, loadClip }) {
    this.player = player
    this.session = session
    this.loadClip = loadClip
    this.loads = new Map()
    this.request = 0
  }

  async select(name) {
    if (!this.session.active) return
    const request = ++this.request
    if (!(name in this.player.anim.actions)) {
      if (!this.loads.has(name))
        this.loads.set(name, this.loadClip(name).catch(error => {
          this.loads.delete(name)
          throw error
        }))
      const clip = await this.session.keep(this.loads.get(name))
      if (!(name in this.player.anim.actions)) this.player.addAction(name, clip.clone())
    }
    if (request === this.request && this.session.active) this.player.setState(name)
  }
}
