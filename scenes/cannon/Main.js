import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround } from '/core3d/ground.js'
import { createSideWall } from '/core3d/geometry/index.js'
import { CannonPlayer, models as cannonModels } from '/core3d/actor/derived/Cannon.js'
import { requestModels } from '/core3d/assets/models.js'

const controlKeys = {
  '← or A': 'left',
  '→ or D': 'right',
  'Mouse down': 'add force',
  'Mouse up': 'shoot'
}

export default class CannonScene extends Scene3D {
  constructor() {
    super({
      intro: 'Demolish the wall — leave no stone on stone.',
      toon: true,
      controlKeys,
      uiStyle: 'rpg',
    })
  }

  async init() {
    await requestModels([...cannonModels])
    this.player = new CannonPlayer({ camera: this.camera })
    this.player.chaseCamera.distance = 2
    this.player.chaseCamera.height = 2
    this.player.chaseCamera.lookAt = [0, 2, 0]
    this.player.chaseCamera.alignCamera()
    this.add(this.player)

    const sun = createSun({ pos: [-5, 10, 5] })
    this.addMesh(sun)

    this.physics = new PhysicsWorld({ scene: this.scene })
    this.session.scope.add(() => this.physics.dispose())
    const ground = createGround({ size: 40 })
    this.physics.add(ground, 0)

    this.boxes = createSideWall({ rows: 9, columns: 10, brickMass: 3, friction: 5, z: -9 })
    this.boxes.forEach(mesh => this.physics.add(mesh))
  }

  handleClick(e) {
    if (e.target.closest('button, input, progress') || !this.gameLoop.isRunning || this.ui.outro) return

    this.player.shoot(this.physics)
    if (this.player.shots === 0) this.checkDefeat()
  }

  checkDefeat() {
    this.session.gameplay.after(2, () => {
      if (this.countableCrates.length > 0)
        this.defeat('You are out of ammo.')
    })
  }

  update(dt, t) {
    super.update(dt, t)

    this.physics.update(dt)
    this.countableCrates = this.boxes.filter(mesh => mesh.position.y > .5)

    if (!this.countableCrates.length)
      this.victory('You demolished everything.', 'Bravo!')
  }

  sceneUI() {
    return this.ui.scoreUI('Blocks left', this.countableCrates.length, 'Shots left', this.player.shots)
  }
}
