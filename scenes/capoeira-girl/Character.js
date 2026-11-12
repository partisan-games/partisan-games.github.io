import Player from '/core3d/actor/Player.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = { idle: 'Ginga', walk: 'Dwarf Walk', run: 'Fast Run', attack: 'Benção', jump: 'Aú sem mão' }
export const model = { prefix: 'character/huntress/', file: 'capoeira-girl.fbx', animDict, axis: [0, 1, 0], angle: Math.PI }

export default class CapoeiraGirl extends Player {
  constructor(props = {}) {
    const mesh = loadedModel(model)
    super({ mesh, animations: mesh.userData.animations, animDict, buttonDict: { attack: '💥', jump: '' }, ...props })
  }
}
