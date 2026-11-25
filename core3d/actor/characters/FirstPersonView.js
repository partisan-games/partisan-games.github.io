import FPSRenderer from '/core3d/actor/FPSRenderer.js'

/** Seconds the screen stays red after a hit. */
const painTime = .3
/** How far the weapon's sway jumps at a shot, in its seconds. */
const recoil = 5

/**
 * What a first-person player sees through the character's eyes: the camera at its eye height, a little behind its
 * middle, turned the way it looks; its weapon swaying as it walks and kicking at each shot, the screen red for a
 * moment after a hit and for good once it is dead.
 */
export default class FirstPersonView {
  constructor(body, { camera, weaponSrc, behind = body.size.height / 4, showTarget = () => true }) {
    this.body = body
    this.camera = camera
    this.behind = behind
    this.showTarget = showTarget
    this.weaponSource = typeof weaponSrc === 'function' ? weaponSrc : null
    camera.rotation.order = 'YXZ'
    this.renderer = new FPSRenderer({ weaponSrc: this.weaponSource ? this.weaponSource() : weaponSrc })
    this.sway = 0
    this.pain = 0
    this.seen = { shots: body.shotsFired, hits: body.hitsTaken }
    this.place()
  }

  place() {
    const { body, camera } = this
    const { behind } = this
    camera.position.set(body.x - Math.cos(body.yaw) * behind, body.feet + body.size.height * body.strikeHeight,
      body.z + Math.sin(body.yaw) * behind)
    camera.rotation.set(body.pitch, body.yaw - Math.PI / 2, 0)
  }

  update(dt) {
    const { body, seen, renderer } = this
    renderer.showTarget = this.showTarget()
    if (this.weaponSource) renderer.weaponSrc = this.weaponSource()
    this.place()
    if (this.renderer.weaponSrc && body.shotsFired > seen.shots) this.sway += recoil
    if (body.hitsTaken > seen.hits) this.pain = painTime
    Object.assign(seen, { shots: body.shotsFired, hits: body.hitsTaken })
    this.pain = Math.max(0, this.pain - dt)
    if (body.dead) renderer.clear()
    else {
      this.sway += body.running ? dt * body.run : dt
      renderer.render(this.sway)
    }
    if (this.pain > 0 || body.dead) renderer.drawPain()
  }

  end() {
    this.renderer.remove()
  }
}
