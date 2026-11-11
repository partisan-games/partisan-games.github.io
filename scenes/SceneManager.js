const validPath = /^[\w-]+$/

const imageLoaded = img => img.complete
  ? Promise.resolve()
  : new Promise(resolve => {
    img.addEventListener('load', resolve, { once: true })
    img.addEventListener('error', resolve, { once: true })
  })

class SceneManager {
  static instance = null

  constructor() {
    if (SceneManager.instance)
      return SceneManager.instance

    this.scene = null
    this.startId = 0
    SceneManager.instance = this
  }

  handleIntro() {
    if (this.scene.hasStartScreen) {
      this.scene.clear()
      this.scene.slikeUcitane().then(() => this.scene.render())
      this.scene.ui.renderStartScreen()
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

      const SceneClass = (await import(`/scenes/${path}/Main.js`)).default
      if (!isCurrent()) return

      this.scene = new SceneClass(this)
      await this.scene.init()
      if (!isCurrent()) return

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
