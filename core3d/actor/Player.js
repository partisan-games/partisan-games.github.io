import Input from '/core/io/Input.js'
import { jumpStyles, attackStyles, reactions } from '/core3d/constants.js'
import Actor from './Actor.js'
import GameObject from '/core3d/objects/GameObject.js'
import { FPS } from '/core/constants.js'
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
    controller = new PlayerController(input),
    camera,
    showCameraButton,
    ...rest
  } = {}) {
    super({
      name: 'player', input, controller,
      animDict, jumpStyle, attackStyle, shouldRaycastGround, ...rest,
    })
    this.view = new PlayerView({ mesh: this.mesh, height: this.height, health: this.health, camera, showCameraButton, showHealthBar })
    this.chaseCamera = this.view.chaseCamera
    this.healthBar = this.view.healthBar
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

  updateHealthBar() {
    this.view.updateHealthBar()
  }

  checkHealths() {
    this.healths.forEach(mesh => {
      if (this.distanceTo(mesh) >= 1) return
      if (this.energy === this.maxEnergy) return

      const firstAid = GameObject.ownerOf(mesh)
      if (firstAid.energy) {
        firstAid.energy--
        this.energy++
      } else
        this.scene?.remove(mesh)
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

  updateMove(delta, reaction = reactions.STOP) {
    super.updateMove(delta, reaction)
  }

  update(delta = 1 / FPS) {
    super.update(delta)
    this.view.update(delta, this.state)
    if (this.healths) this.checkHealths()
  }

  end() {
    if (this.controller) this.controller.end()
    else this.input.end?.()
    this.view.end()
  }
}
