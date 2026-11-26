import Stage3D from '../Stage3D.js'
import Body from '/core/gameplay/bodies/Body.js'
import Parachutist, * as parachutistModule from '/core/gameplay/bodies/characters/Parachutist.js'
import CoverSoldier, * as coverSoldierModule from '/core/gameplay/bodies/soldiers/CoverSoldier.js'
import Transport, * as transportModule from '/core/gameplay/bodies/aircraft/Transport.js'
import ParachutistSprite, { parachutistArt } from '/core3d/actor/soldiers/ParachutistSprite.js'
import CoverSoldierSprite, { coverSoldierArt } from '/core3d/actor/soldiers/CoverSoldierSprite.js'
import CoverSoldierModel, * as coverSoldierModelModule from '/core3d/actor/soldiers/CoverSoldierModel.js'
import TransportSprite, { transportArt } from '/core3d/actor/aircraft/TransportSprite.js'
import { loadPixelArt } from '/core3d/assets/pixelArt.js'
import { loadedModel, requestModels } from '/core3d/assets/models.js'
import * as gliderModule from '/core3d/actor/aircraft/Dfs230.js'
import Ju52, * as ju52Module from '/core3d/actor/aircraft/Ju52.js'

const game = 'Raid on Drvar (u izradi)'

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
    create: async stage => {
      const body = new Parachutist({ y: dropHeight, drift: { x: .6, z: 0 } })
      stage.add(body, new ParachutistSprite(body, { texture: await loadPixelArt(parachutistArt.picture) }))
      return body
    },
  },
  {
    id: 'nemacki-vojnik-spreda', name: 'Nemački vojnik spreda', game, block: coverSoldierModule, stage: Stage3D, dimension: '2d',
    commands: soldierCommands,
    create: async stage => {
      const [whole, upper] = await Promise.all([loadPixelArt(coverSoldierArt.whole), loadPixelArt(coverSoldierArt.upper)])
      const body = new CoverSoldier({ y: coverSoldierModule.coverSoldier.size.height / 2 })
      stage.add(body, new CoverSoldierSprite(body, { whole, upper }))
      return body
    },
  },
  {
    id: 'nemacki-vojnik-iza-zaklona', name: 'Nemački vojnik iza zaklona', game, block: coverSoldierModelModule, stage: Stage3D,
    commands: soldierCommands,
    create: async stage => {
      const [flashPicture] = await Promise.all([loadPixelArt(coverSoldierModelModule.flash.picture), requestModels(coverSoldierModelModule.models)])
      const body = new CoverSoldier({ y: coverSoldierModule.coverSoldier.size.height / 2 })
      // he faces the camera
      stage.add(body, new CoverSoldierModel(body, { flashPicture, front: { x: 0, z: stage.camera.position.z } }))
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
  {
    id: 'dfs-230', name: 'Jedrilica DFS 230', game, block: gliderModule, stage: Stage3D,
    create: async stage => {
      const { dfs230Model } = gliderModule
      await requestModels([dfs230Model])
      const glider = { mesh: loadedModel(dfs230Model).clone(true) }
      stage.add(glider)
      return glider
    },
  },
]

export const aircraft = [
  {
    id: 'junkers-ju-52', name: 'Junkers Ju 52', game, block: transportModule, stage: Stage3D, dimension: '2d',
    create: async stage => {
      const body = new Transport({ x: -40, y: 20 })
      stage.add(body, new TransportSprite(body, { texture: await loadPixelArt(transportArt.picture), camera: stage.camera }))
      return body
    },
  },
]
