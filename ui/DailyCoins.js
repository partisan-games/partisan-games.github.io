export const dailyAllowance = 10
// Keep the established storage key so existing balances and cross-tab locks survive the rename.
export const coinStorageKey = 'partisan-games.daily-tokens.v1'

const dayOf = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  .map((value, index) => index ? String(value).padStart(2, '0') : value).join('-')

/** One local-calendar allowance, shared by the games and tabs of this browser. */
export default class DailyCoins {
  constructor({ storage = localStorage, now = () => new Date(), locks = navigator.locks, allowance = dailyAllowance, storageKey = coinStorageKey } = {}) {
    this.storage = storage
    this.now = now
    this.locks = locks
    this.allowance = allowance
    this.storageKey = storageKey
  }

  read() {
    const day = dayOf(this.now())
    let saved
    try {
      saved = JSON.parse(this.storage.getItem(this.storageKey))
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
    if (saved?.day === day && Number.isInteger(saved.remaining) && saved.remaining >= 0 && saved.remaining <= this.allowance)
      return saved

    return { day, remaining: this.allowance }
  }

  save(state) {
    this.storage.setItem(this.storageKey, JSON.stringify(state))
  }

  transact(action) {
    return this.locks ? this.locks.request(this.storageKey, action) : Promise.resolve().then(action)
  }

  spend() {
    return this.transact(() => {
      const state = this.read()
      if (!state.remaining) return null
      this.save({ ...state, remaining: state.remaining - 1 })
      return { day: state.day }
    })
  }

  refund(receipt) {
    return this.transact(() => {
      const state = this.read()
      // Yesterday's failed entry must not add to today's allowance.
      if (receipt.day === state.day)
        this.save({ ...state, remaining: Math.min(this.allowance, state.remaining + 1) })
    })
  }
}
