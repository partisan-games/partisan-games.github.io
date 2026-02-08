import Scena3D from '/core/Scena3D.js'
import { baseControls } from '/ui/Controls.js'
import Planet from '/core3d/geometry/Planet.js'
import { createTerrain, shake } from '/core3d/ground.js'
import { Stars } from '/core3d/Particles.js'
import { createMoon } from '/core3d/light.js'
import { getEmptyCoords } from '/core3d/helpers.js'
import Avatar from '/core3d/actor/Avatar.js'
import Platform from '/core3d/objects/Platform.js'

export default class extends Scena3D {
  constructor(manager) {
    super(manager, {
      controlKeys: { ...baseControls, Space: 'jump' },
    })
  }

  async init() {
    this.bojaPozadine = 0x000000
    this.addMesh(createMoon())

    this.planets = []
    const mapSize = 400
    const coords = getEmptyCoords({ mapSize: mapSize / 2, fieldSize: 30 })

    coords.forEach((pos, i) => {
      pos.y = Math.random() * 10 + 5
      const planet = Math.random() > .25 ? new Planet({ pos, i }) : new Platform({ pos })
      this.planets.push(planet)
      this.add(planet)
    })

    this.terrain = createTerrain({ size: mapSize, wireframe: true })
    this.addMesh(this.terrain)

    this.stars = new Stars({ num: 10000, minVelocity: 5, maxVelocity: 30 })
    this.add(this.stars)

    const solids = [...this.planets.map(o => o.mesh), this.terrain]
    this.player = new Avatar({ solids, camera: this.camera, skin: 'DISCO', showHealthBar: false, jumpStyle: 'FLY' })
    this.add(this.player)
  }

  /* LOOP */

  update(delta, time) {
    super.update(delta)
    shake({ geometry: this.terrain.geometry, time })
  }
}
