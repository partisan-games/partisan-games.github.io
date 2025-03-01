import { Spinner } from '/core3d/loaders.js'
import { scenes } from './scenes.js'

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
      this.scene.render()
      this.scene.ui.renderStartScreen()
    } else this.scene.start()
  }

  async start(name, firstTime = true) {
    this.spinner.show()
    if (this.scene)
      this.scene.end()

    const SceneClass = firstTime
      ? (await import(scenes[name].path)).default
      : this.scene.constructor
    this.scene = new SceneClass(this)
    this.scene.init()
    this.spinner.hide()

    if (firstTime)
      if (this.scene.pozadina) this.scene.pozadina.onload = () => this.handleIntro()
      else this.handleIntro()
  }

  async restart(name) {
    await this.start(name, false)
    this.scene.start()
  }
}

export default SceneManager