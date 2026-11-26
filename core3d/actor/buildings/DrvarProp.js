import { loadedModel } from '/core3d/assets/models.js'

const ruin = (file, size) => ({ file: `building/ruins/${file}.glb`, size, fitVisible: true, receiveShadow: true })

export const drvarProps = {
  'wall-corner': { name: 'Ugao porušenog zida', model: ruin('wall-corner', 3.4) },
  'wall-fragment': { name: 'Ostatak kamenog zida', model: ruin('wall-fragment', 2.7) },
  'wall-breach': { name: 'Razrušeni zid', model: ruin('wall-breach', 3.1) },
  'stone-house': { name: 'Porušena kamena kuća', model: ruin('drvar-stone-house', 5.9) },
  'collapsed-house': { name: 'Kamena kuća sa urušenim krovom', model: ruin('drvar-collapsed-house', 5.9) },
}

export const models = Object.values(drvarProps).map(({ model }) => model)

export default class DrvarProp {
  constructor(kind) {
    this.mesh = loadedModel(drvarProps[kind].model).clone(true)
  }
}
