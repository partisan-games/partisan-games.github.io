import * as THREE from 'three'
import GameObject from '/core3d/objects/GameObject.js'
import { getGroundY, directionBlocked, intersect, belongsTo, arrowHelper } from '/core3d/helpers.js'
import { dir, RIGHT_ANGLE, reactions, jumpStyles, baseStates } from '/core3d/constants.js'
import { createSound, randomVolume } from '/core/io/sound.js'
import FSM from './FSM.js'
import { isDev } from '/config.js'
import Animator from './Animator.js'
import { FPS } from '/core/konstante.js'
import GameClock from '/core/runtime/GameClock.js'
import KinematicMovement from './behaviors/KinematicMovement.js'
import { damageAt } from '/core/gameplay/damage.js'

const getParent = (object, name) =>
  object.name === name ? object : getParent(object.parent, name)

/**
 * Base abstract class for AI and Player; handles movement, animations...
 * @param animDict: maps state to animation
 */
export default class Actor extends GameObject {
  constructor({
    animations,
    animDict,
    input,
    controller,
    useComposedMovement = false,
    speed = 2,
    jumpStyle,
    attackStyle,
    gravity = 42,
    jumpForce = gravity * 1.66,
    maxVelocityY = gravity / 3, // actually much greater than gravity with applied delta
    maxJumpTime = .28,
    drag = 0.5,
    twoHandedWeapon,
    rightHandWeapon,
    mapSize,
    attackDistance = 1.5,
    hitColor = 0x8a0303,
    runCoefficient = 2,
    leaveDecals = attackDistance > 9,
    useRicochet = attackDistance > 9,
    attackSound = '',
    altitude = 0, // for flying objects
    shouldRaycastGround = Boolean(altitude),
    useFlame = null,
    turnWhileAttack = !useFlame,
    baseState = baseStates.idle,
    canMove = true,
    deathCallback,
    ...rest
  }) {
    super({ altitude, ...rest })
    this.mesh.userData.hitColor = hitColor
    this.speed = speed
    this.groundY = 0
    this.gravity = gravity
    this.velocity = new THREE.Vector3()
    this.maxVelocityY = maxVelocityY
    this.jumpStyle = jumpStyle
    this.attackStyle = attackStyle
    this.maxJumpTime = maxJumpTime
    this.jumpForce = jumpForce
    this.drag = drag
    this.controller = controller
    this.input = controller ? controller.intent : input
    this.shouldRaycastGround = shouldRaycastGround
    this.runCoefficient = runCoefficient
    this.attackDistance = this.depth > attackDistance ? Math.ceil(this.depth) : attackDistance
    this.attackSound = attackSound
    this.useRicochet = useRicochet
    this.leaveDecals = leaveDecals
    this.altitude = altitude
    this.turnWhileAttack = turnWhileAttack
    this.deathCallback = deathCallback
    this.canMove = canMove

    if (animations?.length && animDict)
      this.anim = new Animator({ mesh: this.mesh, animations, animDict, twoHandedWeapon, rightHandWeapon, isAi: this.name != 'player' })

    if (attackSound)
      this.audio = createSound(attackSound)

    if (mapSize) {
      const halfMap = mapSize / 2
      this.boundaries = new THREE.Box3(
        new THREE.Vector3(-halfMap, 0, -halfMap), new THREE.Vector3(halfMap, 0, halfMap)
      )
    }

    if (useRicochet) {
      const promise = import('/core3d/Particles.js')
      promise.then(obj => {
        const Particles = obj.default
        this.ricochet = new Particles({ num: 100, size: .05, unitAngle: 0.2 })
      })
    }

    if (useFlame) {
      const promise = import('/core3d/Particles.js')
      promise.then(obj => {
        const { Flame } = obj
        this.flame = new Flame({ num: 25, minRadius: 0, maxRadius: .5, minVelocity: 2.5, maxVelocity: 5 })
        this.flame.mesh.material.opacity = 0
      })
    }

    if (leaveDecals) {
      const promise = import('/core3d/decals.js')
      promise.then(obj => {
        this.shootDecals = obj.shootDecals
      })
    }

    if (useComposedMovement)
      this.movement = new KinematicMovement({
        mesh: this.mesh, velocity: this.velocity,
        isBlocked: direction => this.directionBlocked(direction),
        groundHeight: getGroundY,
        rotate: angle => this.turn(angle),
        react: (reaction, dt) => {
          if (reaction === reactions.BOUNCE) this.bounce()
          else if (reaction === reactions.TURN_SMOOTH) this.turnSmooth()
          else if (reaction === reactions.STEP_OFF) this.stepOff(dt * 2.5)
        },
      })

    // game time this actor has lived: its states, AI intervals and delayed blows wait on it, so they stop when it is not updated
    this.clock = new GameClock()
    this.fsm = new FSM(this, baseState)
    // pose the model as its first state's animation before the first render, instead of the T-pose
    this.anim?.mixer.update(0)
  }

  /* GETTERS & SETTERS */

  get heightDifference() {
    return this.mesh.position.y - this.groundY
  }

  get inAir() {
    if (!this.shouldRaycastGround) return false

    return this.heightDifference > this.height * .25
  }

  get onGround() {
    if (!this.shouldRaycastGround) return true

    return this.heightDifference <= .001
  }

  get acceleration() {
    const { input, speed, runCoefficient } = this
    if (this.movement) return this.movement.acceleration(input, { speed, runCoefficient })
    if (input.screen?.forward)
      return speed * -input.screen.forward * (input.up ? runCoefficient : runCoefficient * .75)

    if (input.up) return speed * (input.run ? runCoefficient : 1)
    if (input.down) return -speed * (input.run ? runCoefficient * .75 : 1)

    return 0
  }

  get outOfBounds() {
    if (!this.boundaries) return false
    return this.position.x >= this.boundaries.max.x
      || this.position.x <= this.boundaries.min.x
      || this.position.z >= this.boundaries.max.z
      || this.position.z <= this.boundaries.min.z
  }

  get ableToJump() {
    return this.anim?.actions.jump || this.jumpStyle != jumpStyles.ANIM_JUMP
  }

  get state() {
    return this.fsm.stateName
  }

  get action() {
    return this.fsm?.action
  }

  /* STATE MACHINE */

  setState(name) {
    this.fsm.setState(name)
  }

  /* ANIMATIONS */

  addAction(state, clip) {
    this.anim.addAction(state, clip)
  }

  /* COMBAT */

  intersect(height) {
    return intersect(this.mesh, this.solids, dir.forward, height)
  }

  hit(mesh, damage = [35, 55]) {
    const amount = damageAt({ distance: this.distanceTo(mesh), reach: this.attackDistance, range: damage })
    if (amount) mesh.userData.damageAmount = amount
  }

  /**
   * The blow lands halfway through the attack animation. Death cancels it; pain does not,
   * so a hurt attacker still lands a blow already under way, as it always has.
   */
  enterAttack(name, height = this.height * .66) {
    const timeToHit = this.action ? this.action.getClip().duration * .5 : .2

    this.clock.cancel(this.pendingHit)
    this.pendingHit = this.clock.after(timeToHit, () => {
      this.pendingHit = null
      if (!this.scene) return // the actor may have left the scene meanwhile
      if (this.attackSound) this.playAttackSound()

      if (isDev) arrowHelper(this, height)

      const intersects = this.intersect(height)
      if (!intersects.length) return

      const { point, object, distance } = intersects[0]
      if (distance > this.attackDistance) return

      if (belongsTo(object, name)) {
        const mesh = getParent(object, name)
        this.hit(mesh)
        if (this.useRicochet) this.addRicochet(point, mesh.userData.hitColor)
      } else if (this.leaveDecals) { // if not hit enemy
        this.addRicochet(point, 0xcccccc)
        this.shootDecals?.(intersects[0], { scene: this.scene, color: 0x000000 })
      }
    })
  }

  playAttackSound() {
    this.audio.currentTime = 0
    this.audio.volume = randomVolume()
    this.audio.play()
  }

  /* PARTICLES */

  addRicochet(pos, color) {
    if (!this.ricochet) return // still loading lazily
    this.ricochet.reset({ pos, unitAngle: 0.2, color })
    this.scene.add(this.ricochet.mesh)
  }

  resetFlame(randomize = true) {
    const { flame, mesh } = this
    flame.reset({ pos: this.position, randomize })
    flame.mesh.rotation.copy(mesh.rotation)
    flame.mesh.rotateX(Math.PI)
    flame.mesh.translateY(-1.2)
    flame.mesh.translateZ(1.75)
    this.shouldLoop = true
  }

  startFlame(defer = 1, callback, randomize) {
    this.scene.add(this.flame.mesh)
    this.clock.cancel(this.flameTimer)
    this.flameTimer = this.clock.after(defer, () => {
      if (this.dead) return
      this.resetFlame(randomize)
      if (callback) callback()
    })
  }

  endFlame() {
    this.clock.cancel(this.flameTimer) // a flame that has not started yet must not start after the attack ended
    this.shouldLoop = false
  }

  /* UTILS */

  handleTerrain(step) {
    if (this.movement) return this.movement.followTerrain(step, this.groundY)
    if (this.heightDifference == 0) return

    if (Math.abs(this.heightDifference) <= step) {
      this.mesh.position.y = this.groundY
      return
    }

    if (this.heightDifference < 0)
      this.mesh.translateY(step)

    if (this.heightDifference > 0)
      this.mesh.translateY(-step)

  }

  directionBlocked(currDir, solids = this.solids) {
    const rayLength = currDir == dir.forward ? this.depth : this.height
    return directionBlocked(this.mesh, solids, currDir, rayLength)
  }

  turn(angle) {
    this.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), angle)
  }

  bounce(angle = Math.PI) {
    this.turn(angle)
    this.mesh.translateZ(this.velocity.z)
  }

  lookAt(pos) {
    this.mesh.lookAt(pos)
    this.mesh.rotateY(Math.PI)
  }

  /* UPDATES */

  checkHit() {
    if (!this.damageAmount) return
    if (this.dead) { // a corpse can still be hit, but must not die again
      this.damageAmount = 0
      return
    }

    this.applyDamage()

    if (this.dead) {
      this.clock.cancel(this.pendingHit)
      this.setState('death')
      this.deathCallback?.()
    } else
      this.setState('pain')
  }

  /** Without a death animation the actor would keep standing in its last pose. */
  fallDead() {
    this.anim?.mixer.stopAllAction()
    this.mesh.rotateX(Math.PI / 2)
  }

  stepOff(val) {
    this.mesh.translateX(val)
    this.mesh.translateZ(val)
  }

  turnSmooth() {
    this.bounce() // implement in children classes
  }

  updateMove(delta, reaction = reactions.BOUNCE) {
    if (this.movement) return this.movement.move(delta, {
      input: this.input, speed: this.speed, runCoefficient: this.runCoefficient,
      drag: this.drag, canMove: this.canMove, state: this.state, reaction,
    })
    if (!this.canMove) return

    const direction = this.input.up ? dir.forward
      : this.input.down ? dir.backward : null

    if (direction && this.directionBlocked(direction))
      if (reaction == reactions.BOUNCE) this.bounce()
      else if (reaction == reactions.TURN_SMOOTH) this.turnSmooth()
      else if (reaction == reactions.STEP_OFF) this.stepOff(delta * 2.5)
      else if (reaction == reactions.STOP) return

    if (this.state == 'jump') {
      const jumpDir = this.input.up ? dir.upForward
        : this.input.down ? dir.upBackward : null
      if (jumpDir && this.directionBlocked(jumpDir)) return
    }

    this.velocity.z += -this.acceleration * delta
    this.velocity.z *= (1 - this.drag)
    this.mesh.translateZ(this.velocity.z)
  }

  updateTurn(delta) {
    if (this.movement) return this.movement.turn(delta, { input: this.input, speed: this.speed })
    if (!delta) return
    const angle = (this.input.run ? RIGHT_ANGLE : RIGHT_ANGLE * this.speed * .25) * delta // angle per second

    if (this.input.left)
      this.turn(angle)
    if (this.input.right)
      this.turn(angle * -1)
  }

  updateStrafe(delta) {
    if (this.movement) return this.movement.strafe(delta, {
      input: this.input, speed: this.speed, runCoefficient: this.runCoefficient,
    })
    const acceleration = this.speed * (this.input.run ? this.runCoefficient : 1)

    if (this.input.strafeLeft && !this.directionBlocked(dir.left))
      this.mesh.translateX(-acceleration * delta)

    if (this.input.strafeRight && !this.directionBlocked(dir.right))
      this.mesh.translateX(acceleration * delta)
  }

  updateGround() {
    const { solids } = this
    if (!solids || !this.shouldRaycastGround) return

    if (this.movement) {
      this.groundY = this.movement.sampleGround({ solids, height: this.height, altitude: this.altitude })
      return
    }

    this.groundY = getGroundY({ pos: this.position, solids, y: this.height }) + this.altitude
  }

  applyGravity(delta) {
    if (this.movement) return this.movement.gravity(delta, { gravity: this.gravity, maxVelocityY: this.maxVelocityY })
    if (this.velocity.y > -this.maxVelocityY)
      this.velocity.y -= this.gravity * delta
  }

  applyVelocityY(delta) {
    if (this.movement) return this.movement.vertical(delta, this.groundY)
    const deltaVelocity = this.velocity.y * delta
    if (this.mesh.position.y + deltaVelocity > this.groundY)
      this.mesh.translateY(deltaVelocity)
    else
      this.mesh.position.y = this.groundY
  }

  /** Seconds of game time this actor has lived. */
  get age() {
    return this.clock.now
  }

  update(delta = 1 / FPS, t) {
    this.clock.advance(delta)
    this.controller?.update?.()
    this.updateGround()
    this.fsm.update(delta)
    this.anim?.update(delta)
    if (!this.dead && !['jump', 'fall'].includes(this.state))
      this.handleTerrain(2 * delta)

    this.checkHit()

    if (this.outOfBounds) this.bounce()

    if (this.useRicochet) this.ricochet?.expand({ velocity: 1.2, maxRounds: 5, gravity: .02 })
    this.flame?.update(delta, t, { max: this.attackDistance, loop: this.shouldLoop })
  }
}
