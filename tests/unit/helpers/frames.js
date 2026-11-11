/** Replaces requestAnimationFrame with a queue that a test advances frame by frame. */
export function installFakeFrames() {
  const queue = new Map()
  let lastId = 0
  let now = 0

  globalThis.requestAnimationFrame = callback => {
    queue.set(++lastId, callback)
    return lastId
  }
  globalThis.cancelAnimationFrame = id => queue.delete(id)

  return {
    get pending() {
      return queue.size
    },
    step(ms = 16) {
      now += ms
      const callbacks = [...queue.values()]
      queue.clear()
      callbacks.forEach(callback => callback(now))
    },
  }
}
