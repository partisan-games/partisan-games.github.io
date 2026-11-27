const validPath = /^[\w-]+$/

class SceneManager {
  static instance = null

  constructor(importScene = path => import(`/scenes/${path}/Main.js`)) {
    if (SceneManager.instance)
      return SceneManager.instance

    this.importScene = importScene
    this.scene = null
    this.startId = 0
    SceneManager.instance = this
  }

  /** Shows the start screen, or starts a game that has none. */
  async handleIntro() {
    const { scene } = this
    if (!scene.hasStartScreen) return scene.start()
    // the next mission of a paid game goes on without the start screen
    if (scene.prepaid) {
      await scene.play()
      if (scene.session.state !== 'ready' || this.scene !== scene) return
    }
    scene.clear()
    scene.render()
    scene.ui.renderStartScreen()
  }

  async initSpinner() {
    if (!this.spinner) {
      const module = await import('/core3d/loaders.js')
      this.spinner = new module.Spinner()
    }
  }

  endScene() {
    this.scene?.end()
    this.scene = null
  }

  /** Ends the game and abandons one still loading, as on the way back to the menu. */
  leave() {
    this.startId++
    this.spinner?.hide()
    this.endScene()
  }

  /**
   * Only the latest call wins; older pending starts are abandoned. `prepaid` starts a scene that continues a game already paid
   * for, such as its next mission.
   */
  async start(path, showSpinner = true, { prepaid = false } = {}) {
    const startId = ++this.startId
    const isCurrent = () => startId === this.startId

    try {
      if (showSpinner) {
        await this.initSpinner()
        this.spinner.show()
      }
      this.endScene()

      if (!validPath.test(path)) throw new Error(`Invalid scene name: ${path}`)

      const SceneClass = (await this.importScene(path)).default
      if (!isCurrent()) return

      const scene = this.scene = new SceneClass(this)
      scene.prepaid = prepaid
      await scene.init()
      // a newer start ended this scene while init was still running; end what init set up after that
      if (!isCurrent()) return scene.end()
      await scene.imagesLoaded()
      if (!isCurrent() || this.scene !== scene) return
      scene.session.ready()
      scene.syncSounds?.()

      await this.handleIntro()
    } catch (error) {
      if (!isCurrent()) return
      this.endScene()
      throw error
    } finally {
      if (isCurrent()) this.spinner?.hide()
    }
  }
}

export default SceneManager
