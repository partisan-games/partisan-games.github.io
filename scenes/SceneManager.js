import { Spinner } from '/core3d/loaders.js'

class SceneManager {
  static instance = null

  constructor() {
    if (SceneManager.instance)
      return SceneManager.instance

    this.scene = null
    SceneManager.instance = this
    this.spinner = new Spinner()
  }

  handleIntro() {
    if (this.scene.ui.intro) {
      this.scene.clear()
      this.scene.slikeUcitane().then(() => {
        this.scene.render()
      })
      this.scene.ui.renderStartScreen()
    } else this.scene.start()
  }

  async start(path) {
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
    this.scene.init()
    this.scene.start()
  }
}

export default SceneManager