import * as THREE from 'three'
import Scena3D from '/core/Scena3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { createGround } from '/core3d/ground.js'
import { createMoon, orbiting } from '/core3d/light.js'
import { getEmptyCoords, sample } from '/core3d/helpers.js'
import { createTombstone } from '/core3d/geometry/shapes.js'
import { GothGirlAI } from '/core3d/actor/derived/horror/GothGirl.js'
import { ZombieBarefootAI } from '/core3d/actor/derived/horror/ZombieBarefoot.js'
import { ZombieCopAI } from '/core3d/actor/derived/horror/ZombieCop.js'
import { ZombieDoctorAI } from '/core3d/actor/derived/horror/ZombieDoctor.js'
import { ZombieGuardAI } from '/core3d/actor/derived/horror/ZombieGuard.js'

const moonSpeed = .005
const totalTime = 300
const mapSize = 100

const customStartScreen = /* html */`
  <div class="central-screen rpgui-container framed">
    <ul><li>Survive until morning</li><li>Bonus: Kill zombies</li></ul>
    <button id="start">Press to START!</button>
    <p>Meet the morning at the cursed graveyard.<p>
  </div>
`

export default class extends Scena3D {
  constructor() {
    super({
      controlKeys: thirdPersonControls,
      customStartScreen,
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.npcs = []
    this.solids = []
    this.last = Date.now()
    this.bojaPozadine = 0x202030

    this.coords = getEmptyCoords({ mapSize, fieldSize: 1, emptyCenter: 1 })
    this.moon = createMoon({ intensity: Math.PI * 1.5, pos: [15, 25, -30] })
    this.addMesh(this.moon)
    this.addMesh(createGround({ size: mapSize }))

    for (let i = 0; i < 60; i++) {
      const tombstone = createTombstone({ pos: this.coords.pop() })
      this.solids.push(tombstone)
      this.addMesh(tombstone)
    }

    /* LAZY LOAD */

    const DeadTree = await import('/core3d/objects/DeadTree.js')
    for (let i = 0; i < 10; i++) {
      const tree = new DeadTree.default({ pos: this.coords.pop(), scale: Math.random() * 1 + 1, rotateY: Math.random() * Math.PI })
      this.solids.push(tree.mesh)
      this.addMesh(tree.mesh)
    }

    const { GhostAI } = await import('/core3d/actor/derived/horror/Ghost.js')
    for (let i = 0; i < 30; i++) {
      const ghost = new GhostAI({ pos: this.coords.pop(), mapSize })
      this.npcs.push(ghost)
      this.add(ghost)
    }

    const { ResistanceFighterPlayer } = await import('/core3d/actor/derived/ww2/ResistanceFighter.js')
    this.player = new ResistanceFighterPlayer({ camera: this.camera, solids: this.solids, rpgStyle: true })
    this.add(this.player)

    const { Smoke } = await import('/core3d/Particles.js')
    this.particles = new Smoke({ size: 1, num: 100, minRadius: 0, maxRadius: .5, minVelocity: .2, maxVelocity: .5, min: -1, max: 0, loop: false })
    this.add(this.particles)
  }

  /* FUNCTIONS */

  async spawnZombie(interval) {
    if (Date.now() - this.last >= interval) {
      this.last = Date.now()
      const zombies = [GothGirlAI, ZombieBarefootAI, ZombieCopAI, ZombieDoctorAI, ZombieGuardAI]

      const ZombieClass = sample(zombies)
      const pos = sample(this.coords)
      const zombie = new ZombieClass({ mapSize, target: this.player.mesh, solids: this.solids, pos })
      this.particles.reset({ pos })
      this.player.addSolids(zombie.mesh)
      this.add(zombie)
      this.npcs.push(zombie)
    }
  }

  /* LOOP */

  sceneUI() {
    const kills = this.player.enemies.filter(mesh => mesh.userData.energy <= 0)
    return this.ui.scoreUI('Zombies killed', kills.length, 'Time left', this.timeLeft, 'blink')
  }

  update(delta, time) {
    super.update(delta)

    this.timeLeft = Math.ceil(totalTime - time)
    const isNight = this.timeLeft >= 0

    const moonTime = isNight ? time * moonSpeed : (time - totalTime) * moonSpeed
    orbiting(this.moon, moonTime, 150, 1)

    if (isNight) {
      this.spawnZombie(10000)
      if (this.player.dead) this.ui.defeat('You have been killed at the cursed graveyard.')
    } else {
      this.moon.material.color = new THREE.Color(0xFCE570)
      this.moon.scale.set(2, 2, 2)
      this.scene.background.lerp(new THREE.Color(0x7ec0ee), delta * .2)
      this.npcs.forEach(npc => {
        npc.hitAmount = 100
      })
      if (!this.player.dead) this.ui.victory('Victory!<br>You met the morning at the cursed graveyard.')
    }
  }
}
