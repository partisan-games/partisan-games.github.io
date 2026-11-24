import { description as basePartisan, partisanOutfits } from './Partisan.js'
import { description as partisan } from './PartisanAim.js'
import { description as machineGunner } from './GermanMachineGunner.js'
import { description as resistance } from './ResistanceFighter.js'
import { description as soviet } from './SovietPartisan.js'
import { description as simple } from './PartisanLowpoly.js'

const size = { fitVisible: true, size: 1.74 }
export const regular = { ...basePartisan.model, ...size, animDict: { walk: 'Rifle Walk', death: 'Crouch Death' } }
export const resistanceFighterModel = { ...resistance.model, ...size, animDict: {} }
export const riflemanModel = { ...soviet.model, ...size, animDict: { fire: 'Fire Rifle Crouch', burst: 'Crouch Rapid Fire' } }
export const lowpoly = { ...simple.model, ...size, animDict: {} }
export const rifleModel = basePartisan.twoHandedWeapon

const rifle = { model: rifleModel, rounds: 1 }
const berthier = { model: partisan.twoHandedWeapon, rounds: 1 }
const mg = { model: machineGunner.twoHandedWeapon, rounds: 3 }
const mp40 = { model: { file: 'weapon/machine-gun/model.fbx', scale: .01 }, rounds: 3 }
export const infantryWeapons = { rifle, berthier, mg, mp40 }
export const infantryBody = { animDict: basePartisan.animDict, body: basePartisan.body }
// Material slots in the original soldier FBXs keep fabric, equipment and faces separate.
const shirt = 'mat_15-27374EA0.jpg', trousers = 'mat_9-27375500.jpg', face = 'mat_12-27374460.jpg'
const cap = 'mat_11-27373E00.jpg'
const indigo = 'indigo-work-shirt.jpg', wool = 'brown-wool-shirt.jpg', moustache = 'partisan-moustache.jpg'

export const variants = {
  strelac: { name: 'Rifleman', model: regular, weapon: rifle, outfit: partisanOutfits.wool },
  smedji: { name: 'Brown uniform · Berthier', model: lowpoly, weapon: berthier, outfit: { 'army.green': 0x665541, avocado: 0x40372f } },
  mitraljezac: { name: 'Machine gunner', model: riflemanModel, weapon: mg },
  vuna: { name: 'Wool shirt · rifle', model: resistanceFighterModel, weapon: rifle, outfit: { [shirt]: wool, [trousers]: 0xc7ac82 } },
  indigo: { name: 'Blue shirt · moustache', model: resistanceFighterModel, weapon: berthier, portrait: 'moustache', outfit: { [shirt]: indigo, [face]: moustache } },
  zimski: { name: 'Dark olive uniform · machine gun', model: lowpoly, weapon: mg, hatColor: 0x343a27, outfit: { 'army.green': 0x3d422d, avocado: 0x303626 } },
  maslinasti: { name: 'Olive uniform · MP40', model: lowpoly, weapon: mp40, outfit: { 'army.green': 0x4d5037, avocado: 0x777253 } },
  brkovi: { name: 'Grey cap · moustache', model: resistanceFighterModel, weapon: berthier, portrait: 'moustache', outfit: { [cap]: 0x8b9096, [trousers]: 0x858a93, [face]: moustache } },
  sivi: { name: 'Grey shirt · MP40', model: resistanceFighterModel, weapon: mp40, outfit: { [shirt]: 0x89929a, [trousers]: 0x90999c } },
  oker: { name: 'Ochre shirt · rifle', model: resistanceFighterModel, weapon: rifle, outfit: { [shirt]: 0xb29a69, [cap]: 0xa18b65, [trousers]: 0xc1af90 } },
}

export const infantryModels = [...new Set(Object.values(variants).flatMap(({ model, weapon }) => [model, weapon.model]))]
