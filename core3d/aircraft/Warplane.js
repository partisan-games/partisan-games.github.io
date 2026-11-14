import Input from '/core/io/Input.js'
import GameObject from '/core3d/objects/GameObject.js'
import Missile from './Missile.js'
import WarplaneView from './WarplaneView.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import Cooldown from '/core/gameplay/Cooldown.js'

const reloadTime = .5 // seconds between missiles
const landingBrake = 3 // speed lost per second on the ground, as .1 a frame at 30 frames per second
const steeringResponse = 12
const brakingResponse = 18
const bankingResponse = 6

/** The player's plane. `clock` is the game clock: the missile reload waits in a pause. */
export default class Warplane extends GameObject {
  constructor({ clock, camera, limit, speed = 40, y = 29, ...rest }) {
    super({ name: 'player', energy: 500, ...rest })
    this.speed = speed
    this.limit = limit
    this.rotationSpeed = .75
    this.position.y = y
    this.minHeight = y / 2
    this.maxHeight = y * 2
    this.maxRoll = Math.PI / 6
    this.velocityX = 0
    this.velocityY = 0
    this.missiles = []
    this.missileReload = new Cooldown({ seconds: reloadTime, clock })
    this.view = new WarplaneView(this)
    this.input = new Input({ buttonDict: { attack: '💣' } })

    if (camera) {
      this.chaseCamera = new ChaseCamera({
        camera, mesh: this.mesh, rotate: false,
        speed: this.speed * .75,
        offset: [0, 0, this.depth],
        lookAt: [0, 0, 0],
        birdsEyeOffset: [0, this.height * 12, 0],
        birdsEyeLookAt: [0, 0, -this.depth],
      })
      this.chaseCamera.alignCamera()
      this.chaseCamera.far = limit * 2
    }
  }

  /* GETTERS AND SETTERS */

  get timeToShoot() {
    return this.missileReload.ready
  }

  set propeller(propeller) {
    this.view.addPropeller(propeller)
  }

  get inAir() {
    return this.position.y > this.height * 2 / 3
  }

  /* METHODS */

  addMissile() {
    const pos = this.position.clone()
    pos.y -= this.height * .33
    const { explosion } = this.view
    const missile = new Missile({ pos, explosion })
    this.scene.add(missile.mesh)
    this.missiles.push(missile)
    this.scene.add(explosion.mesh)
  }

  removeMissile(missile) {
    this.scene.remove(missile.mesh)
    this.missiles.splice(this.missiles.indexOf(missile), 1)
  }

  handleInput(delta) {
    if (this.landing) return
    const horizontal = Number(Boolean(this.input.right)) - Number(Boolean(this.input.left))
    const vertical = Number(Boolean(this.input.up)) - Number(Boolean(this.input.down))
    this.moveAxis('x', horizontal * this.speed, delta, -this.limit, this.limit)
    this.moveAxis('y', vertical * this.speed * .5, delta, this.minHeight, this.maxHeight)

    if (this.input.attack && this.timeToShoot) {
      this.addMissile()
      this.missileReload.start()
    }
  }

  moveAxis(axis, targetSpeed, delta, min, max) {
    const key = axis === 'x' ? 'velocityX' : 'velocityY'
    const previous = this[key]
    const response = targetSpeed ? steeringResponse : brakingResponse
    const decay = Math.exp(-response * delta)
    // Integrate the damped velocity, keeping acceleration independent of frame rate.
    const distance = targetSpeed * delta + (previous - targetSpeed) * (1 - decay) / response
    const position = this.position[axis] + distance
    this.position[axis] = Math.max(min, Math.min(max, position))
    this[key] = position <= min || position >= max ? 0 : targetSpeed + (previous - targetSpeed) * decay
  }

  normalizePlane(delta) {
    if (this.dead) return
    const targetRoll = this.landing ? 0 : -this.velocityX / Math.max(this.speed, .001) * this.maxRoll
    this.mesh.rotation.z += (targetRoll - this.mesh.rotation.z) * (1 - Math.exp(-bankingResponse * delta))
  }

  checkHit() {
    if (!this.damageAmount) return

    this.applyDamage()
    this.view.showDamage()
  }

  land(delta, broken = false) {
    this.landing = true
    this.velocityX = this.velocityY = 0
    if (this.inAir) {
      this.position.y -= this.speed * 0.5 * delta
      if (broken) this.mesh.rotation.z -= this.rotationSpeed * .5 * delta
    } else {
      this.chaseCamera.offset[1] = this.height * 1.5
      this.chaseCamera.offset[2] = this.depth * 1.5
      if (this.speed > 0) this.speed -= landingBrake * delta
    }
  }

  die(delta) {
    this.land(delta, true)
  }

  update(delta, t) {
    this.missiles.forEach(missile => {
      if (missile.dead) this.removeMissile(missile)
      missile.update(delta)
    })

    this.view.update(delta, t)

    this.checkHit()
    if (this.dead) this.die(delta)
    else this.handleInput(delta)
    this.normalizePlane(delta)
    // Steering already damps the movement. A second camera lag makes frame-time
    // changes shift the plane on screen, even during a steady turn.
    this.chaseCamera?.alignCamera()
  }

  end() {
    this.input.end()
    this.chaseCamera?.end()
  }
}
