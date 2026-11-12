/**
 * The native Ammo objects one owner created, freed together, newest first, each once.
 * Only objects made with `new Ammo.*` belong here: what a getter returns is borrowed and is never freed.
 * Memory from `Ammo._malloc` (heightfield data) cannot be freed: this Ammo build does not export `_free`.
 */
export default class NativeAllocations {
  #owned = []
  #known = new Set()

  /** Takes ownership and returns the object, so it can wrap a `new Ammo.*` call. */
  own = object => {
    // Ammo.destroy fails on it only when the game ends, so refuse it here, where the cause is
    if (typeof object.__destroy__ !== 'function')
      throw new TypeError(`${object.constructor.name} cannot be destroyed in this Ammo build; do not own it`)
    if (!this.#known.has(object)) {
      this.#known.add(object)
      this.#owned.push(object)
    }
    return object
  }

  get size() {
    return this.#owned.length
  }

  /** Frees every owned object with `destroy` (Ammo.destroy); a second call frees nothing. */
  dispose(destroy) {
    const owned = this.#owned.splice(0).reverse()
    this.#known.clear()
    owned.forEach(object => destroy(object))
  }
}
