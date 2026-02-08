import Scena3D from '/core/Scena3D.js'
import { ambLight, createMoon, orbitAround } from '/core3d/light.js'
import { Stars } from '/core3d/Particles.js'
import Platform from '/core3d/objects/Platform.js'
import { loadModel } from '/core3d/loaders.js'
import { createSphere } from '/core3d/geometry/index.js'
import { createJupiter, createSaturn } from '/core3d/geometry/planets.js'
import Lander from './Lander.js'

const controls = {
  '← or A': 'thrust left',
  '→ or D': 'thrust right',
  '↓ or S': 'thrust down',
  '↑ or W': '',
}

export default class extends Scena3D {
  constructor() {
    // TODO: providni UI prozor?
    super({
      toon: true,
      controlKeys: controls,
      intro: 'Land on the platform gently',
      startButtonText: 'Start'
    })
  }

  async init() {
    // TODO: boja pozadine
    // document.body.style.background = 'linear-gradient(to bottom, #020111 70%, #191621 100%)'
    this.camera.position.z = 18

    ambLight({ scene: this.scene })
    const moonLight = createMoon({ pos: [30, 30, 30], intensity: Math.PI * .2 })
    const platform = new Platform({ pos: [0, -10, 0], axis: 'x', range: 29, randomDirChange: true })
    const stars = new Stars({ minRadius: 150, minVelocity: 0.25, maxVelocity: 1.5 })

    this.jupiter = createJupiter({ r: 5 })
    this.jupiter.position.set(-125, 25, -80)
    this.moon = createSphere({ r: 1.5, file: 'planets/moon.jpg' })
    this.saturn = createSaturn({ r: 3 })
    this.saturn.position.set(85, 20, -50)

    this.arcology = await loadModel({ file: 'space/arcology-ring/model.fbx', scale: .5, shouldCenter: true })
    this.arcology.position.z = -100
    this.addMesh(this.jupiter, this.saturn, this.moon, moonLight, this.arcology)

    this.lander = new Lander({ platform })
    this.add(this.lander, stars, platform)
  }

  reset() {
    this.ui.clear()
    this.lander.reset()
  }

  /* LOOP */

  sceneUI() {
    const points = this.lander.hasLanded ? this.lander.fuel : 0
    return /* html */`
      <div class="top-left">
        Score: ${points}
        <br><small>Fuel left: ${this.lander.fuel}</small>
      </div>
    `
  }

  update(dt, time) {
    super.update(dt)

    this.arcology?.rotateY(dt * .02)
    this.jupiter.rotateY(dt * .2)
    this.moon.rotateY(dt)
    orbitAround({ moon: this.moon, planet: this.jupiter, time: time * .75 })

    if (this.lander.hasLanded) this.victory ('Nice landing!')
    if (this.lander.broken) this.defeat('Landing failure!')
    if (this.lander.outOfFuel) this.defeat('Out of fuel, platform missed!')
    if (this.lander.lost) this.defeat('Lost in space!')
  }
}
