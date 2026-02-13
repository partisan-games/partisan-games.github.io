import Scena3D from '/core/Scena3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight } from '/core3d/light.js'
import { SorceressPlayer } from '/core3d/actor/derived/fantasy/Sorceress.js'
import { GolemAI } from '/core3d/actor/derived/fantasy/Golem.js'
import { getEmptyCoords, createOrbitControls } from '/core3d/helpers.js'

const mapSize = 100

export default class extends Scena3D {
  constructor() {
    super({
      toon: true,
      intro: 'Gather your followers',
      uiStyle: 'rpg',
    })
  }

  async init() {
    const coords = getEmptyCoords({ mapSize })

    ambLight({ scene: this.scene })
    this.camera.position.set(0, 10, 15)
    this.controls = createOrbitControls(this.camera, this.renderer.domElement)

    this.addMesh(createFloor({ size: mapSize }))

    const player = new SorceressPlayer()
    this.add(player)

    for (let i = 0; i < 10; i++) {
      const ai = new GolemAI({ mapSize, pos: coords.pop(), baseState: 'follow', target: player.mesh })
      this.add(ai)
    }
  }

  sceneUI(t) {
    return this.ui.scoreUI('Vreme', Math.floor(t))
  }
}
