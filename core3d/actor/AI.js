import { Vector3, MathUtils } from 'three'
import Actor from './Actor.js'
import Keyboard from '/core/io/Keyboard.js'
import AIController from './behaviors/AIController.js'
import { jumpStyles, attackStyles, baseStates, dir } from '/core3d/constants.js'
import { belongsTo, directionBlocked } from '/core3d/helpers.js'

const { randFloat, randFloatSpread } = MathUtils

const pursueStates = [baseStates.idle, baseStates.patrol, baseStates.wander]

export default class AI extends Actor {
  constructor({
    speed = 1.8,
    jumpStyle = jumpStyles.ANIM_JUMP,
    attackStyle = attackStyles.LOOP,
    baseState = baseStates.wander,
    sightDistance = 25,
    followDistance = 1.5,
    patrolDistance = 10,
    target,
    name = target ? 'enemy' : 'ai',
    useComposedMovement = false,
    ...params
  } = {}) {
    super({
      name,
      speed,
      jumpStyle,
      attackStyle,
      input: useComposedMovement ? undefined : new Keyboard({ listen: false }),
      controller: useComposedMovement ? new AIController() : undefined,
      useComposedMovement,
      shouldRaycastGround: false,
      useRicochet: false,
      leaveDecals: false,
      baseState,
      ...params,
    })

    if (target) {
      this.target = target
      this.addSolids(target)
    }

    this.baseState = baseState
    this.followDistance = followDistance
    this.sightDistance = sightDistance
    this.patrolDistance = patrolDistance
    this.last = this.age // for ai intervals

    this.mesh.rotateY(Math.random() * Math.PI * 2)
    this.randomizeAction()

    // turnSmooth variables
    this.isRotating = false
    this.targetRotationY = 0
    this.startRotationY = 0
    this.rotationStart = 0
    this.rotationDuration = 0
  }

  /* GETTERS */

  get canPursue() {
    return pursueStates.includes(this.baseState)
  }

  get distanceToTarget() {
    if (!this.target) return Infinity
    return this.distanceTo(this.target)
  }

  get lookingAtTarget() {
    if (!this.target) return false
    const direction1 = this.mesh.getWorldDirection(new Vector3())
    const direction2 = this.target.getWorldPosition(new Vector3())
      .sub(this.mesh.getWorldPosition(new Vector3())).normalize()
    const dotProduct = direction1.dot(direction2)

    return (-1.3 < dotProduct && dotProduct < -0.7)
  }

  get targetInAttackRange() {
    if (!this.target) return false
    return this.distanceToTarget < this.attackDistance
  }

  get targetInSightRange() {
    if (!this.target) return false
    return this.distanceToTarget < this.sightDistance
  }

  /** The target itself stands in the way, so moving closer is impossible. */
  get blockedByTarget() {
    if (!this.target) return false
    return Boolean(this.directionBlocked(dir.forward, [this.target]))
  }

  get targetAbove() {
    if (!this.target) return false
    return this.target.position.y >= this.position.y + this.height * .5
  }

  get targetNear() {
    if (!this.target || this.targetAbove) return false
    return (this.targetInSightRange && this.lookingAtTarget) || this.distanceToTarget < this.sightDistance * .3 // feel if too close
  }

  get targetSpotted() {
    if (!this.target) return false

    if (this.targetNear) this.lookAtTarget()
    const intersects = this.intersect()
    if (!intersects.length) return false

    const { object } = intersects[0]
    return belongsTo(object, this.target.name)
  }

  /* ANIMATIONS */

  randomizeAction() {
    if (!this.action) return
    this.action.time = Math.random() * this.action.getClip().duration
    this.anim.mixer.update(0)
  }

  /* UTILS */

  lookAtTarget() {
    if (!this.target) return
    const { x, z } = this.target.position
    const pos = new Vector3(x, this.position.y, z)
    this.lookAt(pos)
  }

  turnSmooth(angle = Math.PI, duration = 2500) {
    this.startRotationY = this.mesh.rotation.y
    this.targetRotationY = this.mesh.rotation.y + angle
    this.rotationStart = this.age
    this.rotationDuration = duration
    this.isRotating = true
  }

  checkRotation() {
    if (!this.isRotating) return

    const elapsed = (this.age - this.rotationStart) * 1000
    const progress = Math.min(1, elapsed / this.rotationDuration)
    this.mesh.rotation.y = this.startRotationY + (this.targetRotationY - this.startRotationY) * progress

    if (progress >= 1) this.isRotating = false
  }

  turnEvery(interval, angle = Math.PI / 2, duration = 1000) {
    if ((this.age - this.last) * 1000 >= interval) {
      this.turnSmooth(randFloat(-angle, angle), duration)
      this.last = this.age
    }
  }

  directionBlocked(currDir, solids = this.solids) {
    const rayLength = currDir == dir.forward ? this.depth * 2 : this.height
    return directionBlocked(this.mesh, solids, currDir, rayLength)
  }

  /* COMBAT */

  hit(mesh, range = [15, 35]) {
    if (!this.lookingAtTarget) return
    super.hit(mesh, range)
  }

  enterAttack(name = 'player') {
    this.lookAtTarget()
    this.mesh.rotateY(randFloatSpread(Math.PI / 16))
    super.enterAttack(name)
  }

  /* UPDATE */

  checkTarget() {
    if (this?.target?.userData?.energy <= 0)
      this.target = null
  }

  update(delta) {
    super.update(delta)
    this.checkTarget()
    this.checkRotation()
  }
}
