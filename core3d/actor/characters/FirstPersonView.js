import FPSRenderer from '/core3d/actor/FPSRenderer.js'

/** Seconds the screen stays red after a hit, and a mark at its edge shows the way the hit came from. */
const painTime = .3
const markTime = 1.5
/** How far the weapon's sway jumps at a shot, in its seconds. */
const recoil = 5

/**
 * What a first-person player sees through the character's eyes: the camera at its eye height, a little behind its
 * middle, turned the way it looks; its weapon swaying as it walks and kicking at each shot, the screen red for a
 * moment after a hit and for good once it is dead. A bar under the crosshair fills as its gun's `readiness()`, from 0
 * to 1, while it cannot fire.
 */
export default class FirstPersonView {
  constructor(body, { camera, weaponSrc, behind = body.size.height / 4, showTarget = () => true, readiness = () => 1 }) {
    this.body = body
    this.readiness = readiness
    this.camera = camera
    this.behind = behind
    this.showTarget = showTarget
    this.weaponSource = typeof weaponSrc === 'function' ? weaponSrc : null
    camera.rotation.order = 'YXZ'
    this.renderer = new FPSRenderer({ weaponSrc: this.weaponSource ? this.weaponSource() : weaponSrc })
    this.sway = 0
    this.pain = 0
    this.seen = { shots: body.shotsFired, hits: body.hitsTaken }
    /** The seconds each body that hit the player stays marked. */
    this.marks = new Map()
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
    if (body.hitsTaken > seen.hits) {
      this.pain = painTime
      if (body.hitBy) this.marks.set(body.hitBy, markTime)
    }
    for (const [source, left] of this.marks)
      if (left > dt) this.marks.set(source, left - dt)
      else this.marks.delete(source)
    Object.assign(seen, { shots: body.shotsFired, hits: body.hitsTaken })
    this.pain = Math.max(0, this.pain - dt)
    if (body.dead) renderer.clear()
    else {
      this.sway += body.running ? dt * body.run : dt
      renderer.render(this.sway)
    }
    const readiness = this.readiness()
    if (body.alive && readiness < 1) renderer.drawCharge(readiness)
    if (this.pain > 0 || body.dead) renderer.drawPain()
    if (body.alive) for (const { angle, strength } of this.hitMarks) renderer.drawHitFrom(angle, strength)
  }

  /**
   * The ways the player was hit from: each `angle` on the screen, as `Math.atan2` gives it with y down, so straight
   * ahead is up and one behind is down, and its fading `strength`.
   */
  get hitMarks() {
    const { body } = this
    return [...this.marks].map(([source, left]) => {
      const bearing = Math.atan2(body.z - source.z, source.x - body.x) - body.yaw
      return { angle: Math.atan2(-Math.cos(bearing), -Math.sin(bearing)), strength: left / markTime }
    })
  }

  end() {
    this.renderer.remove()
  }
}
