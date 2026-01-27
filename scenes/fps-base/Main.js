import Scena3D from '/core/Scena3D.js'
import { createGround } from '/core3d/ground.js'
import { sample, getHeight } from '/core3d/helpers.js'
import { hemLight, lightningStrike } from '/core3d/light.js'
import FPSPlayer from '/core3d/actor/FPSPlayer.js'
import Maze from '/core3d/mazes/Maze.js'
import { truePrims } from '/core3d/mazes/algorithms.js'
import { GermanMachineGunnerAI } from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import { SSSoldierAI } from '/core3d/actor/derived/ww2/SSSoldier.js'
import { NaziOfficerAI } from '/core3d/actor/derived/ww2/NaziOfficer.js'
import { GermanFlameThrowerAI } from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import FirstAid from '/core3d/objects/FirstAid.js'
import { fpsControls } from '/ui/Controls.js'
import { Snow, Smoke, FlameUp, Fire } from '/core3d/Particles.js'
import { createCrate, createRustyBarrel, createMetalBarrel } from '/core3d/geometry/index.js'

const cellSize = 5

export default class extends Scena3D {
  constructor(manager) {
    super(manager, {
      toon: true,
      usePointerLock: true,
      controlKeys: fpsControls,
      intro: '<ul><li>Find the way out</li><li>Bonus: Kill all enemies</li></ul>',
      reportText: 'After the battle for Tuzla you remained behind enemy lines.\n\nFind the way out of the enemy base.',
    })
  }

  init() {
    this.bojaPozadine = 0x301934
    this.light = hemLight({ intensity: Math.PI * 1.5, scene: this.scene })
    this.addMesh(createGround({ file: 'terrain/snow.jpg' }))

    this.maze = new Maze({ rows: 8, columns: 8, truePrims, cellSize })
    const walls = this.maze.toTiledMesh({ texture: 'terrain/concrete.jpg' })
    this.addMesh(walls)

    this.player = new FPSPlayer({ camera: this.camera, solids: walls })
    this.player.putInMaze(this.maze)
    this.add(this.player)

    const coords = this.maze.getEmptyCoords(true, cellSize - 1)
    this.enemies = []
    const soldiers = [GermanMachineGunnerAI, SSSoldierAI, NaziOfficerAI, GermanFlameThrowerAI]
    for (let i = 0; i < 10; i++) {
      const EnemyClass = sample(soldiers)
      const enemy = new EnemyClass({ pos: coords.pop(), target: this.player.mesh, solids: walls })
      this.enemies.push(enemy)
      this.add(enemy)
    }

    for (let i = 0; i < 2; i++) {
      const firstAid = new FirstAid({ pos: coords.pop() })
      this.addMesh(firstAid.mesh)
    }

    this.smokes = []
    const createObject = [createCrate, createRustyBarrel, createMetalBarrel]
    for (let i = 0; i < 10; i++) {
      const pos = coords.pop()
      const mesh = sample(createObject)({ pos })
      this.addMesh(mesh)
      this.player.addSolids(mesh)

      if (i % 3 === 0) {
        const Effect = Math.random > .5 ? Smoke : FlameUp
        this.smoke = new Effect({ pos })
        this.smoke.mesh.position.y += getHeight(mesh)
        this.addMesh(this.smoke.mesh)
        this.smokes.push(this.smoke)
      }
    }

    this.snow = new Snow()
    this.addMesh(this.snow.mesh)

    this.fire = new Fire({ pos: this.maze.exitPosition })
    this.addMesh(this.fire.mesh)
  }

  end() {
    super.end()
    this.enemies = []
  }

  update(dt, t) {
    super.update(dt, t)
    this.snow.update({ delta: dt })
    this.smokes.forEach(smoke => smoke.update({ delta: dt }))
    this.fire.update({ delta: dt })
    const killed = this.enemies.filter(enemy => enemy.energy <= 0)
    const won = this.player.position.distanceTo(this.maze.exitPosition) < 5

    if (won)
      this.victory(`You found a way out and kill ${killed.length} of ${this.enemies.length} enemies`)

    if (this.player.dead)
      this.defeat('You are dead.')

    if (Math.random() > .998) lightningStrike(this.light, this.scene)
  }

  sceneUI() {
    const killed = this.enemies.filter(enemy => enemy.energy <= 0)
    const left = this.enemies.length - killed.length
    return /* html */`
      <div class="top-left ">
        <p>
          Score: ${killed.length}<br>
          <small>Enemy left: ${left}</small>
        </p>
      </div>
    `
  }
}
