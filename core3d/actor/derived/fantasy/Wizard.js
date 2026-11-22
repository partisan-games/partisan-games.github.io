const animDict = {
  idle: 'Standing Idle',
  walk: 'Iv Pole Walking',
  attack: 'Standing 1H Magic Attack 01',
  death: 'Dying',
}

const meshModel = { file: 'model.fbx', angle: Math.PI, animDict, prefix: 'character/wizard/', size: 1.8, texture: 'terrain/snow.jpg',
  sharedClips: { 'Standing 1H Magic Attack 01': 'character/sorceress/Standing 1H Magic Attack 01.fbx', Dying: 'character/soldier/Dying.fbx' } }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel]

/** How it looks, sounds and acts, for a character made of a body and its model. */
export const description = { model: meshModel, animDict, flame: { kinds: ['attack'], fromBlow: true }, body: { speed: .75, reach: 3 } }
