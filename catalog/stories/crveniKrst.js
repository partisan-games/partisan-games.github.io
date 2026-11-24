import Stage3D from '../Stage3D.js'
import * as campModule from '/core3d/actor/buildings/CampProp.js'

const gateCommands = [{ label: 'Otvori/zatvori kapiju', run: block => block.toggleGate() }]
const lightCommands = [
  { label: 'Upali/ugasi reflektor', run: block => block.toggleLight() },
  { label: 'Pokreni/zaustavi reflektor', run: block => block.toggleSweep() },
]

const entries = [
  ['sklop', 'Crveni krst · zajednički sklop', [...gateCommands, ...lightCommands]],
  ['storehouse', 'Crveni krst · zidana zgrada'],
  ['fence-straight', 'Crveni krst · žičana ograda'],
  ['fence-corner', 'Crveni krst · ugao ograde'],
  ['fence-terminal', 'Crveni krst · završni stub'],
  ['gate', 'Crveni krst · kapija', gateCommands],
  ['timber-screen', 'Crveni krst · drveni zaklon'],
  ['watchtower', 'Crveni krst · kula sa reflektorom', lightCommands],
]

export const props = entries.map(([kind, name, commands]) => ({
  id: kind, name, game: 'Escape Enemy Base · priprema ambijenta', block: campModule, stage: Stage3D,
  catalogGroup: ['Ambijent', 'Crveni krst'], commands,
  description: 'Originalan art u metrima, sa procenjenim razmerama. Probni sklop nije istorijski tlocrt niti novi raspored nivoa.',
  create: async stage => {
    const block = kind === 'sklop' ? await campModule.createCampStudy() : await campModule.createCampProp(kind)
    stage.add(block)
    return block
  },
}))
