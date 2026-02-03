class SceneManager {
  static instance = null

  constructor() {
    if (SceneManager.instance)
      return SceneManager.instance

    this.scene = null
    SceneManager.instance = this
  }

  handleIntro() {
    if (this.scene.ui.intro) {
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

  async start(path) {
    await this.initSpinner()
    this.spinner.show()
    if (this.scene)
      this.scene.end()

    const SceneClass = (await import(`/scenes/${path}/Main.js`)).default
    this.scene = new SceneClass(this)
    this.scene.init()
    this.spinner.hide()

    if (this.scene.pozadina)
      this.scene.pozadina.onload = () => this.handleIntro()
    else this.handleIntro()
  }

  restart() {
    this.scene.end()
    this.scene = new this.scene.constructor(this)
    this.scene.restart()
  }
}

export default SceneManager