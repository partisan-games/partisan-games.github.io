import DailyCoins from './DailyCoins.js'
import DevelopmentCoins, { isLocalCoinHost } from './DevelopmentCoins.js'

const coin = '<span class="arcade-coin" aria-hidden="true">★</span>'

/** The cabinets of the homepage and the pocket of daily tokens; routing, loading and paying stay in scenes/main. */
export default class Arcade {
  constructor() {
    this.isLocal = isLocalCoinHost(location.hostname)
    this.coins = this.isLocal ? new DevelopmentCoins() : new DailyCoins()
    this.cards = [...document.querySelectorAll('.arcade-cabinet[data-path]')]
    this.games = new Map(this.cards.map(card => [card.dataset.path, card.querySelector('h3').textContent]))
    // direct links to scenes left off the homepage still open
    for (const [path, title] of Object.entries({
      'to-trieste': 'To Trieste!', 'graffiti-city-maze': 'Graffiti City Maze',
    })) this.games.set(path, title)

    this.wallet = this.createWallet()

    window.addEventListener('storage', this.handleStorage)
    window.addEventListener('focus', this.refresh)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.refresh()
    this.scheduleReset()
  }

  createWallet() {
    const wallet = document.createElement('aside')
    wallet.className = 'arcade-wallet'
    wallet.setAttribute('aria-label', 'Daily arcade coins')
    wallet.innerHTML = `${coin}<div><small>${this.isLocal ? 'LOCAL DEVELOPMENT' : `${this.coins.allowance} coins every day`}</small><strong class="arcade-balance" aria-live="polite"></strong><span class="arcade-eyebrow">coins left</span></div>`
    document.body.appendChild(wallet)
    return wallet
  }

  /** The original cabinet animation; spending the token still belongs to the game's Start button. */
  async insertCoin(path) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = this.cards.find(item => item.dataset.path === path)
    const token = card?.querySelector('.arcade-slot .arcade-coin')
    if (!token?.isConnected || !token.getClientRects().length) return
    const from = token.getBoundingClientRect(), to = card.querySelector('.arcade-slot-mouth').getBoundingClientRect()
    const x = to.left + to.width / 2 - from.left - from.width / 2
    const y = to.top + to.height / 2 - from.top - from.height / 2
    const animation = token.animate([
      { transform: 'translateY(0) rotateY(0)', opacity: 1 },
      { transform: `translate(${x * .7}px, ${y - 6}px) rotateY(65deg)`, opacity: 1, offset: .7 },
      { transform: `translate(${x}px, ${y}px) rotateY(90deg) scale(.8)`, opacity: 0 },
    ], { duration: 320, easing: 'ease-in', fill: 'forwards' })
    await animation.finished.catch(() => {})
    animation.cancel()
  }

  handleStorage = event => {
    if (event.key === this.coins.storageKey || event.key === null) this.refresh()
  }

  handleVisibilityChange = () => {
    if (!document.hidden) this.refresh()
  }

  /** The cabinet lives as long as the page; a test that builds one removes it, or its midnight timer keeps Node running for hours. */
  dispose() {
    clearTimeout(this.resetTimer)
    window.removeEventListener('storage', this.handleStorage)
    window.removeEventListener('focus', this.refresh)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.wallet.remove()
  }

  scheduleReset() {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 50)
    this.resetTimer = setTimeout(() => {
      this.refresh()
      this.scheduleReset()
    }, midnight - Date.now())
  }

  refresh = () => {
    try {
      const { remaining } = this.coins.read()
      this.wallet.querySelector('.arcade-balance').textContent = String(remaining)
      document.body.classList.toggle('arcade-empty', remaining === 0)
      this.storageAvailable = true
    } catch {
      this.wallet.querySelector('.arcade-balance').textContent = 'UNAVAILABLE'
      this.storageAvailable = false
    }
    document.body.classList.toggle('arcade-home', !location.hash)
    this.onChange?.()
  }
}
