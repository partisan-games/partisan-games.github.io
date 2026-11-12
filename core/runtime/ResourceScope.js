/**
 * Everything one owner has set up and must take down: cleanups, nested scopes and delayed actions.
 * dispose() runs every cleanup once, newest first, even when an earlier one throws.
 */
export default class ResourceScope {
  #cleanups = []
  #parent = null
  #disposed = false

  /** `clock` is the GameClock that after() waits on; a child scope inherits it. */
  constructor({ clock = null } = {}) {
    this.clock = clock
  }

  get disposed() {
    return this.#disposed
  }

  /** Registers a cleanup; it runs right away when the scope is already gone. Returns the cleanup. */
  add(cleanup) {
    if (this.#disposed) cleanup()
    else this.#cleanups.push(cleanup)
    return cleanup
  }

  /** A scope that ends with this one, or earlier on its own. */
  child() {
    const scope = new ResourceScope({ clock: this.clock })
    scope.#parent = this
    this.add(scope.#disposeFromParent)
    return scope
  }

  /** A delayed action on the scope's clock that is cancelled when the scope ends first. */
  after(seconds, action) {
    if (!this.clock) throw new Error('ResourceScope.after needs a scope with a clock')
    if (this.#disposed) return null

    let cleanup = null
    const id = this.clock.after(seconds, () => {
      this.#forget(cleanup)
      action()
    })
    cleanup = this.add(() => this.clock.cancel(id))
    return id
  }

  dispose() {
    if (this.#disposed) return
    this.#disposed = true
    this.#parent?.#forget(this.#disposeFromParent)

    const errors = []
    for (const cleanup of this.#cleanups.splice(0).reverse())
      try {
        cleanup()
      } catch (error) {
        errors.push(error)
      }
    if (errors.length === 1) throw errors[0]
    if (errors.length) throw new AggregateError(errors, 'Several cleanups failed')
  }

  #disposeFromParent = () => this.dispose()

  #forget(cleanup) {
    const i = this.#cleanups.indexOf(cleanup)
    if (i !== -1) this.#cleanups.splice(i, 1)
  }
}
