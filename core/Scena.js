import { keyboard } from './io/Keyboard.js'
import { keys } from './io/keys.js'
import GameLoop from './GameLoop.js'
import UI from '../ui/UI.js'
import { setUiStyle } from '../ui/styles.js'
import GameSession from './runtime/GameSession.js'
import FixedStep from './runtime/FixedStep.js'
import UpdateRegistry from './runtime/UpdateRegistry.js'

// the scene that last showed each shared canvas; a scene ended late must not hide or wipe the next scene's drawing
const canvasOwners = new WeakMap()

export default class Scena {
  constructor({
    usePointerLock, controlKeys, intro, reportText, customStartScreen, startButtonText, showControls, uiStyle, canvas, disableEvents = false,
    fixedStep = false,
  } = {}) {
    this.usePointerLock = usePointerLock
    setUiStyle(uiStyle)
    this.session = new GameSession()
    if (fixedStep) {
      // a scene that opts in simulates in equal steps; its objects are updated by the registry, not the tree
      this.stepper = new FixedStep()
      this.simulation = new UpdateRegistry()
    }
    this.gameLoop = new GameLoop(this.loop)
    this.ui = new UI(this, { reportText, intro, customStartScreen, startButtonText, showControls, controlKeys })
    this.predmeti = []

    this.canvas = canvas
    this.canvas.style.display = 'block'
    canvasOwners.set(canvas, this)

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
    this.simulation?.add(...predmeti)
  }

  remove(...predmeti) {
    this.simulation?.remove(...predmeti)
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
    const saDelovima = predmeti => predmeti.flatMap(predmet =>
      [predmet, ...saDelovima(predmet.predmeti || [])]
    )
    const obecanja = saDelovima(this.predmeti)
      .filter(({ slika }) => slika)
      .map(({ slika, slikaUcitana }) => slikaUcitana || new Promise(resolve => {
        if (slika.complete) resolve(slika)
        else slika.addEventListener('load', () => resolve(slika))
      }))
    return Promise.all(obecanja)
  }

  /* LOOP */

  start() {
    this.gameLoop.start()
    this.session.start()
    this.ui.clearIntro()
    if (this.usePointerLock) document.body.requestPointerLock()
  }

  end() {
    this.gameLoop.stop()
    new Set([...this.predmeti, this.player]).forEach(predmet => predmet?.end?.())
    this.predmeti = []
    this.session.dispose()
    this.ui.end()
    if (canvasOwners.get(this.canvas) === this) {
      this.clear()
      this.canvas.style.display = 'none'
      canvasOwners.delete(this.canvas)
    }

    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
  }

  pause() {
    if (this.ui.outro || !this.gameLoop.isRunning) return

    this.gameLoop.pause()
    this.session.pause()
    this.ui.showPauseScreen()
  }

  unpause() {
    this.gameLoop.unpause()
    this.stepper?.reset()
    this.session.resume()
    this.ui.hideScreen()
    if (this.usePointerLock) document.body.requestPointerLock()
  }

  handleInput(dt) {
    if (this.ui.outro) return

    if (keyboard.isDown(keys.pause)) this.pause()

    this.predmeti.forEach(predmet => {
      if (predmet.alive && predmet.handleInput) predmet.handleInput(dt)
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

  /** Game rules for one simulation step, in a scene with `fixedStep`. */
  fixedUpdate() {}

  /** Camera, animations and anything else seen, once per drawn frame, in a scene with `fixedStep`. */
  present() {}

  loop = (dt, t) => {
    if (this.stepper) this.simulate(dt, t)
    else {
      this.session.update(dt)
      this.handleInput(dt)
      this.update(dt, t)
    }
    this.clear()
    this.render()
    this.ui.render(t)
  }

  /** Input once per drawn frame, so a press acts once however many steps follow; then the steps; then what is seen. */
  simulate(dt, t) {
    this.handleInput(dt)
    const { step } = this.stepper
    for (let i = this.stepper.advance(dt); i > 0; i--) {
      this.session.update(step)
      this.simulation.step(step, t)
      this.fixedUpdate(step)
    }
    this.present(dt, t)
  }

  finish() {
    this.gameLoop.stopTime()
    this.session.finish()
    if (this.usePointerLock) document.exitPointerLock()
  }

  // scenes keep checking their end conditions every frame; the first result stands
  defeat(text) {
    if (this.ui.outro) return
    this.ui.showDefeatScreen(text)
    this.finish()
  }

  victory(text, title) {
    if (this.ui.outro) return
    this.ui.showVictoryScreen(text, title)
    this.finish()
  }

  sceneUI() {
    return ''
  }
}
