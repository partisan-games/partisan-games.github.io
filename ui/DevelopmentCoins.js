import DailyCoins from './DailyCoins.js'

export const isLocalCoinHost = hostname => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)
export const developmentAllowance = 1000
export const developmentCoinStorageKey = 'partisan-games.development-coins.v1'

/** Same wallet rules as production, with a larger, separately stored local allowance. */
export default class DevelopmentCoins extends DailyCoins {
  constructor(options = {}) {
    super({ ...options, allowance: developmentAllowance, storageKey: developmentCoinStorageKey })
  }
}
