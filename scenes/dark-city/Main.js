// https://codepen.io/MAKIO135/pen/vmBzMv
import Scena3D, { bojeNeba } from '/core/Scena3D.js'
import TWEEN from 'three/examples/jsm/libs/tween.module.js'
import { createFloor } from '/core3d/ground.js'
import { createBuilding, createBuildingTexture } from '/core3d/city.js'
import { createMoon } from '/core3d/light.js'

const mapSize = 400

export default class extends Scena3D {
  constructor() {
    super({ toon: true, showControls: false, bojaPlatna: bojeNeba.modra })

    document.addEventListener('pointerdown', () => this.grow())
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

    this.grow()
    setTimeout(() => this.ui.showMessage('Click to morph city'), 2000)
  }

  grow() {
    this.buildings.forEach(building => {
      const y = 1 + Math.random() * 20 + (Math.random() < 0.1 ? 15 : 0)

      new TWEEN.Tween(building.scale)
        .to({
          x: 1 + Math.random() * 3,
          y,
          z: 1 + Math.random() * 3,
        })
        .start()

      new TWEEN.Tween(building.position)
        .to({
          x: -mapSize * .5 + Math.random() * mapSize,
          z: -mapSize * .5 + Math.random() * mapSize,
          y: y / 2,
        })
        .start()
    })
  }

  update(dt) {
    super.update(dt)
    TWEEN.update()
  }

}
