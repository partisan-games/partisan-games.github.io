import Report from './Report.js'

const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')

const uiStyles = {
  simple: 'simple',
  rpg: 'rpg',
  white: 'white',
}

const containers = {
  simple: 'simple-container',
  rpg: 'rpgui-container framed',
  white: 'white-container',
}

export default class UI {
  constructor(scene, { intro = '', reportText, customStartScreen, startButtonText = 'To battle', uiStyle = uiStyles.simple } = {}) {
    this.scene = scene
    this.intro = intro
    this.startButtonText = startButtonText
    this.reportText = reportText
    this.customStartScreen = customStartScreen
    this.cachedSceneUI = this.cachedModal = this.outro = ''
    this.uiStyle = uiStyle
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
      <div class="central-screen ${containers[this.uiStyle]}" id="start-screen">
        <p>${this.intro}</p>
        <button id="start"><span>🔥</span> ${this.startButtonText}</button>
      </div>
    `
  }

  escModal() {
    return /* html */`
      <div class="central-screen ${containers[this.uiStyle]} game-paused">
        <h3 class="olive">Game paused</h3>
        <button id="continue"><span>🔥</span> Continue</button>
        <button id="menu"><span>☰</span> Main menu</button>
        <button id="igraj-opet"><span>↻</span> Play again</button>
      </div>
    `
  }

  endScreen() {
    return /* html */`
      <div class="central-screen ${containers[this.uiStyle]}">
        ${this.outro}
        <button id="menu"><span>☰</span> Main menu</button>
        <button id="igraj-opet"><span>↻</span> Play again</button>
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
    let html = '<h3 class="red">☠️ Game over</h3>'
    if (text) html += `<p>${text}</p>`
    this.outro = html
  }

  victory(text) {
    let html = '<h3 class="olive"><span class="medal">🎖️</span> Pobeda!</h3>'
    if (text) html += `<p>${text}</p>`
    this.outro = html
  }

  /* SCENE UI */

  renderSceneUI(t) {
    if (this.cachedSceneUI === this.scene.sceneUI(t)) return

    elementUI.innerHTML = this.scene.sceneUI(t)
    this.cachedSceneUI = this.scene.sceneUI(t)
  }

  /* MESSAGE */

  showMessage(txt) {
    modalElement.innerHTML = /* html */`
      <div class="central-screen ${containers[this.uiStyle]}">
        <h3>${txt}</h3>
      </div>
    `
    setTimeout(() => {
      if (this.modal) return
      modalElement.innerHTML = ''
    }, 3000)
  }

  /* LOOP */

  render(t) {
    this.renderModal()
    this.renderSceneUI(t)
  }
}