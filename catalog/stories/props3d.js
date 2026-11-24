import Stage3D from '../Stage3D.js'
import * as campModule from '/core3d/actor/buildings/CampProp.js'
import Church, * as churchModule from '/core3d/actor/buildings/Church.js'
import { requestModels } from '/core3d/assets/models.js'

const gateCommands = [{ label: 'Otvori/zatvori kapiju', run: block => block.toggleGate() }]
const lightCommands = [
  { label: 'Upali/ugasi reflektor', run: block => block.toggleLight() },
  { label: 'Pokreni/zaustavi reflektor', run: block => block.toggleSweep() },
]

/** The props of a camp, each with its group by what it is, so any game can take the same one. */
const camp = [
  ['sklop', 'Logor', 'Sklopovi', [...gateCommands, ...lightCommands]],
  ['storehouse', 'Zidana zgrada', 'Zgrade'],
  ['watchtower', 'Kula sa reflektorom', 'Zgrade', lightCommands],
  ['fence-straight', 'Žičana ograda', 'Ograde i kapije'],
  ['fence-corner', 'Ugao ograde', 'Ograde i kapije'],
  ['fence-terminal', 'Završni stub ograde', 'Ograde i kapije'],
  ['gate', 'Kapija', 'Ograde i kapije', gateCommands],
  ['timber-screen', 'Drveni zaklon', 'Zakloni'],
].map(([kind, name, group, commands]) => ({
  id: kind, name, game: 'Escape Enemy Base', block: campModule, stage: Stage3D,
  catalogGroup: ['Scenografija', group], commands,
  description: 'Originalan art u metrima, sa procenjenim razmerama. Probni sklop nije istorijski tlocrt niti novi raspored nivoa.',
  create: async stage => {
    const block = kind === 'sklop' ? await campModule.createCampStudy() : await campModule.createCampProp(kind)
    stage.add(block)
    return block
  },
}))

const church = {
  id: 'drvar-crkva', name: 'Crkva', game: 'Raid on Drvar (u izradi)', block: churchModule, stage: Stage3D,
  catalogGroup: ['Scenografija', 'Zgrade'],
  description: 'Kamena crkva prema fotografiji iz Drvara: dvovodni krov i četvrtast zvonik. Visina je procenjenih 11 metara.',
  create: async stage => {
    await requestModels(churchModule.models)
    const block = new Church()
    stage.add(block)
    return block
  },
}

export const props = [...camp, church]
