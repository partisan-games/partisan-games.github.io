import { tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import profiles from './battlefieldTankProfiles.js'
import vehicleArt from './vehicleArt.js'

const folder = 'game-ready/tenkovi/'

export const germanTank = {
  id: 'tiger-i', name: 'Tigar I', kind: tankKinds.german, art: vehicleArt.germanTank, facing: -1,
  barrel: { src: folder + 'nemacki-tenk-cev-pixel.webp', facing: -1 },
}

export const somuaTank = {
  id: 'somua-s35', name: 'Somua S35', kind: tankKinds.somua, art: vehicleArt.somuaS35, facing: -1,
  barrel: { src: folder + 'somua-s35-barrel.webp', facing: -1, crop: [126, 203, 1923, 309] },
}

/** Historical profiles use their own barrel, track loop, turret layers and final wreck frame. */
function profile(id, name, rearAim = true) {
  const { kind, frame } = profiles[id]
  return { id, name, kind, rearAim, facing: -1, barrel: { src: folder + id + '-barrel.webp', facing: -1 },
    art: { src: folder + id + '-layers.webp', damageSrc: folder + id + '-armor-hits.webp',
      frame, columns: 4, clips: vehicleArt.germanTank.clips, wreckRow: 6, gutter: 4 } }
}

export const m15 = profile('m15-42', 'M15/42')
export const stug = profile('stug-iii', 'StuG III', false)
export const hotchkiss = profile('hotchkiss', 'Hotchkiss')
