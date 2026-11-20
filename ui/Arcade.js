import DailyCoins from './DailyCoins.js'
import DevelopmentCoins, { isLocalCoinHost } from './DevelopmentCoins.js'

const coin = '<span class="arcade-coin" aria-hidden="true">★</span>'

/** The cabinets of the homepage and the pocket of daily tokens; routing, loading and paying stay in scenes/main. */
export default class Arcade {
  constructor() {
    this.isLocal = isLocalCoinHost(location.hostname)
    this.coins = this.isLocal ? new DevelopmentCoins() : new DailyCoins()
    this.cards = [...document.querySelectorAll('.menu-item[data-path]')]
    this.games = new Map(this.cards.map(card => [card.dataset.path, card.querySelector('h3').textContent]))
    // direct links to scenes left off the homepage still open
    for (const [path, title] of Object.entries({
      'to-trieste': 'To Trieste!', 'graffiti-city-maze': 'Graffiti City Maze', 'lookat-cursor': 'Look at Cursor',
    })) this.games.set(path, title)

    this.wallet = this.createWallet()
    this.cards.forEach(card => this.addCabinet(card))

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

  /** A card is an arcade cabinet with the game on its screen and a coin slot below; clicking it opens the game. */
  addCabinet(card) {
    card.classList.add('arcade-cabinet')
    const screen = document.createElement('div')
    screen.className = 'arcade-screen'
    card.querySelector('img').before(screen)
    screen.appendChild(card.querySelector('img'))
    const slot = document.createElement('button')
    slot.type = 'button'
    slot.className = 'arcade-slot'
    slot.setAttribute('aria-label', `Play ${this.games.get(card.dataset.path)}`)
    slot.innerHTML = `${coin}<span class="arcade-slot-label">INSERT COIN<small>1 COIN · 1 PLAY</small></span><span class="arcade-slot-mouth" aria-hidden="true"></span>`
    card.appendChild(slot)
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
