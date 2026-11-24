import Scene3D from '/core/Scene3D.js'
import { skyGradients } from '/core/constants.js'
import { avatarControls } from '/ui/Controls.js'
import Planet from '/core3d/geometry/Planet.js'
import { createTerrain, shake } from '/core3d/ground.js'
import { Stars } from '/core3d/Particles.js'
import { createMoon } from '/core3d/light.js'
import { getEmptyCoords } from '/core3d/helpers.js'
import makeAvatar from '/core3d/actor/characters/Avatar.js'
import { lead } from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import Platform from '/core3d/objects/Platform.js'

export default class AvatarPlanetsScene extends Scene3D {
  constructor() {
    super({
      controlKeys: avatarControls,
      canvasBackground: skyGradients.mrkla,
      toon: false,
    })
  }

  async init() {
    const moon = createMoon()

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
    this.addMesh(this.terrain, moon)

    this.stars = new Stars({ num: 10000, minVelocity: 5, maxVelocity: 30 })

    const solids = [...this.planets.map(o => o.mesh), this.terrain, moon]
    this.player = lead(this, makeAvatar({ skin: 'DISCO', ...worldQueries(solids) }),
      { input: { buttonDict: { jump: '' } }, view: { showHealthBar: false, distance: 4, speed: 4 } }).body
    this.add(this.stars)
  }

  update(delta, time) {
    super.update(delta)
    shake({ geometry: this.terrain.geometry, time })
  }
}
