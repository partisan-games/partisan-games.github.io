/** How many seconds, at least and at most, a sentry stands at ease and walks its patrol before it changes. */
export const watch = { idle: { min: 1.5, max: 4 }, move: { min: 2, max: 5 } }

const lasting = ({ min, max }) => min + Math.random() * (max - min)

/**
 * The calm watch of a body that has the states `idle` and `move`: it stands at ease and walks its patrol in turn,
 * each for a while of its own. In any other state, such as firing, the sentry leaves the body alone.
 */
export default class Sentry {
  constructor(body) {
    this.body = body
    this.state = null
    this.left = 0
  }

  update(dt) {
    const { body } = this
    const { state } = body
    if (!body.alive || !Object.hasOwn(watch, state)) return
    // a state set from outside starts a fresh while
    if (state !== this.state) {
      this.state = state
      this.left = lasting(watch[state])
    }
    this.left -= dt
    if (this.left > 0) return
    const next = state === 'idle' ? 'move' : 'idle'
    body.setState(next)
    this.state = next
    this.left = lasting(watch[next])
  }
}
