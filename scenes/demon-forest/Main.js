import Scene3D from '/core/Scene3D.js'
import { thirdPersonControls } from '/ui/Controls.js'
import { keys } from '/core/io/keys.js'
import { createTrees } from '/core3d/geometry/trees.js'
import { description as demon, models as demonModels } from '/core3d/actor/derived/fantasy/Demon.js'
import leadCharacter from '/core3d/actor/characters/leadCharacter.js'
import worldQueries from '/core3d/actor/characters/worldQueries.js'
import { icons } from '/core/io/icons.js'
import { createGround } from '/core3d/ground.js'
import { createSun } from '/core3d/light.js'
import { requestModels } from '/core3d/assets/models.js'

export default class DemonForestScene extends Scene3D {
  constructor() {
    super({
      controlKeys: { ...thirdPersonControls, [keys.special.label]: 'special' },
      toon: true,
    })
  }

  async init() {
    await requestModels([...demonModels])
    this.addMesh(createGround({ file: 'terrain/ground.jpg' }))
    const sun = createSun()
    this.addMesh(sun)
    const trees = createTrees()
    this.addMesh(trees)

    leadCharacter(this, demon, { ...worldQueries(trees), input: { buttonDict: { jump: '', attack: icons.unarmed, special: icons.magic } } })
  }
}
