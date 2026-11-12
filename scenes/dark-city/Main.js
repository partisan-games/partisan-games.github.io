// https://codepen.io/MAKIO135/pen/vmBzMv
import Scena3D, { bojeNeba } from '/core/Scena3D.js'
import CityMorph from './CityMorph.js'
import { createFloor } from '/core3d/ground.js'
import { createBuilding, createBuildingTexture } from '/core3d/city.js'
import { createMoon } from '/core3d/light.js'

const mapSize = 400

export default class extends Scena3D {
  constructor() {
    super({ toon: true, showControls: false, bojaPlatna: bojeNeba.modra })
  }

  init() {
    this.buildings = []
    this.camera.position.set(0, mapSize * .33, mapSize * .9)

    this.addMesh(createMoon({ pos: [150, 150, 50] }))

    const floor = createFloor({ size: 600, color: 0x303038 })
    this.addMesh(floor)

    for (let i = 0; i < 100; i++) {
      const building = createBuilding({ width: 10, height: 10, map: createBuildingTexture({ night: true }) })
      this.buildings.push(building)
      this.addMesh(building)
    }

    this.morph = new CityMorph({ buildings: this.buildings, clock: this.session.presentationClock })
    this.session.scope.add(() => this.morph.end())
    this.grow()
    document.addEventListener('pointerdown', this.grow)
    this.session.scope.add(() => document.removeEventListener('pointerdown', this.grow))
    this.session.gameplay.after(2, () => this.ui.showMessage('Click to morph city'))
  }

  grow = () => {
    if (this.session.active) this.morph.grow(mapSize)
  }

  update(dt) {
    super.update(dt)
    this.morph.update()
  }

}
