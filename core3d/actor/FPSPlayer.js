import Player from '/core3d/actor/Player.js'
import FPSRenderer from '/core3d/actor/FPSRenderer.js'
import { getCameraIntersects } from '/core3d/helpers.js'
import { attackStyles, jumpStyles } from '/core3d/constants.js'
import { createPlayerBox } from '/core3d/geometry/index.js'

export default class FPSPlayer extends Player {
  constructor({
    camera,
    attackDistance = 100,
    mouseSensitivity = .002,
    attackKey = 'pointer',
    attackSound = 'rifle.mp3',
    ...rest
  } = {}) {
    super({
      mesh: createPlayerBox({ visible: false }),
      attackStyle: attackStyles.ONCE,
      jumpStyle: jumpStyles.FLY_JUMP,
      useRicochet: true,
      useJoystick: false,
      useKeyboard: true,
      attackDistance,
      attackSound,
      attackKey,
      ...rest,
    })
    this.mouseSensitivity = mouseSensitivity
    this.time = 0
    this.energy = 100
    this.hurting = false
    this.fpsRenderer = new FPSRenderer()

    this.camera = camera
    const cameraX = this.mixer ? -.05 : 0
    const cameraZ = this.mixer ? -.25 : this.height / 4
    camera.position.set(cameraX, this.cameraHeight, cameraZ)
    camera.rotation.set(0, 0, 0)
    this.mesh.add(camera)
    this.moveCursor = this.moveCursor.bind(this)

    document.addEventListener('pointermove', this.moveCursor)
  }

  /* GETTERS */

  get cameraHeight() {
    return this.height * .82
  }

  get cameraTarget() {
    const pos = this.mesh.position.clone()
    pos.y += this.cameraHeight
    return pos
  }

  /* UTILS */

  moveCursor(e) {
    if (this.hurting || this.dead || !document.pointerLockElement) return

    this.mesh.rotateY(-e.movementX * this.mouseSensitivity)
    this.camera.rotateX(-e.movementY * this.mouseSensitivity)
    const lowerRotation = -Math.PI / 10
    const upperRotation = Math.PI / 8
    this.camera.rotation.x = Math.max(lowerRotation, Math.min(upperRotation, this.camera.rotation.x))
  }

  /* COMBAT */

  // parent method overriding
  intersect() {
    return getCameraIntersects(this.camera, this.solids)
  }

  enterAttack() {
    super.enterAttack()
    this.time += 5 // recoil
  }

  painEffect() {
    this.hurting = true
    setTimeout(() => {
      this.hurting = this.dead // red screen if dead
    }, 300)
  }

  checkHit() {
    if (this.damageAmount) this.painEffect()
    super.checkHit()
  }

  /* UPDATES */

  update(delta) {
    super.update(delta)

    if (!this.dead) {
      this.time += (this.input.run ? delta * this.runCoefficient : delta)
      if (this.mixer)
        this.fpsRenderer.renderTarget(this.time)
      else
        this.fpsRenderer.render(this.time)
    }

    if (this.dead)
      this.fpsRenderer.clear()

    if (this.hurting) this.fpsRenderer.drawPain()
  }

  end() {
    super.end()
    this.fpsRenderer.remove()
    document.removeEventListener('pointermove', this.moveCursor)
  }
}
