import Stage3D from '../Stage3D.js'
import Body from '/core/gameplay/bodies/Body.js'
import Parachutist, * as parachutistModule from '/core/gameplay/bodies/characters/Parachutist.js'
import CoverSoldier, * as coverSoldierModule from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import Transport, * as transportModule from '/core/gameplay/bodies/aircraft/Transport.js'
import ParachutistSprite, { parachutistArt } from '/core3d/actor/soldiers/ParachutistSprite.js'
import CoverSoldierSprite, { coverSoldierArt } from '/core3d/actor/soldiers/CoverSoldierSprite.js'
import TransportSprite, { transportArt } from '/core3d/actor/aircraft/TransportSprite.js'
import { loadPixelArt } from '/core3d/assets/pixelArt.js'
import { requestModels } from '/core3d/assets/models.js'
import Church, * as churchModule from '/core3d/actor/buildings/Church.js'
import Ju52, * as ju52Module from '/core3d/actor/aircraft/Ju52.js'

const game = 'Raid on Drvar (u izradi)'

export const props = [{
  id: 'drvar-crkva', name: 'Crkva', game, block: churchModule, stage: Stage3D,
  catalogGroup: ['Ambijent', 'Drvar'],
  description: 'Kamena crkva prema fotografiji iz Drvara: dvovodni krov i četvrtast zvonik. Visina je procenjenih 11 metara.',
  create: async stage => {
    await requestModels(churchModule.models)
    const church = new Church()
    stage.add(church)
    return church
  },
}]
/** Metres above the floor a paratrooper starts from, high enough to watch him sink for a few seconds. */
const dropHeight = 25
/** The height of the cover the soldier is sent to, in metres; the catalog draws no cover. */
const coverHeight = 1.1
/** What the soldier fires at: it takes his hits and never dies, so his burst goes on until it is stopped. */
const standIn = new Body({ health: 1e9 })

const soldierCommands = [
  { label: 'Iza zaklona', run: block => block.moveTo({ x: block.x + 3, z: block.z, cover: coverHeight }) },
  { label: 'Na otvoreno', run: block => block.moveTo({ x: block.x - 3, z: block.z }) },
  { label: 'Puca', run: block => block.fireAt(standIn) },
  { label: 'Prekida vatru', run: block => block.ceaseFire() },
]

export const soldiers = [
  {
    id: 'nemacki-padobranac', name: 'Nemački padobranac', game, block: parachutistModule, stage: Stage3D, dimension: '2d',
    description: 'Pada pod kupolom; pogađa se čovek, ne kupola. Posle sletanja ga igra prikazuje kao vojnika spreda.',
    create: async stage => {
      const body = new Parachutist({ y: dropHeight, drift: { x: .6, z: 0 } })
      stage.add(body, new ParachutistSprite(body, { texture: await loadPixelArt(parachutistArt.pictures[0]) }))
      return body
    },
  },
  {
    id: 'nemacki-vojnik-spreda', name: 'Nemački vojnik spreda', game, block: coverSoldierModule, stage: Stage3D, dimension: '2d',
    commands: soldierCommands,
    description: 'Vojnik iz Neretve kao uspravljena slika. Iza zaklona se vidi samo dok nišani i puca; zaklon se ovde ne crta.',
    create: async stage => {
      const [whole, upper] = await Promise.all([loadPixelArt(coverSoldierArt.whole), loadPixelArt(coverSoldierArt.upper)])
      const body = new CoverSoldier({ y: coverSoldierModule.coverSoldier.size.height / 2 })
      stage.add(body, new CoverSoldierSprite(body, { whole, upper }))
      return body
    },
  },
]

export const aircraft3d = [
  {
    id: 'junkers-ju-52-model', name: 'Junkers Ju 52', game, block: ju52Module, stage: Stage3D,
    create: async stage => {
      await requestModels(ju52Module.models)
      const body = new Transport({ y: 20 })
      stage.add(body, new Ju52(body))
      return body
    },
  },
]

export const aircraft = [
  {
    id: 'junkers-ju-52', name: 'Junkers Ju 52', game, block: transportModule, stage: Stage3D, dimension: '2d',
    description: 'Transportni avion desanta, nacrtan sa strane; leti pravo, a nos mu je uvek okrenut kuda leti. Padobrance izbacuje igra.',
    create: async stage => {
      const body = new Transport({ x: -40, y: 20 })
      stage.add(body, new TransportSprite(body, { texture: await loadPixelArt(transportArt.picture), camera: stage.camera }))
      return body
    },
  },
]
