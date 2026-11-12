import Input from '/core/io/Input.js'
import { jumpStyles, attackStyles, reactions } from '/core3d/constants.js'
import Actor from './Actor.js'
import ChaseCamera from '/core3d/actor/ChaseCamera.js'
import { currentStyleClasses } from '/ui/styles.js'
import { FPS } from '/core/konstante.js'
import PlayerController from './behaviors/PlayerController.js'
import PlayerView from './behaviors/PlayerView.js'

const emptyDict = dict => dict && Object.fromEntries(Object.keys(dict).map(k => [k, '']))

export default class Player extends Actor {
  constructor({
    animDict,
    buttonDict,
    useJoystick,
    useKeyboard,
    attackStyle = attackStyles.LOOP,
    jumpStyle = jumpStyles.ANIM_JUMP,
    shouldRaycastGround = true,
    attackKey,
    showHealthBar = true,
    input = new Input({ useJoystick, useKeyboard, attackKey, buttonDict: buttonDict || emptyDict(animDict) }),
    camera,
    showCameraButton,
    useComposedMovement = false,
    ...rest
  } = {}) {

    super({
      name: 'player', input, controller: useComposedMovement ? new PlayerController(input) : undefined,
      useComposedMovement, animDict, jumpStyle, attackStyle, shouldRaycastGround, ...rest,
    })
    if (useComposedMovement) {
      this.view = new PlayerView({ mesh: this.mesh, height: this.height, health: this.health, camera, showCameraButton, showHealthBar })
      this.chaseCamera = this.view.chaseCamera
      this.healthBar = this.view.healthBar
      return
    }
    if (camera) {
      this.shouldAlignCamera = true
      this.chaseCamera = new ChaseCamera({ camera, mesh: this.mesh, height: this.height, showCameraButton })
    }

    if (showHealthBar) this.createHealthBar()
  }

  /* GETTERS & SETTERS */

  get enemies() {
    return this.scene?.getObjectsByProperty('name', 'enemy') || []
  }

  get healths() {
    return this.scene?.getObjectsByProperty('name', 'health')
  }

  get solids() {
    return [...super.solids, ...this.enemies]
  }

  /* COMBAT */

  enterAttack(name = 'enemy', height) {
    super.enterAttack(name, height)
  }

  hit(mesh, damage = [35, 55]) {
    super.hit(mesh, damage)
  }

  areaDamage(damage = [89, 135]) {
    const near = this.enemies.filter(mesh => this.distanceTo(mesh) < 3)
    near.forEach(mesh => this.hit(mesh, damage))
  }

  /* UTILS */

  createHealthBar() {
    this.healthBar = document.createElement('progress')
    this.healthBar.value = this.healthBar.max = this.energy
    this.healthBar.className = `progress top-right ${currentStyleClasses().healthBar}`
    document.body.appendChild(this.healthBar)
  }

  updateHealthBar() {
    if (this.view) return this.view.updateHealthBar()
    this.healthBar.value = this.energy
  }

  checkHealths() {
    this.healths.forEach(health => {
      if (this.distanceTo(health) >= 1) return
      if (this.energy == this.maxEnergy) return

      if (health.userData.energy) {
        health.userData.energy--
        this.energy++
      } else
        this.scene?.remove(health)
    })
  }

  /* works only for Maze.toTiledMesh() */
  putInMaze(maze, tile = [1, 1]) {
    this.position = maze.tilePosition(...tile)
    this.mesh.lookAt(0, 0, 0)
    this.mesh.rotateY(Math.PI)
  }

  putInPolarMaze(maze) {
    const mazeSize = maze.rows * maze.cellSize
    this.position = { x: maze.cellSize * .5, y: 0, z: -mazeSize - maze.cellSize }
    this.mesh.lookAt(0, 0, -mazeSize * 2)
  }

  /* UPDATES */

  updateMove(delta, reaction = reactions.STOP) {
    super.updateMove(delta, reaction)
  }

  update(delta = 1 / FPS) {
    super.update(delta)
    if (this.view) this.view.update(delta, this.state)
    else if (this.shouldAlignCamera) {
      this.chaseCamera.alignCamera()
      this.shouldAlignCamera = false
    }
    if (!this.view) {
      if (this.chaseCamera) this.chaseCamera.update(delta, this.state)
      if (this.healthBar) this.updateHealthBar()
    }
    if (this.healths) this.checkHealths()
  }

  end() {
    if (this.view) {
      this.controller.end()
      this.view.end()
      return
    }
    this.input.end()
    this.healthBar?.remove()
    this.chaseCamera?.end()
  }
}
