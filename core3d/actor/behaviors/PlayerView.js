import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import { currentStyleClasses } from '/ui/styles.js'

/** The player's HUD and camera read gameplay state; they do not drive movement or own health. */
export default class PlayerView {
  constructor({ mesh, height, health, camera, showCameraButton, showHealthBar }) {
    this.health = health
    if (camera) {
      this.alignCamera = true
      this.chaseCamera = new ChaseCamera({ camera, mesh, height, showCameraButton })
    }
    if (showHealthBar) {
      this.healthBar = document.createElement('progress')
      this.healthBar.max = health.maximum
      this.healthBar.className = `progress top-right ${currentStyleClasses().healthBar}`
      this.updateHealthBar()
      document.body.appendChild(this.healthBar)
    }
  }

  updateHealthBar() {
    if (this.healthBar) this.healthBar.value = this.health.current
  }

  update(dt, state) {
    if (this.alignCamera) {
      this.chaseCamera.alignCamera()
      this.alignCamera = false
    }
    this.chaseCamera?.update(dt, state)
    this.updateHealthBar()
  }

  end() {
    this.healthBar?.remove()
    this.chaseCamera?.end()
  }
}
