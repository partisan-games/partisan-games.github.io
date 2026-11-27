import Stage3D from '../Stage3D.js'
import * as campModule from '/core3d/actor/buildings/CampProp.js'
import Church, * as churchModule from '/core3d/actor/buildings/Church.js'
import DrvarProp, * as drvarModule from '/core3d/actor/buildings/DrvarProp.js'
import FacadeHouse, * as facadeModule from '/core3d/actor/buildings/FacadeHouse.js'
import Milutin, * as monumentModule from '/core3d/actor/buildings/Milutin.js'
import { requestModels } from '/core3d/assets/models.js'
import Sandbags, * as sandbagsModule from '/core3d/actor/buildings/Sandbags.js'
import TownHouse, * as townHouseModule from '/core3d/actor/buildings/TownHouse.js'
import WarDebris, { hasTruckWreck, TruckDebris } from '/core3d/actor/buildings/WarDebris.js'
import * as warDebrisModule from '/core3d/actor/buildings/WarDebris.js'
import Tree, * as treeModule from '/core3d/actor/nature/Tree.js'

/** The props of a camp, each with its group by what it is, so any game can take the same one. */
const camp = [
  ['sklop', 'Logor', 'Sklopovi'],
  ['storehouse', 'Zidana zgrada', 'Zgrade'],
  ['watchtower', 'Kula sa reflektorom', 'Zgrade'],
  ['fence-straight', 'Žičana ograda', 'Ograde i kapije'],
  ['fence-corner', 'Ugao ograde', 'Ograde i kapije'],
  ['fence-terminal', 'Završni stub ograde', 'Ograde i kapije'],
  ['gate', 'Kapija', 'Ograde i kapije'],
  ['timber-screen', 'Drveni zaklon', 'Zakloni'],
].map(([kind, name, group]) => ({
  id: kind, name, game: 'Escape Concentration Camp', block: campModule, stage: Stage3D,
  catalogGroup: ['Scenografija', group],
  create: async stage => {
    const block = kind === 'sklop' ? await campModule.createCampStudy() : await campModule.createCampProp(kind)
    stage.add(block)
    return block
  },
}))

const church = {
  id: 'drvar-crkva', name: 'Crkva', game: 'Raid on Drvar (u izradi)', block: churchModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Zgrade'],
  create: async stage => {
    await requestModels(churchModule.models)
    const block = new Church()
    stage.add(block)
    return block
  },
}

const milutin = {
  id: 'kraljevo-milutin', name: 'Spomenik srpskim ratnicima (Milutin)', game: 'Siege of Kraljevo', block: monumentModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Zgrade'],
  create: async stage => {
    await requestModels(monumentModule.models)
    const block = new Milutin()
    stage.add(block)
    return block
  },
}

const sandbags = {
  id: 'sandbags', name: 'Džakovi sa peskom', game: 'Escape Concentration Camp', block: sandbagsModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Zakloni'],
  create: async stage => {
    await requestModels(sandbagsModule.models)
    const block = new Sandbags()
    stage.add(block)
    return block
  },
}

const facadeHouse = {
  id: 'kuca-sa-fasadom', name: 'Kuća sa fasadom', game: 'Siege of Kraljevo', block: facadeModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Kuće grada'], lookLabel: 'Fasada',
  // a picture, a front or the back, on every wall, so each shows from any side
  looks: [
    ...Object.entries(facadeModule.facades).map(([id, { name }]) => ({ id, name, value: { facade: id, side: 4 } })),
    { id: 'zadnja', name: 'Zadnja', value: { facade: 'white', side: 5 } },
  ],
  create: async(stage, way, { facade, side }) => {
    const block = new FacadeHouse({ facade })
    const { material } = block.mesh
    for (const wall of [0, 1, 4, 5]) material[wall].map = material[side].map
    stage.add(block)
    return block
  },
}

/** The houses and ruins of a small town, each alone. */
const town = Object.entries(townHouseModule.townHouses).map(([kind, { name }]) => ({
  id: `grad-${kind}`, name, game: 'Raid on Drvar (u izradi)', block: townHouseModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Kuće grada'],
  create: async stage => {
    await requestModels([townHouseModule.modelOf(kind)])
    const block = new TownHouse(kind)
    stage.add(block)
    return block
  },
}))

/** What the war leaves on the ground, each alone. */
const debris = Object.entries(warDebrisModule.warDebris).map(([kind, { name, model }]) => ({
  id: `rat-${kind}`, name, game: 'Raid on Drvar (u izradi)', block: warDebrisModule, stage: Stage3D,
  catalogGroup: model.file.startsWith('vehicle/') ? ['Vozila'] : ['Scenografija', 'Tragovi rata'],
  create: async stage => {
    await requestModels([model])
    const block = hasTruckWreck(kind) ? new TruckDebris(kind) : new WarDebris(kind)
    stage.add(block)
    return block
  },
}))

/** The trees of the countryside, each alone. */
const trees = Object.entries(treeModule.trees).map(([kind, { name, model }]) => ({
  id: `drvo-${kind}`, name, game: kind === 'linden' ? 'Siege of Kraljevo' : 'Raid on Drvar (u izradi)', block: treeModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Drveće'],
  create: async stage => {
    await requestModels([model])
    const block = new Tree(kind)
    stage.add(block)
    return block
  },
}))

const ruins = Object.entries(drvarModule.drvarProps).map(([kind, { name, model }]) => ({
  id: `drvar-${kind}`, name, game: 'Raid on Drvar (u izradi)', block: drvarModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Tragovi rata'],
  create: async stage => {
    await requestModels([model])
    const block = new DrvarProp(kind)
    stage.add(block)
    return block
  },
}))

export const props = [...camp, church, milutin, sandbags, facadeHouse, ...town, ...debris, ...trees, ...ruins]
