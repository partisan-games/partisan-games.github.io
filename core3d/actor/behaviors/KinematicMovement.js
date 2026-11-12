import { dir, RIGHT_ANGLE, reactions } from '/core3d/constants.js'

/** Moves a mesh from intentions; collision and terrain queries are supplied by the world adapter. */
export default class KinematicMovement {
  constructor({ mesh, velocity, isBlocked, groundHeight, rotate, react }) {
    this.mesh = mesh
    this.velocity = velocity
    this.isBlocked = isBlocked
    this.groundHeight = groundHeight
    this.rotate = rotate
    this.react = react
  }

  acceleration(input, { speed, runCoefficient }) {
    if (input.screen?.forward)
      return speed * -input.screen.forward * (input.up ? runCoefficient : runCoefficient * .75)
    if (input.up) return speed * (input.run ? runCoefficient : 1)
    if (input.down) return -speed * (input.run ? runCoefficient * .75 : 1)
    return 0
  }

  move(dt, { input, speed, runCoefficient, drag, canMove, state, reaction }) {
    if (!canMove) return
    const direction = input.up ? dir.forward : input.down ? dir.backward : null
    if (direction && this.isBlocked(direction)) {
      if (reaction === reactions.STOP) return
      this.react(reaction, dt)
    }
    if (state === 'jump') {
      const direction = input.up ? dir.upForward : input.down ? dir.upBackward : null
      if (direction && this.isBlocked(direction)) return
    }
    this.velocity.z += -this.acceleration(input, { speed, runCoefficient }) * dt
    this.velocity.z *= 1 - drag
    this.mesh.translateZ(this.velocity.z)
  }

  turn(dt, { input, speed }) {
    if (!dt) return
    const angle = (input.run ? RIGHT_ANGLE : RIGHT_ANGLE * speed * .25) * dt
    if (input.left) this.rotate(angle)
    if (input.right) this.rotate(-angle)
  }

  strafe(dt, { input, speed, runCoefficient }) {
    const acceleration = speed * (input.run ? runCoefficient : 1)
    if (input.strafeLeft && !this.isBlocked(dir.left)) this.mesh.translateX(-acceleration * dt)
    if (input.strafeRight && !this.isBlocked(dir.right)) this.mesh.translateX(acceleration * dt)
  }

  sampleGround({ solids, height, altitude }) {
    return this.groundHeight({ pos: this.mesh.position, solids, y: height }) + altitude
  }

  followTerrain(step, groundY) {
    const difference = this.mesh.position.y - groundY
    if (Math.abs(difference) <= step) this.mesh.position.y = groundY
    else this.mesh.translateY(difference < 0 ? step : -step)
  }

  gravity(dt, { gravity, maxVelocityY }) {
    if (this.velocity.y > -maxVelocityY) this.velocity.y -= gravity * dt
  }

  vertical(dt, groundY) {
    const distance = this.velocity.y * dt
    if (this.mesh.position.y + distance > groundY) this.mesh.translateY(distance)
    else this.mesh.position.y = groundY
  }
}
