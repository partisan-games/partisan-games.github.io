import Scena3D from '/core/Scena3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import * as THREE from 'three'
import { createGround } from '/core3d/ground.js'
import { createMoon, orbiting } from '/core3d/light.js'
import { getEmptyCoords, sample } from '/core3d/helpers.js'
import { createTombstone } from '/core3d/geometry/shapes.js'

const moonSpeed = .005
const totalTime = 300
const mapSize = 100
const npcs = []
const solids = []

let last = Date.now()

const zombies = ['GothGirl', 'ZombieBarefoot', 'ZombieCop', 'ZombieDoctor', 'ZombieGuard']

// gui.showGameScreen({ goals: ['Survive until morning', 'Bonus: Kill zombies'], subtitle: 'Meet the morning<br>at the cursed graveyard.', callback: () => loop.start(), autoClose: true })

export default class extends Scena3D {
  constructor() {
    super({
      controlKeys: thirdPersonControls,
    })
  }

  async init() {
    this.bojaPozadine = 0x202030

    this.coords = getEmptyCoords({ mapSize, fieldSize: 1, emptyCenter: 1 })
    this.moon = createMoon({ intensity: Math.PI * 1.5, pos: [15, 25, -30] })
    this.addMesh(this.moon)
    this.addMesh(createGround({ size: mapSize }))

    for (let i = 0; i < 60; i++) {
      const tombstone = createTombstone({ pos: this.coords.pop() })
      solids.push(tombstone)
      this.addMesh(tombstone)
    }

    /* LAZY LOAD */

    const DeadTree = await import('/core3d/objects/DeadTree.js')
    for (let i = 0; i < 10; i++) {
      const tree = new DeadTree.default({ pos: this.coords.pop(), scale: Math.random() * 1 + 1, rotateY: Math.random() * Math.PI })
      solids.push(tree.mesh)
      this.addMesh(tree.mesh)
    }

    const { GhostAI } = await import('/core3d/actor/derived/horror/Ghost.js')
    for (let i = 0; i < 30; i++) {
      const ghost = new GhostAI({ pos: this.coords.pop(), mapSize })
      npcs.push(ghost)
      this.addMesh(ghost.mesh)
    }

    const { ResistanceFighterPlayer } = await import('/core3d/actor/derived/ww2/ResistanceFighter.js')
    this.player = new ResistanceFighterPlayer({ camera: this.camera, solids })
    this.addMesh(this.player.mesh)

    // const gui = new GUI.default({ scoreTitle: 'Zombies killed', subtitle: 'Time left', useBlink: true, this.player, controls: { P: 'pause' } })

    const { Smoke } = await import('/core3d/Particles.js')
    this.particles = new Smoke({ size: 1, num: 100, minRadius: 0, maxRadius: .5 })
    this.addMesh(this.particles.mesh)
  }

  /* FUNCTIONS */

  async spawnZombie(interval) {
    if (Date.now() - last >= interval) {
      last = Date.now()

      const name = sample(zombies)
      const obj = await import(`/core/actor/derived/horror/${name}.js`)
      const ZombieClass = obj[name + 'AI']
      const pos = sample(this.coords)
      const zombie = new ZombieClass({ mapSize, target: this.player.mesh, solids, pos })
      this.particles.reset({ pos })
      this.player.addSolids(zombie.mesh)
      this.addMesh(zombie.mesh)
      npcs.push(zombie)
    }
  }

  /* LOOP */

  update(delta, time) {
    super.update(delta)
    if (!this.player) return

    const timeLeft = Math.ceil(totalTime - time)
    const isNight = timeLeft >= 0

    const moonTime = isNight ? time * moonSpeed : (time - totalTime) * moonSpeed
    orbiting(this.moon, moonTime, 150, 1)

    if (isNight) {
      this.spawnZombie(10000)
      const kills = this.player.enemies.filter(mesh => mesh.userData.energy <= 0)
      // if (!this.player.dead) gui.renderScore(kills.length, timeLeft)
      if (this.player.dead) this.ui.defeat('You have been killed at the cursed graveyard.')
    } else {
      this.moon.material.color = new THREE.Color(0xFCE570)
      this.moon.scale.set(2, 2, 2)
      this.scene.background.lerp(new THREE.Color(0x7ec0ee), delta * .2)
      if (!this.player.dead) this.ui.victory('Victory!<br>You met the morning at the cursed graveyard.')
    }

    this.player.update(delta)
    npcs.forEach(npc => {
      npc.update(delta)
      if (!isNight) npc.hitAmount = 100
    })
    this.particles?.update({ delta, min: -1, max: 0, minVelocity: .2, maxVelocity: .5, loop: false })
  }
}
