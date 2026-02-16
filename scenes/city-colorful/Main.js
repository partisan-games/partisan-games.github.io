import Scena3D from '/core/Scena3D.js'
import { createFloor } from '/core3d/ground.js'
import { createCity, createCityLights } from '/core3d/city.js'
import { hemLight, createMoon } from '/core3d/light.js'
import { createOrbitControls } from '/core3d/helpers.js'

const mapSize = 300
const numBuildings = 200

export default class extends Scena3D {
  constructor() {
    super({ toon: true })
  }

  async init() {
    this.bojaPozadine = 0x000000
    hemLight({ scene: this.scene })
    this.controls = await createOrbitControls(this.camera, this.renderer.domElement)
    this.controls.autoRotate = true
    this.camera.position.set(0, mapSize * .6, mapSize * 1.1)

    const floor = createFloor({ size: mapSize * 1.2, color: 0x505050 })

    const city = createCity({ numBuildings, mapSize, rotateEvery: 3, addWindows: true })
    const moon = createMoon({ pos: [50, 150, 50] })
    this.addMesh(floor, city, moon)

    this.addMesh(createCityLights({ numLights: 5 }))
  }
}
