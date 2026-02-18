import { isTouchScreen } from '/config.js'
import Controls from '../ui/Controls.js'
import Report from './Report.js'
import '/core/io/FullScreen.js'

const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')

export const uiStyles = {
  simple: 'simple',
  rpg: 'rpg',
  white: 'white',
}

export const containers = {
  simple: 'simple-container',
  rpg: 'rpgui-container framed',
  white: 'white-container',
}

const scores = {
  simple: '',
  rpg: 'rpgui-button golden',
  white: '',
}

export const buttons = {
  simple: 'default-button',
  rpg: 'rpgui-button',
  white: 'white-button',
}

export const controlButtons = {
  simple: '',
  rpg: 'rpgui-button',
  white: 'white-button',
}

export default class UI {
  constructor(scene, {
    intro = '',
    showControls = !isTouchScreen,
    startButtonText = 'Start mission',
    uiStyle = uiStyles.simple,
    reportText,
    controlKeys,
    customStartScreen,
    showFullScreen = true,
  } = {}) {
    this.scene = scene
    this.intro = intro
    this.startButtonText = startButtonText
    this.reportText = reportText
    this.customStartScreen = customStartScreen
    this.cachedSceneUI = this.cachedModal = this.outro = ''
    this.uiStyle = uiStyle

    if (showControls)
      this.controlsUI = new Controls({ controlKeys, uiStyle })

    if (showFullScreen && document.fullscreenEnabled)
      document.body.appendChild(document.createElement('full-screen-btn'))
  }

  clear() {
    elementUI.innerHTML = modalElement.innerHTML = ''
  }

  clearIntro() {
    this.intro = ''
    modalElement.innerHTML = ''
    if (this.report) this.report.stop()
  }

  /* CENTRAL SCREEN */

  startScreen() {
    return this.customStartScreen || /* html */`
      <div class="central-screen flex-column ${containers[this.uiStyle]}" id="start-screen">
        <p>${this.intro}</p>
        <button class="${buttons[this.uiStyle]}" id="start"><span class="icon">🔥</span> ${this.startButtonText}</button>
      </div>
    `
  }

  escModal() {
    return /* html */`
      <div class="central-screen flex-column ${containers[this.uiStyle]}">
        <h3 class="olive">Game paused</h3>
        <button class="${buttons[this.uiStyle]}" id="continue"><span class="icon">🔥</span> Continue</button>
        <button class="${buttons[this.uiStyle]}" id="menu"><span class="icon">☰</span> Main menu</button>
        <button class="${buttons[this.uiStyle]}" id="igraj-opet"><span class="icon">↻</span> Play again</button>
      </div>
    `
  }

  endScreen() {
    return /* html */`
      <div class="central-screen flex-column ${containers[this.uiStyle]}">
        ${this.outro}
        <button class="${buttons[this.uiStyle]}" id="menu"><span class="icon">☰</span> Main menu</button>
        <button class="${buttons[this.uiStyle]}" id="igraj-opet"><span class="icon">↻</span> Play again</button>
      </div>
    `
  }

  renderStartScreen() {
    modalElement.innerHTML = this.startScreen()
    if (this.reportText)
      this.report = new Report({ text: this.reportText, containerId: 'start-screen' })
  }

  get modal() {
    if (this.outro) return this.endScreen()
    if (this.scene.gameLoop.isPaused) return this.escModal()
    if (this.intro) return this.startScreen()
    return ''
  }

  renderModal() {
    if (this.cachedModal === this.modal) return

    modalElement.innerHTML = this.modal
    this.cachedModal = this.modal
  }

  /* OUTRO */

  defeat(text) {
    let html = '<h3 class="red"><span class="icon">☠️</span> Game over</h3>'
    if (text) html += `<p>${text}</p>`
    this.outro = html
  }

  victory(text, title = 'Pobeda!') {
    let html = `<h3 class="olive"><span class="icon">🎖️</span> ${title}</h3>`
    if (text) html += `<p>${text}</p>`
    this.outro = html
  }

  /* SCENE UI */

  scoreUI(text = 'Score', points = 0, subtext, subpoints, smallClass = '') {
    return /* html */`
      <div class="top-left ${scores[this.uiStyle]}">
        <div>
          ${text}: ${points}
          ${subtext ? `<br><small class="${smallClass}">${subtext}: ${subpoints}</small>` : ''}
        </div>
      </div>
    `
  }

  renderSceneUI(t) {
    if (this.cachedSceneUI === this.scene.sceneUI(t)) return

    elementUI.innerHTML = this.scene.sceneUI(t)
    this.cachedSceneUI = this.scene.sceneUI(t)
  }

  /* MESSAGE */

  showMessage(txt) {
    modalElement.innerHTML = /* html */`
      <div class="central-screen">
        <h3>${txt}</h3>
      </div>
    `
    setTimeout(() => {
      if (this.modal) return
      modalElement.innerHTML = ''
    }, 3000)
  }

  end() {
    this.clear()
    if (this.controlsUI) this.controlsUI.end()
  }

  /* LOOP */

  render(t) {
    this.renderModal()
    this.renderSceneUI(t)
  }
}