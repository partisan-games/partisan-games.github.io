import { keyboard } from './io/Keyboard.js'
import GameLoop from './GameLoop.js'
import UI from '../ui/UI.js'

export default class Scena {
  constructor({
    usePointerLock, controlKeys, intro, reportText, customStartScreen, startButtonText, showControls, uiStyle, canvas, disableEvents = false, showFullScreen
  } = {}) {
    this.usePointerLock = usePointerLock
    this.uiStyle = uiStyle
    this.gameLoop = new GameLoop(this.loop)
    this.ui = new UI(this, { reportText, intro, customStartScreen, startButtonText, uiStyle, showControls, controlKeys, showFullScreen })
    this.predmeti = []

    this.canvas = canvas
    this.canvas.style.display = 'block'

    if (disableEvents) return

    this.handleClick = this.handleClick.bind(this)
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)

    document.addEventListener('click', this.handleClick)
    if (usePointerLock)
      document.addEventListener('pointerlockchange', this.handlePointerLockChange)
    else
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
  }

  init() {}

  add(...predmeti) {
    this.predmeti.push(...predmeti)
  }

  remove(...predmeti) {
    this.predmeti = this.predmeti.filter(p => !predmeti.includes(p))
  }

  /* GETTERS */

  get sirina() {
    return this.canvas.width
  }

  get visina() {
    return this.canvas.height
  }

  get hasStartScreen() {
    return Boolean(this.ui.intro || this.ui.customStartScreen)
  }

  /* EVENTS */

  handleClick(e) {
    const target = e.target.closest('button')

    if (target?.id == 'start')
      this.start()

    if (target?.id == 'igraj-opet')
      this.reset ? this.reset() : location.reload()

    if (target?.id == 'continue')
      this.unpause()
  }

  handlePointerLockChange() {
    if (!document.pointerLockElement)
      this.pause()
  }

  handleVisibilityChange() {
    if (document.visibilityState === 'hidden')
      this.pause()
  }

  slikeUcitane() {
    const obecanja = this.predmeti
      .filter(({ slika }) => slika)
      .map(({ slika }) => new Promise(resolve => {
        if (slika.complete) resolve(slika)
        else slika.addEventListener('load', () => resolve(slika))
      }))
    return Promise.all(obecanja)
  }

  /* LOOP */

  start() {
    this.gameLoop.start()
    this.ui.clearIntro()
    if (this.usePointerLock) document.body.requestPointerLock()
  }

  end() {
    this.gameLoop.stop()
    this.predmeti = []
    this.clear()
    this.ui.end()
    if (this.player) this.player.end()

    this.canvas.style.display = 'none'

    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
  }

  pause() {
    if (this.ui.outro) return

    this.gameLoop.pause()
    this.ui.renderModal()
  }

  unpause() {
    this.gameLoop.unpause()
    if (this.usePointerLock) document.body.requestPointerLock()
  }

  handleInput(dt) {
    if (this.ui.outro) return

    if (keyboard.pressed.Escape) this.gameLoop.pause()

    this.predmeti.forEach(predmet => {
      if (predmet.ziv && predmet.handleInput) predmet.handleInput(dt)
    })
  }

  update(dt, t) {
    const rekurzivnoAzuriraj = predmet => {
      if (predmet.update) predmet.isParticles ? predmet.update({ delta: dt }) : predmet.update(dt, t)
      if (predmet?.predmeti?.length) predmet.predmeti.forEach(rekurzivnoAzuriraj)
    }
    this.predmeti.forEach(rekurzivnoAzuriraj)
  }

  clear() {}

  render() {}

  loop = (dt, t) => {
    this.handleInput(dt)
    this.update(dt, t)
    this.clear()
    this.render()
    this.ui.render(t)
  }

  finish() {
    this.gameLoop.stopTime()
    if (this.usePointerLock) document.exitPointerLock()
  }

  defeat(text) {
    this.ui.defeat(text)
    this.finish()
  }

  victory(text, title) {
    this.ui.victory(text, title)
    this.finish()
  }

  sceneUI(t) {
    return ''
  }
}
