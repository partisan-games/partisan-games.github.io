/**
 * A body crouching down or getting up as its `crouched` changes: each change, `crouchDown` or `crouchUp`, takes its
 * `durations` seconds, or happens at once with none. While it lasts the body stands still and its `posture` is
 * `{ name, time }`; a change turned back midway goes back from the same share of the way. A swing under way delays a change and cuts one
 * short; death ends it. The body's `crouchProgress` is 1 crouched and 0 standing. Getting up or crouching may take a
 * recorded step: `shift(name, time)` gives how far forward, in metres, the body has gone `time` seconds into it, and
 * the body takes the step only where `clear(body, point)`.
 */
export default class Posture {
  constructor(body, { durations = { crouchDown: 0, crouchUp: 0 }, shift = () => 0, clear = () => true } = {}) {
    Object.assign(this, { body, durations, shift, clear })
    this.crouched = body.crouched
    this.change = null
  }

  update(dt) {
    const { body, durations } = this
    if (body.dead) {
      body.posture = this.change = null
      return
    }
    const next = body.crouched ? 'crouchDown' : 'crouchUp'
    if (body.crouched !== this.crouched && (!body.swing || !durations[next])) {
      this.crouched = body.crouched
      const done = this.change ? this.change.time / durations[this.change.name] : 1
      this.change = durations[next] ? { name: next, time: (1 - done) * durations[next] } : null
    }
    if (this.change) {
      const { name, time } = this.change
      this.change.time = Math.min(durations[name], time + dt)
      this.step(name, time, this.change.time)
      if (this.change.time >= durations[name] || body.swing) this.change = null
      else body.steer()
    }
    body.posture = this.change
    const fraction = this.change ? this.change.time / durations[this.change.name] : 1
    body.crouchProgress = this.crouched ? fraction : 1 - fraction
  }

  /** The part of the recorded step between `from` and `to` seconds, unless a wall is in the way. */
  step(name, from, to) {
    const { body } = this
    const step = this.shift(name, to) - this.shift(name, from)
    const point = { x: body.x + Math.cos(body.yaw) * step, z: body.z - Math.sin(body.yaw) * step }
    if (step && this.clear(body, point)) Object.assign(body, point)
  }
}
