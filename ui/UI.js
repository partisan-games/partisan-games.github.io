import { isTouchScreen } from '/config.js'
import Controls from '../ui/Controls.js'
import Report from './Report.js'
import { currentStyleClasses } from './styles.js'
import '/core/io/ScreenToggle.js'

const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')

export default class UI {
  constructor(scene, {
    intro = '',
    showControls = !isTouchScreen,
    startButtonText = 'Start mission',
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
    this.cachedSceneUI = this.outro = ''
    this.screen = null // 'start', 'pause', 'end' or null
    this.messageElement = document.createElement('div')
    this.messageElement.className = 'message'
    modalElement.after(this.messageElement)

    if (showControls)
      this.controlsUI = new Controls({ controlKeys })

    if (showFullScreen && document.fullscreenEnabled)
      this.fullScreenButton = document.body.appendChild(document.createElement('full-screen-btn'))
  }

  clear() {
    elementUI.innerHTML = ''
    this.hideScreen()
  }

  reset() {
    this.outro = this.cachedSceneUI = ''
    this.clear()
  }

  clearIntro() {
    this.intro = ''
    this.hideScreen()
    if (this.report) this.report.stop()
  }

  /* CENTRAL SCREEN */

  showScreen(name, html) {
    this.screen = name
    modalElement.innerHTML = html
    this.messageElement.hidden = true
  }

  hideScreen() {
    this.screen = null
    modalElement.innerHTML = ''
    this.messageElement.hidden = false
  }

  startScreen() {
    const classes = currentStyleClasses()
    if (this.customStartScreen) return this.customStartScreen(classes)

    const { container, button } = classes
    return /* html */`
      <div class="central-screen flex-column ${container}" id="start-screen">
        <p>${this.intro}</p>
        <button class="${button}" id="start"><span class="icon">🔥</span> ${this.startButtonText}</button>
      </div>
    `
  }

  escModal() {
    const { container, button } = currentStyleClasses()
    return /* html */`
      <div class="central-screen flex-column ${container}">
        <h3 class="olive">Game paused</h3>
        <button class="${button}" id="continue"><span class="icon">🔥</span> Continue</button>
        <button class="${button}" id="menu"><span class="icon">☰</span> Main menu</button>
        <button class="${button}" id="igraj-opet"><span class="icon">↻</span> Play again</button>
      </div>
    `
  }

  endScreen() {
    const { container, button } = currentStyleClasses()
    return /* html */`
      <div class="central-screen flex-column ${container}">
        ${this.outro}
        <button class="${button}" id="menu"><span class="icon">☰</span> Main menu</button>
        <button class="${button}" id="igraj-opet"><span class="icon">↻</span> Play again</button>
      </div>
    `
  }

  renderStartScreen() {
    this.showScreen('start', this.startScreen())
    if (this.reportText)
      this.report = new Report({ text: this.reportText, containerId: 'start-screen' })
  }

  showPauseScreen() {
    this.showScreen('pause', this.escModal())
  }

  /* OUTRO */

  showDefeatScreen(text) {
    let html = '<h3 class="red"><span class="icon">☠️</span> Game over</h3>'
    if (text) html += `<p>${text}</p>`
    this.outro = html
    this.showScreen('end', this.endScreen())
  }

  showVictoryScreen(text, title = 'Pobeda!') {
    let html = `<h3 class="olive"><span class="icon">🎖️</span> ${title}</h3>`
    if (text) html += `<p>${text}</p>`
    this.outro = html
    this.showScreen('end', this.endScreen())
  }

  /* SCENE UI */

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

  /* MESSAGE */

  showMessage(txt) {
    if (this.ended || this.screen) return // a message would cover the start, pause or end screen

    this.message = txt
    this.messageElement.innerHTML = /* html */`
      <div class="central-screen">
        <h3>${txt}</h3>
      </div>
    `
    setTimeout(() => {
      if (this.message !== txt) return // a newer message keeps its own time
      this.message = ''
      this.messageElement.innerHTML = ''
    }, 3000)
  }

  end() {
    this.ended = true
    this.clear()
    this.messageElement.remove()
    this.report?.stop()
    this.controlsUI?.end()
    this.fullScreenButton?.remove()
  }

  /* LOOP */

  render(t) {
    const html = this.scene.sceneUI(t)
    if (this.cachedSceneUI === html) return

    elementUI.innerHTML = this.cachedSceneUI = html
  }
}