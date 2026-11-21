import { keys } from '/core/io/keys.js'
import { thirdPersonControls, orbitControls } from '/ui/Controls.js'
import Scene3D from '/core/Scene3D.js'
import { createFloor } from '/core3d/ground.js'
import { ambLight } from '/core3d/light.js'
import { description as sorceress, models as sorceressModels } from '/core3d/actor/derived/fantasy/Sorceress.js'
import { description as golem, models as golemModels } from '/core3d/actor/derived/fantasy/Golem.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import CharacterAI, { characterAI } from '/core/gameplay/controllers/CharacterAI.js'
import { icons } from '/core/io/icons.js'
import { requestModels } from '/core3d/assets/models.js'
import { getEmptyCoords, createOrbitControls } from '/core3d/helpers.js'

const ZADATO_VREME = 120
const mapSize = 100
const golemsNum = 10

export default class FollowScene extends Scene3D {
  constructor() {
    super({
      toon: true,
      controlKeys: { ...thirdPersonControls, ...orbitControls, [keys.attack2.label]: 'secondary attack' },
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

    const bounds = { min: { x: -mapSize / 2, z: -mapSize / 2 }, max: { x: mapSize / 2, z: mapSize / 2 } }
    // the orbiting camera stays the scene's own
    this.player = leadCharacter(this, sorceress, { bounds, input: { buttonDict: { attack: icons.magic, attack2: icons.magic } },
      view: { camera: null } }).body
    for (let i = 0; i < golemsNum; i++) {
      const { x, z } = coords.pop()
      const { body, model } = makeCharacter(golem, { x, z, bounds, targets: [this.player] })
      this.controllers.push(new CharacterAI(body, { target: this.player, way: 'follow' }))
      this.add(body, model)
      this.golems.push(body)
    }
  }

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return this.ui.scoreUI('Followers', this.followers.length, 'Time left', preostalo)
  }

  update(dt, t) {
    super.update(dt, t)
    if (t > ZADATO_VREME) this.defeat('Your time is up.')

    const { x, z } = this.player
    this.followers = this.golems.filter(golem => Math.hypot(golem.x - x, golem.z - z) < characterAI.followDistance * 2)
    if (this.followers.length === golemsNum) this.victory(`You have gathered your army of followers in ${Math.floor(t)} seconds.`)
  }
}
