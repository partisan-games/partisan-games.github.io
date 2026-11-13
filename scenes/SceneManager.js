const validPath = /^[\w-]+$/

const imageLoaded = img => img.complete
  ? Promise.resolve()
  : new Promise(resolve => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  })

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

  handleIntro() {
    const scene = this.scene
    if (scene.hasStartScreen) {
      scene.clear()
      scene.slikeUcitane().then(() => {
        if (this.scene === scene) scene.render()
      })
      scene.ui.renderStartScreen()
    } else
      this.scene.start()
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

  /** Only the latest call wins; older pending starts are abandoned. */
  async start(path, showSpinner = true) {
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
      await scene.init()
      // a newer start ended this scene while init was still running; end what init set up after that
      if (!isCurrent()) return scene.end()
      scene.session.ready()

      if (this.scene.pozadina) await imageLoaded(this.scene.pozadina.slika)
      if (!isCurrent()) return

      this.handleIntro()
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
