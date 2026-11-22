import Scene3D from '/core/Scene3D.js'
import { createSun } from '/core3d/light.js'
import PhysicsWorld from '/core3d/physics/PhysicsWorld.js'
import { createGround } from '/core3d/ground.js'
import { createSideWall, createSphere } from '/core3d/geometry/index.js'
import * as THREE from 'three'
import { aimRate, barrel, description as cannon, models as cannonModels } from '/core3d/actor/derived/Cannon.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import TiltingBarrel from '/core3d/actor/characters/TiltingBarrel.js'
import Sound from '/core/io/audio/SoundSource.js'
import { Ammo } from '/core3d/physics/index.js'
import PowerMeter from '/ui/PowerMeter.js'
import { requestModels } from '/core3d/assets/models.js'
import { keys } from '/core/io/keys.js'

const controlKeys = {
  '← or A': 'left',
  '→ or D': 'right',
  [keys.up.label]: 'raise the barrel',
  [keys.down.label]: 'lower the barrel',
  [`Mouse or ${keys.jump.label}`]: 'shoot',
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
    // the keyboard also tracks a held pointer, which charges the shot on touch screens too
    // it faces the wall, down -z
    const { body, model, keys } = leadCharacter(this, cannon, { yaw: Math.PI / 2, input: { useKeyboard: true },
      view: { showHealthBar: false, distance: 2, height: 2, lookAt: [0, 2, 0] } })
    Object.assign(this, { player: body, cannon: model, input: keys.input })
    this.barrel = new TiltingBarrel(body, model.mesh, barrel)
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.shotPoint } })
    model.sounds.push(this.shotSound)
    this.power = new PowerMeter({ min: 10, max: 25, chargePerSecond: 12 })
    this.session.scope.add(() => this.power.end())
    this.shots = 20

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
    if (e.target.closest('button, input, progress')) return
    this.fire()
  }

  /** A click or a released Space fires the charged shot while the game runs. */
  fire() {
    if (!this.gameLoop.isRunning || this.ui.outro) return
    this.shoot()
    if (this.shots === 0) this.checkDefeat()
  }

  /** A ball flies from the muzzle the way the barrel points, as hard as the power charged. */
  shoot() {
    if (!this.shots) return
    const { physics, player } = this
    this.cannon.audioScene?.output.preload('metal-impact.mp3')
    const ball = createSphere({ r: .2, color: 0x202020 })
    ball.position.copy(player.ahead(1.5, player.size.height * .16))
    physics.add(ball, 4)
    this.shotPoint = ball.position.clone()
    this.shotSound.play()
    physics.contacts.once(ball.userData.body, point => this.cannon.audioScene?.emit('metal-impact.mp3', { profile: 'impact', spatial: { position: point } }))
    const way = new THREE.Vector3().copy(player.aim).multiplyScalar(this.power.value)
    const velocity = new Ammo.btVector3(way.x, way.y, way.z)
    ball.userData.body.setLinearVelocity(velocity) // the body copies it
    Ammo.destroy(velocity)
    this.power.reset()
    this.shots--
  }

  checkDefeat() {
    this.session.gameplay.after(2, () => {
      if (this.countableCrates.length > 0)
        this.defeat('You are out of ammo.')
    })
  }

  update(dt, t) {
    this.player.look(0, aimRate * dt * ((this.input.up ? 1 : 0) - (this.input.down ? 1 : 0)))
    super.update(dt, t)
    this.barrel.update()
    // the mouse button or Space, held, charges the shot; Space, released, fires it
    const spaceHeld = this.input.jump
    if (this.input.pressed.pointer || spaceHeld) this.power.charge(dt)
    if (this.spaceHeld && !spaceHeld) this.fire()
    this.spaceHeld = spaceHeld

    this.physics.update(dt)
    this.countableCrates = this.boxes.filter(mesh => mesh.position.y > .5)

    if (!this.countableCrates.length)
      this.victory('You demolished everything.', 'Bravo!')
  }

  sceneUI() {
    return this.ui.scoreUI('Blocks left', this.countableCrates.length, 'Shots left', this.shots)
  }
}
