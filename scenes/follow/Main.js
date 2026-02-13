import Scena3D from '/core/Scena3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight } from '/core3d/light.js'
import { SorceressPlayer } from '/core3d/actor/derived/fantasy/Sorceress.js'
import { GolemAI } from '/core3d/actor/derived/fantasy/Golem.js'
import { getEmptyCoords, createOrbitControls } from '/core3d/helpers.js'

const mapSize = 100
const golemsNum = 10

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      intro: 'Gather your followers',
      uiStyle: 'rpg',
    })
  }

  async init() {
    this.golems = []
    this.followers = []
    const coords = getEmptyCoords({ mapSize })
    this.bojaPlatna = 'linear-gradient(to bottom, #94c5f8 1%, #a6e6ff 70%, #b1b5ea 100%)'

    ambLight({ scene: this.scene })
    this.camera.position.set(0, 10, 15)
    this.controls = createOrbitControls(this.camera, this.renderer.domElement)

    this.addMesh(createFloor({ size: mapSize * 2 }))

    this.player = new SorceressPlayer()
    this.add(this.player)
    for (let i = 0; i < golemsNum; i++) {
      const ai = new GolemAI({ mapSize, pos: coords.pop(), baseState: 'follow', target: this.player.mesh })
      this.add(ai)
      this.golems.push(ai)
    }
  }

  sceneUI(t) {
    return this.ui.scoreUI('Vreme', Math.floor(t), 'Broj sledbenika', this.followers.length)
  }

  update(dt, t) {
    super.update(dt, t)
    this.followers = this.golems.filter(golem => golem.distanceTo(this.player.mesh) < golem.followDistance * 2)
    if (this.followers.length === golemsNum) this.victory(`You have gathered your army of followers in ${Math.floor(t)} seconds.`)
  }
}
