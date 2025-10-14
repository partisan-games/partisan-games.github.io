import { keyboard } from './io/Keyboard.js'
import { platno } from './io/platno.js'
import GameLoop from './GameLoop.js'
import UI from '../ui/UI.js'
import Controls from '../ui/Controls.js'

export default class Scena {
  constructor(manager, {
    usePointerLock, controlKeys, intro, controlsWindowClass, reportText, showControls = true
  } = {}) {
    this.manager = manager
    this.usePointerLock = usePointerLock
    this.gameLoop = new GameLoop(this.loop)
    this.ui = new UI(this, { reportText, intro })
    this.predmeti = []
    if (showControls)
      this.controlsUI = new Controls({ controlKeys, containerClass: controlsWindowClass })

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

  /* VELIČINA */

  get sirina() {
    return platno.width
  }

  get visina() {
    return platno.height
  }

  /* EVENTS */

  handleClick(e) {
    const target = e.target.closest('button')

    if (target?.id == 'start')
      this.start()

    if (target?.id == 'igraj-opet')
      this.manager.restart(this.constructor.name)

    if (target?.id == 'menu')
      this.manager.start('MainMenu')

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
    const obecanja = this.predmeti.map(({ slika }) => new Promise(resolve => {
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
    this.ui.clear()
    if (this.controlsUI) this.controlsUI.end()
    if (this.controls2UI) this.controls2UI.end()
    if (this.player) this.player.end()

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
      if (predmet.update) predmet.update(dt, t)
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

  victory(text) {
    this.ui.victory(text)
    this.finish()
  }

  sceneUI() {
    return ''
  }
}
