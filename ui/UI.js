import { icons, iconImages } from '/core/io/icons.js'
import { admission } from '/core/io/admission.js'
import config, { isTouchScreen, assets } from '/config.js'
import Controls from '../ui/Controls.js'
import Report from './Report.js'
import { currentStyleClasses, setUiStyle, styleChoices, uiStyleChoice, chooseUiStyle, onStyleChange } from './styles.js'
import Sound from '/core/io/audio/SoundSource.js'
import { setVolume } from './settings.js'
import { resetGameplayInput } from '/core/io/inputContext.js'

const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
// the UI that last drew into each shared element; a game ended late must not wipe the next game's screen
/** After the start screen, the top button of every screen goes back to the main menu, like Esc; the bottom one confirms or carries on. */
export const mainMenuButton = buttonClass => /* html */`<button class="${buttonClass}" id="menu"><span class="icon">${icons.menu}</span> Main menu</button>`

const drawnBy = new Map([[elementUI, null], [modalElement, null]])

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

/** The token a paid start costs, turning while one is available; how many are left shows in the pocket. */
const priceTag = available => {
  const image = available && !reducedMotion.matches ? iconImages.coin : iconImages.coinStill
  return `<span class="price" role="img" aria-label="costs 1 token"><img src="${assets.images}${image}" alt="" width="24" height="24"></span>`
}

const draw = (element, ui, html) => {
  element.innerHTML = html
  drawnBy.set(element, ui)
}

const erase = (element, ui) => {
  if (drawnBy.get(element) !== ui) return
  element.innerHTML = ''
  drawnBy.set(element, null)
}

export default class UI {
  constructor(scene, {
    intro = '',
    showControls = !isTouchScreen,
    startButtonText = 'Start mission',
    reportText,
    controlKeys,
    customStartScreen,
    uiStyle,
    onStart,
    onContinue,
  } = {}) {
    setUiStyle(uiStyle)
    this.scene = scene
    this.turnSound = new Sound('fire-swoosh.mp3', { volume: .2, profile: 'ui' })
    this.victorySound = new Sound('fairy-arcade-sparkle.mp3', { volume: .5, profile: 'ui', afterFinish: true })
    this.defeatSound = new Sound('defeat-swoosh.mp3', { volume: .5, profile: 'ui', afterFinish: true })
    this.sounds = [this.turnSound, this.victorySound, this.defeatSound]
    this.intro = intro
    this.startButtonText = startButtonText
    this.reportText = reportText
    this.customStartScreen = customStartScreen
    this.cachedSceneUI = this.outro = ''
    this.screen = null // 'start', 'pause', 'end' or null
    this.messageElement = document.createElement('div')
    this.messageElement.className = 'message'
    modalElement.after(this.messageElement)

    if (showControls)
      this.controlsUI = new Controls({ controlKeys })

    this.onStart = onStart
    this.onContinue = onContinue
    if (onStart || onContinue) modalElement.addEventListener('click', this.handleScreenClick)
    modalElement.addEventListener('input', this.handleScreenInput)
    modalElement.addEventListener('change', this.handleScreenChange)
    this.stopRestyling = onStyleChange(this.restyle)
    document.addEventListener('keydown', this.handleModalKey)
  }

  handleModalKey = e => {
    if (this.ended || !this.screen || drawnBy.get(modalElement) !== this || e.key !== 'Tab') return
    // A native dialog owns focus while it is in the browser's top layer.
    if (document.querySelector('dialog[open]')) return
    const controls = [...modalElement.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')].filter(element => element.type !== 'hidden' && !element.closest('[hidden]'))
    e.preventDefault()
    const current = controls.indexOf(document.activeElement)
    const next = current < 0 ? (e.shiftKey ? controls.length - 1 : 0) : (current + (e.shiftKey ? -1 : 1) + controls.length) % controls.length
    ;(controls[next] || modalElement).focus({ preventScroll: true })
  }

  handleScreenClick = e => {
    if (this.ended || drawnBy.get(modalElement) !== this) return
    if (e.target.closest('button')?.disabled) return
    const id = e.target.closest('button')?.id
    if (id === 'start') this.onStart?.()
    if (id === 'continue') this.onContinue?.()
    if (id === 'settings') this.showScreen('pause', this.settingsScreen())
    if (id === 'settings-back') this.showScreen('pause', this.escModal())
  }

  handleScreenInput = e => {
    if (this.ended || drawnBy.get(modalElement) !== this) return
    if (e.target.id === 'volume') setVolume(e.target.value / 100)
  }

  handleScreenChange = e => {
    if (this.ended || drawnBy.get(modalElement) !== this) return
    if (e.target.id === 'ui-style') chooseUiStyle(e.target.value)
  }

  /** Gives the open screen the classes of the new style; the HUD takes them as it is drawn again. */
  restyle = (before, after) => {
    if (this.ended || drawnBy.get(modalElement) !== this) return
    for (const role of ['container', 'button']) {
      const old = before[role].split(' ')
      for (const element of modalElement.querySelectorAll(`.${old.join('.')}`)) {
        element.classList.remove(...old)
        element.classList.add(...after[role].split(' '))
      }
    }
  }

  clear() {
    erase(elementUI, this)
    this.hideScreen()
  }

  clearIntro() {
    if (this.ended) return
    this.intro = ''
    this.hideScreen()
    if (this.report) this.report.stop()
  }

  showScreen(name, html) {
    if (this.ended) return
    this.screen = name
    draw(modalElement, this, html)
    modalElement.setAttribute('role', 'dialog')
    modalElement.setAttribute('aria-modal', 'true')
    modalElement.setAttribute('aria-label', modalElement.querySelector('h2, h3')?.textContent || this.startButtonText)
    modalElement.tabIndex = -1
    resetGameplayInput()
    this.markPaid()
    const first = modalElement.querySelector('button:not(:disabled), input:not(:disabled), select:not(:disabled)')
    ;(first || modalElement).focus({ preventScroll: true })
    this.messageElement.hidden = true
  }

  /**
   * Shows the token on every button that starts a paid game (`data-paid`), disables those buttons with none left and
   * shows the pocket; called again when the pocket changes. An unknown pocket leaves them working, as it is not empty.
   */
  markPaid() {
    if (this.ended || drawnBy.get(modalElement) !== this) return
    const left = admission.remaining()
    const paid = modalElement.querySelectorAll('[data-paid]')
    // the pocket shows how many tokens are left while a screen asks for one
    document.body.classList.toggle('paid-screen', paid.length > 0)
    for (const element of paid) {
      element.querySelector('.price')?.remove()
      element.insertAdjacentHTML('beforeend', priceTag(left !== 0))
      element.classList.add('paid')
      const control = element.matches('button, input') ? element : element.querySelector('button, input')
      if (control) control.disabled = left === 0
    }
  }

  /** A word in the open start screen, such as why the game could not start. */
  showStartNotice(text) {
    if (this.ended || this.screen !== 'start' || drawnBy.get(modalElement) !== this) return
    const notice = modalElement.querySelector('.start-notice') ?? modalElement.firstElementChild?.appendChild(document.createElement('p'))
    if (!notice) return
    notice.className = 'start-notice'
    notice.setAttribute('role', 'alert')
    notice.textContent = text
  }

  hideScreen() {
    this.screen = null
    if (drawnBy.get(modalElement) === this) document.body.classList.remove('paid-screen')
    if (drawnBy.get(modalElement) === this) {
      modalElement.removeAttribute('role')
      modalElement.removeAttribute('aria-modal')
      modalElement.removeAttribute('aria-label')
      modalElement.removeAttribute('tabindex')
    }
    erase(modalElement, this)
    this.messageElement.hidden = false
  }

  startScreen() {
    const classes = currentStyleClasses()
    if (this.customStartScreen) return this.customStartScreen(classes)

    const { container, button } = classes
    return /* html */`
      <div class="central-screen flex-column ${container}" id="start-screen">
        <p>${this.intro}</p>
        <button class="${button}" id="start" data-paid><span class="icon">${icons.start}</span> ${this.startButtonText}</button>
      </div>
    `
  }

  escModal() {
    const { container, button } = currentStyleClasses()
    return /* html */`
      <div class="central-screen flex-column ${container}">
        <h3 class="olive">Game paused</h3>
        ${mainMenuButton(button)}
        <button class="${button}" id="settings"><span class="icon">${icons.settings}</span> Settings</button>
        <button class="${button}" id="igraj-opet" ${this.scene.costsToken ? 'data-paid' : ''}><span class="icon replay-icon">${icons.replay}</span> Play again</button>
        <button class="${button}" id="continue"><span class="icon">${icons.continue}</span> Continue</button>
      </div>
    `
  }

  /** Shared by every game; more settings join the volume here. */
  settingsScreen() {
    const { container, button } = currentStyleClasses()
    return /* html */`
      <div class="central-screen flex-column ${container}">
        <h3 class="olive"><span class="icon">${icons.settings}</span> Settings</h3>
        ${mainMenuButton(button)}
        <label for="volume">Volume</label>
        <input type="range" id="volume" min="0" max="100" step="5" value="${Math.round(config.volume * 100)}">
        <label for="ui-style">UI style</label>
        <select id="ui-style">
          ${Object.entries(styleChoices).map(([value, name]) => `<option value="${value}" ${value === uiStyleChoice() ? 'selected' : ''}>${name}</option>`).join('')}
        </select>
        <button class="${button}" id="settings-back"><span class="icon">${icons.back}</span> Back</button>
      </div>
    `
  }

  endScreen() {
    const { container, button } = currentStyleClasses()
    return /* html */`
      <div class="central-screen flex-column ${container}">
        ${this.outro}
        ${mainMenuButton(button)}
        <button class="${button}" id="igraj-opet" ${this.scene.costsToken ? 'data-paid' : ''}><span class="icon replay-icon">${icons.replay}</span> Play again</button>
      </div>
    `
  }

  renderStartScreen() {
    if (this.ended) return
    this.report?.stop()
    this.showScreen('start', this.startScreen())
    if (this.reportText) {
      this.report = new Report({ text: this.reportText, container: modalElement.querySelector('#start-screen') })
      this.audioChildren = [this.report]
      this.scene.sceneAudio.attach(this.report)
    }
  }

  showPauseScreen() {
    this.showScreen('pause', this.escModal())
  }

  showDefeatScreen(text) {
    if (this.ended) return
    this.defeatSound.play()
    let html = `<h3 class="red"><span class="icon">${icons.defeat}</span> Game over</h3>`
    if (text) html += `<p>${text}</p>`
    this.outro = html
    this.showScreen('end', this.endScreen())
  }

  showVictoryScreen(text, title = 'Pobeda!') {
    if (this.ended) return
    this.victorySound.play()
    let html = `<h3 class="olive"><span class="icon">${icons.victory}</span> ${title}</h3>`
    if (text) html += `<p>${text}</p>`
    this.outro = html
    this.showScreen('end', this.endScreen())
  }

  scoreUI(text = 'Score', points = 0, subtext, subpoints, smallClass = '') {
    return /* html */`
      <div class="top-left ${currentStyleClasses().score}">
        <div>
          ${text}: ${points}
          ${subtext ? `<br><small class="${smallClass}">${subtext}: ${subpoints}</small>` : ''}
        </div>
      </div>
    `
  }

  showMessage(txt) {
    if (this.ended || this.screen) return // a message would cover the start, pause or end screen

    this.message = txt
    clearTimeout(this.messageTimer)
    this.messageElement.innerHTML = /* html */`
      <div class="central-screen">
        <h3>${txt}</h3>
      </div>
    `
    this.messageTimer = setTimeout(() => {
      if (this.ended) return
      this.message = ''
      this.messageElement.innerHTML = ''
    }, 3000)
  }

  end() {
    if (this.ended) return
    this.ended = true
    clearTimeout(this.messageTimer)
    modalElement.removeEventListener('click', this.handleScreenClick)
    modalElement.removeEventListener('input', this.handleScreenInput)
    modalElement.removeEventListener('change', this.handleScreenChange)
    this.stopRestyling()
    document.removeEventListener('keydown', this.handleModalKey)
    this.clear()
    this.messageElement.remove()
    this.report?.stop()
    this.controlsUI?.end()
  }

  render(t) {
    if (this.ended) return
    const html = this.scene.sceneUI(t)
    if (this.cachedSceneUI === html) return

    this.cachedSceneUI = html
    draw(elementUI, this, html)
  }
}
