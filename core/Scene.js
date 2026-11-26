import { keyboard } from './io/Keyboard.js'
import { keys } from './io/keys.js'
import imageReady from './io/imageReady.js'
import { wreckFor } from './actor/wreckView.js'
import GameLoop from './GameLoop.js'
import UI from '../ui/UI.js'
import GameSession from './runtime/GameSession.js'
import FixedStep from './runtime/FixedStep.js'
import PausePolicy from './PausePolicy.js'
import World from './World.js'
import SceneAudio from './io/audio/SceneAudio.js'
import { admission } from './io/admission.js'
import runCleanups from './runtime/runCleanups.js'
import { gameplayInputAllowed } from './io/inputContext.js'

// the scene that last showed each shared canvas; a scene ended late must not hide or wipe the next scene's drawing
const canvasOwners = new WeakMap()

export default class Scene {
  constructor({
    usePointerLock, controlKeys, intro, reportText, customStartScreen, startButtonText, showControls, uiStyle, canvas, disableEvents = false,
    fixedStep = false,
  } = {}) {
    this.usePointerLock = usePointerLock
    this.disableEvents = disableEvents
    this.session = new GameSession()
    // a scene that opts in updates its world in equal steps instead of once per drawn frame
    if (fixedStep) this.stepper = new FixedStep()
    this.gameLoop = new GameLoop(this.loop)
    this.ui = new UI(this, {
      reportText, intro, customStartScreen, startButtonText, showControls, controlKeys, uiStyle,
      ...disableEvents ? {} : { onStart: () => this.play(), onContinue: () => this.unpause() },
    })
    this.world = new World()
    this.sceneAudio = new SceneAudio()
    this.audioChildren = []

    this.canvas = canvas
    this.canvas.style.display = 'block'
    canvasOwners.set(canvas, this)

    if (disableEvents) return

    this.handleClick = this.handleClick.bind(this)
    this.unlockAudio = event => {
      if (event.isTrusted && !event.repeat) this.sceneAudio.unlock().catch(() => {})
    }
    document.addEventListener('click', this.unlockAudio, true)
    document.addEventListener('keydown', this.unlockAudio, true)
    document.addEventListener('click', this.handleClick)
    document.addEventListener('pointerdown', this.notePointer, true)
    this.pausePolicy = new PausePolicy({ usePointerLock, pause: () => this.pause() })
  }

  init() {}

  add(...objects) {
    this.world.add(...objects)
    this.syncSounds()
  }

  /** Adds 2D objects drawn behind the others. */
  addBehind(...objects) {
    this.world.addBehind(...objects)
    this.syncSounds()
  }

  remove(...objects) {
    this.world.remove(...objects)
    this.syncSounds()
  }

  syncSounds() {
    this.sceneAudio.sync([this.children, this.player, this.background, this.ui, this.audioChildren], this.session.state)
  }

  /** What drives the bodies, keys or AI; the scene assigns them and swaps them when its rules change control. */
  get controllers() {
    return this.world.controllers
  }

  get children() {
    return this.world.objects
  }

  get width() {
    return this.canvas.width
  }

  get height() {
    return this.canvas.height
  }

  get hasStartScreen() {
    return Boolean(this.ui.intro || this.ui.customStartScreen)
  }

  get free() {
    return false
  }

  /** A click anywhere on the page, for games that react to it; the start and pause screens handle their own buttons. */
  handleClick() {}

  imagesLoaded() {
    const withDescendants = children => children.flatMap(object =>
      [object, ...withDescendants(object.children || [])]
    )
    const roots = [...new Set([...this.children, this.player, this.background].filter(Boolean))]
    const images = withDescendants(roots).filter(({ image }) => image).flatMap(object => {
      // an object destroyed from the start, such as a ruin in the scenery, is drawn as its wreck at once
      const wreck = object.dead && wreckFor(object.image.src)
      return [imageReady(object.image, object.imageLoaded), ...wreck ? [imageReady(wreck)] : []]
    })
    return Promise.all(images)
  }

  /** Gets ready what the player chose on the start screen, such as a plane to load; a game with choices overrides it. */
  async prepare() {}

  /**
   * Starts what the player chose: a paid game with a start screen costs one token after its choice is ready, so a
   * failed load costs nothing; a scene `prepaid` by the game it continues costs none. A second click while starting
   * does nothing; a scene ended meanwhile gives the token back.
   */
  async play(choice = null) {
    // a game that has begun, or is beginning, is not started again
    if (this.starting || !['loading', 'ready'].includes(this.session.state) || this.ui.ended) return
    this.starting = true
    // the next mission of a game already paid for starts without a token
    const paid = this.hasStartScreen && !this.free && !this.prepaid
    try {
      await this.prepare(choice)
      if (this.ui.ended) return
      let receipt = null
      if (paid) {
        try {
          receipt = await admission.charge()
        } catch {
          return this.ui.showStartNotice('Allow this site to save data to use arcade tokens.')
        }
        if (!receipt) return
        if (this.ui.ended) return await this.giveBack(receipt)
      }
      // Replay retains the price even after start() clears the intro.
      this.costsToken = this.hasStartScreen && !this.free
      this.start()
    } finally {
      this.starting = false
    }
  }

  async giveBack(receipt) {
    try {
      await admission.refund(receipt)
    } catch {
      this.ui.showStartNotice('The machine swallowed your token. Try giving it a kick.')
    }
  }

  /** A game played by touch does not lock the pointer; a mouse click in it, once it runs, locks it again. */
  notePointer = event => {
    this.pointerType = event.pointerType
    if (this.usePointerLock && event.pointerType === 'mouse' && !document.pointerLockElement
      && this.session.state === 'running' && !this.ui.screen && gameplayInputAllowed(event.target)) this.lockPointer()
  }

  lockPointer() {
    if (this.usePointerLock && this.pointerType !== 'touch') document.body.requestPointerLock()
  }

  start() {
    this.gameLoop.start()
    this.session.start()
    this.syncSounds()
    this.ui.clearIntro()
    this.focusCanvas()
    this.lockPointer()
  }

  focusCanvas() {
    if (this.disableEvents) return
    this.canvas.tabIndex = -1
    this.canvas.focus({ preventScroll: true })
  }

  end() {
    runCleanups([
      () => this.gameLoop.stop(),
      () => this.syncSounds(),
      () => this.sceneAudio.end(),
      () => this.world.end(this.player),
      () => this.session.dispose(),
      () => this.ui.end(),
      () => {
        if (canvasOwners.get(this.canvas) === this) this.clear()
      },
      () => {
        if (canvasOwners.get(this.canvas) !== this) return
        this.canvas.style.display = 'none'
        canvasOwners.delete(this.canvas)
      },
      () => document.removeEventListener('click', this.handleClick),
      () => document.removeEventListener('pointerdown', this.notePointer, true),
      () => document.removeEventListener('click', this.unlockAudio, true),
      () => document.removeEventListener('keydown', this.unlockAudio, true),
      () => this.pausePolicy?.end(),
    ])
  }

  pause() {
    if (this.ui.outro || !this.gameLoop.isRunning) return

    this.gameLoop.pause()
    this.session.pause()
    this.syncSounds()
    this.ui.showPauseScreen()
  }

  unpause() {
    this.gameLoop.unpause()
    this.stepper?.reset()
    this.session.resume()
    this.syncSounds()
    this.ui.hideScreen()
    this.focusCanvas()
    this.lockPointer()
  }

  handleInput(dt) {
    if (this.ui.outro) return

    // A decorative scene has no pause screen the player could leave with Continue.
    if (!this.disableEvents && keyboard.isDown(keys.pause)) this.pause()

    if (this.session.state !== 'running' || this.ui.screen) return
    this.world.handleInput(dt)
  }

  update(dt, t) {
    this.world.update(dt, t)
  }

  clear() {}

  render() {}

  /** Game rules for one simulation step, in a scene with `fixedStep`. */
  fixedUpdate() {}

  /** Camera, animations and anything else seen, once per drawn frame, in a scene with `fixedStep`. */
  present() {}

  loop = (dt, t) => {
    const audioTime = this.session.presentationClock.now
    this.syncSounds()
    if (this.stepper) this.simulate(dt, t)
    else {
      this.session.update(dt)
      this.handleInput(dt)
      this.update(dt, t)
    }
    this.syncSounds()
    this.sceneAudio.update(this.session.presentationClock.now - audioTime)
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
      this.update(step, t)
      this.fixedUpdate(step)
    }
    this.present(dt, t)
  }

  finish() {
    this.gameLoop.stopTime()
    this.session.finish()
    this.syncSounds()
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
