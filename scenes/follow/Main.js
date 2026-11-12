import Scena3D from '/core/Scena3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight } from '/core3d/light.js'
import { SorceressPlayer, models as sorceressModels } from '/core3d/actor/derived/fantasy/Sorceress.js'
import { GolemAI, models as golemModels } from '/core3d/actor/derived/fantasy/Golem.js'
import { requestModels } from '/core3d/assets/models.js'
import { getEmptyCoords, createOrbitControls } from '/core3d/helpers.js'

const ZADATO_VREME = 120
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
    await requestModels([...sorceressModels, ...golemModels])
    this.golems = []
    this.followers = []
    const coords = getEmptyCoords({ mapSize })

    ambLight({ scene: this.scene })
    this.camera.position.set(0, 10, 15)
    this.controls = await createOrbitControls(this.camera, this.renderer.domElement)

    this.addMesh(createFloor({ size: mapSize * 2 }))

    this.player = new SorceressPlayer({ useComposedMovement: true })
    this.add(this.player)
    for (let i = 0; i < golemsNum; i++) {
      const ai = new GolemAI({ mapSize, pos: coords.pop(), baseState: 'follow', target: this.player.mesh, useComposedMovement: true })
      this.add(ai)
      this.golems.push(ai)
    }
  }

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return this.ui.scoreUI('Followers', this.followers.length, 'Time left', preostalo)
  }

  update(dt, t) {
    super.update(dt, t)
    if (t > ZADATO_VREME) this.defeat('Your time is up.')

    this.followers = this.golems.filter(golem => golem.distanceTo(this.player.mesh) < golem.followDistance * 2)
    if (this.followers.length === golemsNum) this.victory(`You have gathered your army of followers in ${Math.floor(t)} seconds.`)
  }
}
