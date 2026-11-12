import GameClock from './GameClock.js'
import ResourceScope from './ResourceScope.js'

/**
 * One game from loading to teardown: loading → ready → running ⇄ paused → finished → disposed.
 * It owns two clocks and the scopes that wait on them:
 * - gameplay: spawns, cooldowns, respawns; moves only while the game runs and ends with the first result;
 * - presentation: closing explosions and animations; also moves after the result, until the game is gone.
 * `scope` holds whatever lives for the whole game, such as listeners; dispose() ends everything once.
 */
export default class GameSession {
  #state = 'loading'
  #abort = new AbortController()

  constructor() {
    this.clock = new GameClock()
    this.presentationClock = new GameClock()
    this.scope = new ResourceScope()
    this.gameplay = new ResourceScope({ clock: this.clock })
    this.presentation = new ResourceScope({ clock: this.presentationClock })
    this.scope.add(() => this.presentation.dispose())
    this.scope.add(() => this.gameplay.dispose())
  }

  get state() {
    return this.#state
  }

  /** Aborted when the game is gone: for loaders that accept a signal, and for checks after an await. */
  get signal() {
    return this.#abort.signal
  }

  get active() {
    return this.#state !== 'disposed'
  }

  ready() {
    if (this.#state === 'loading') this.#state = 'ready'
  }

  start() {
    if (this.#state === 'loading' || this.#state === 'ready') this.#state = 'running'
  }

  pause() {
    if (this.#state === 'running') this.#state = 'paused'
  }

  resume() {
    if (this.#state === 'paused') this.#state = 'running'
  }

  /** Victory or defeat: gameplay ends for good, so no more spawns, cooldowns or delayed game actions. */
  finish() {
    if (this.#state !== 'running' && this.#state !== 'paused') return
    this.#state = 'finished'
    this.gameplay.dispose()
  }

  update(dt) {
    if (this.#state === 'running') this.clock.advance(dt)
    if (this.#state === 'running' || this.#state === 'finished') this.presentationClock.advance(dt)
  }

  /**
   * Waits for an async result that belongs to this game. When the game is gone by then,
   * `release` frees the late result and the wait rejects with the abort reason, so the caller stops.
   */
  async keep(promise, release = () => {}) {
    const result = await promise
    if (this.active) return result
    release(result)
    throw this.signal.reason
  }

  dispose() {
    if (this.#state === 'disposed') return
    this.#state = 'disposed'
    this.#abort.abort()
    this.scope.dispose()
  }
}
