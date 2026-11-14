export const dailyAllowance = 10
export const tokenStorageKey = 'partisan-games.daily-tokens.v1'

const dayOf = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  .map((value, index) => index ? String(value).padStart(2, '0') : value).join('-')

/** One local-calendar allowance, shared by the games and tabs of this browser. */
export default class DailyTokens {
  constructor({ storage = localStorage, now = () => new Date(), locks = navigator.locks } = {}) {
    this.storage = storage
    this.now = now
    this.locks = locks
  }

  read() {
    const day = dayOf(this.now())
    let saved
    try {
      saved = JSON.parse(this.storage.getItem(tokenStorageKey))
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
    if (saved?.day === day && Number.isInteger(saved.remaining) && saved.remaining >= 0 && saved.remaining <= dailyAllowance)
      return saved

    return { day, remaining: dailyAllowance }
  }

  save(state) {
    this.storage.setItem(tokenStorageKey, JSON.stringify(state))
  }

  transact(action) {
    return this.locks ? this.locks.request(tokenStorageKey, action) : Promise.resolve().then(action)
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
        this.save({ ...state, remaining: Math.min(dailyAllowance, state.remaining + 1) })
    })
  }
}
