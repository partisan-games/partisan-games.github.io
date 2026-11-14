import DailyTokens, { tokenStorageKey } from './DailyTokens.js'

const coin = '<span class="arcade-coin" aria-hidden="true">★</span>'

/** The cabinet frontage and coin door; routing and loading stay in scenes/main. */
export default class Arcade {
  constructor() {
    this.tokens = new DailyTokens()
    this.busy = false
    this.cards = [...document.querySelectorAll('.menu-item[data-path]')]
    this.games = new Map(this.cards.map(card => [card.dataset.path, card.querySelector('h3').textContent]))
    // Existing direct links to scenes omitted from the homepage still use the coin door.
    for (const [path, title] of Object.entries({
      '2d-tank': '2D Tank', camac: 'Boat', 'graffiti-city-maze': 'Graffiti City Maze', 'lookat-cursor': 'Look at Cursor',
    })) this.games.set(path, title)

    this.wallet = document.createElement('aside')
    this.wallet.className = 'arcade-wallet'
    this.wallet.setAttribute('aria-label', 'Daily arcade coins')
    this.wallet.innerHTML = `${coin}<div><small>10 coins every day</small><strong class="arcade-balance" aria-live="polite"></strong><span class="arcade-eyebrow">coins left</span></div>`
    document.body.appendChild(this.wallet)

    for (const card of this.cards) {
      card.classList.add('arcade-cabinet')
      const screen = document.createElement('div')
      screen.className = 'arcade-screen'
      card.querySelector('img').before(screen)
      screen.appendChild(card.querySelector('img'))
      const lock = document.createElement('span')
      lock.className = 'arcade-lock'
      lock.innerHTML = '<span aria-hidden="true">▣</span> INSERT COIN'
      screen.appendChild(lock)
      const slot = document.createElement('button')
      slot.type = 'button'
      slot.className = 'arcade-slot'
      slot.dataset.arcadeGame = card.dataset.path
      slot.setAttribute('aria-label', `Insert one coin to play ${this.games.get(card.dataset.path)}`)
      slot.innerHTML = `${coin}<span class="arcade-slot-label">INSERT COIN<small>1 COIN · 1 PLAY</small></span><span class="arcade-slot-mouth" aria-hidden="true"></span>`
      card.appendChild(slot)
    }

    this.dialog = document.createElement('dialog')
    this.dialog.className = 'arcade-dialog'
    this.dialog.setAttribute('aria-labelledby', 'arcade-dialog-title')
    this.dialog.innerHTML = `${coin}<p class="arcade-eyebrow">PARTISAN ARCADE</p><h2 id="arcade-dialog-title"></h2><p class="arcade-dialog-message"></p><button type="button" class="arcade-slot arcade-dialog-insert">INSERT COIN · 1 COIN</button><form method="dialog"><button class="arcade-dialog-close">BACK</button></form>`
    document.body.appendChild(this.dialog)
    this.dialog.querySelector('.arcade-dialog-insert').addEventListener('click', () => this.onInsert?.(this.requestedPath))
    this.dialog.addEventListener('cancel', event => {
      if (this.busy) event.preventDefault()
      else if (this.mode === 'entry') this.onCancel?.()
    })
    this.dialog.querySelector('.arcade-dialog-close').addEventListener('click', () => {
      if (this.mode === 'entry') this.onCancel?.()
    })

    window.addEventListener('storage', event => {
      if (event.key === tokenStorageKey || event.key === null) this.refresh()
    })
    window.addEventListener('focus', () => this.refresh())
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.refresh()
    })
    this.refresh()
    this.scheduleReset()
  }

  scheduleReset() {
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 50)
    this.resetTimer = setTimeout(() => {
      this.refresh()
      this.scheduleReset()
    }, midnight - Date.now())
  }

  refresh() {
    try {
      const { remaining } = this.tokens.read()
      this.wallet.querySelector('.arcade-balance').textContent = String(remaining)
      document.body.classList.toggle('arcade-empty', remaining === 0)
      this.storageAvailable = true
    } catch {
      this.wallet.querySelector('.arcade-balance').textContent = 'UNAVAILABLE'
      this.storageAvailable = false
    }
    document.body.classList.toggle('arcade-home', !location.hash)
  }

  setBusy(busy, path) {
    this.busy = busy
    document.querySelectorAll('[data-arcade-game], .arcade-dialog-insert, .arcade-dialog-close, #igraj-opet').forEach(button => {
      button.disabled = busy
    })
    this.cards.forEach(card => card.classList.toggle('arcade-inserting', busy && card.dataset.path === path))
  }

  async insertCoin(path) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = this.cards.find(item => item.dataset.path === path)
    const token = this.dialog.open ? this.dialog.querySelector('.arcade-coin') : card?.querySelector('.arcade-slot .arcade-coin')
    if (!token?.isConnected || !token.getClientRects().length) return
    const target = this.dialog.open ? this.dialog.querySelector('.arcade-dialog-insert') : card.querySelector('.arcade-slot-mouth')
    const from = token.getBoundingClientRect(), to = target.getBoundingClientRect()
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

  prompt(path, mode = 'entry') {
    this.mode = mode
    this.requestedPath = path
    const title = this.dialog.querySelector('h2')
    const message = this.dialog.querySelector('.arcade-dialog-message')
    const insert = this.dialog.querySelector('.arcade-dialog-insert')
    insert.hidden = mode !== 'entry'
    if (mode === 'empty') {
      title.textContent = 'OUT OF COINS'
      message.textContent = 'You have used today’s coins. Your cabinet gets 10 fresh coins at midnight. See you tomorrow!'
    } else if (mode === 'storage') {
      title.textContent = 'COIN DOOR JAMMED'
      message.textContent = 'Allow this site to save browser data, then try again. Your daily coins need local storage.'
    } else {
      title.textContent = this.games.get(path)
      message.textContent = 'One coin starts one game. Play again costs another coin.'
    }
    if (!this.dialog.open) this.dialog.showModal()
  }

  close() {
    this.dialog.close()
  }
}
