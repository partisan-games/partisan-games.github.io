/**
 * Loads a move once per character, as a clip of its model and an action of its body as long as the clip; only the
 * latest selection is played, once the body is free to.
 */
export default class SpecialActions {
  constructor({ body, model, session, loadClip }) {
    this.body = body
    this.model = model
    this.session = session
    this.loadClip = loadClip
    this.loads = new Map()
    this.request = 0
    this.pending = null
  }

  async select(name) {
    if (this.session.state !== 'running') return
    const request = ++this.request
    this.pending = null
    if (!(name in this.model.actions)) {
      if (!this.loads.has(name))
        this.loads.set(name, this.loadClip(name).catch(error => {
          this.loads.delete(name)
          throw error
        }))
      const clip = await this.session.keep(this.loads.get(name))
      if (!(name in this.model.actions)) {
        this.model.anim.addAction(name, clip.clone())
        this.body.actions[name] = clip.duration
      }
    }
    if (request === this.request) {
      this.pending = name
      this.update()
    }
  }

  update() {
    if (this.body.dead) this.pending = null
    if (this.pending === null || this.session.state !== 'running' || this.body.swing || this.body.hurt > 0) return
    const name = this.pending
    this.pending = null
    this.body.attack(name)
  }
}
