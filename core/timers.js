/**
 * Delayed actions in game time. The scene loop moves this clock, so the actions wait while the game is paused,
 * and a new scene starts with an empty clock, so they never fire in the next game.
 */
let now = 0
let lastId = 0
const pending = new Map()

/** Runs the action after the given number of seconds of game time; returns an id for cancel(). */
export function after(seconds, action) {
  pending.set(++lastId, { at: now + seconds, action })
  return lastId
}

export function cancel(id) {
  pending.delete(id)
}

export function update(dt) {
  now += dt
  const due = [...pending].filter(([, timer]) => timer.at <= now)
  for (const [id, { action }] of due)
    if (pending.delete(id)) action() // an earlier action may have cancelled it
}

export function clear() {
  pending.clear()
  now = 0
}
