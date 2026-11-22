/** Opt-in first contacts only; idle worlds do not walk native manifolds. Borrowed native values stay borrowed. */
export default class ContactEvents {
  constructor(pointerOf) {
    this.pointerOf = pointerOf
    this.listeners = new Map()
  }

  once(body, callback) {
    this.listeners.set(this.pointerOf(body), callback)
  }

  remove(body) {
    this.listeners.delete(this.pointerOf(body))
  }

  update(dispatcher) {
    if (!this.listeners.size) return
    for (let i = 0; i < dispatcher.getNumManifolds() && this.listeners.size; i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i)
      const first = this.pointerOf(manifold.getBody0()), second = this.pointerOf(manifold.getBody1())
      if (!this.listeners.has(first) && !this.listeners.has(second)) continue
      for (let j = 0; j < manifold.getNumContacts(); j++) {
        const contact = manifold.getContactPoint(j)
        if (contact.getDistance() > 0) continue
        for (const [id, readPoint] of [[first, () => contact.getPositionWorldOnA()], [second, () => contact.getPositionWorldOnB()]]) {
          const callback = this.listeners.get(id)
          if (!callback) continue
          this.listeners.delete(id)
          const point = readPoint()
          callback({ x: point.x(), y: point.y(), z: point.z() }, id === first ? second : first)
        }
        break
      }
    }
  }

  clear() {
    this.listeners.clear()
  }
}
