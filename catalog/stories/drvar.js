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
import { requestModels } from '/core3d/assets/models.js'
import Ju52, * as ju52Module from '/core3d/actor/aircraft/Ju52.js'

const game = 'Raid on Drvar (u izradi)'

/** Metres above the floor a paratrooper starts from, high enough to watch him sink for a few seconds. */
const dropHeight = 25
/** The height of the cover the soldier is sent to, in metres; the catalog draws no cover. */
const coverHeight = 1.1

/**
 * Readies `soldier` for his states: he aims and fires at an unseen stand-in that takes his hits and never dies, and
 * each `move` takes him 3 m aside behind cover, the next back into the open.
 */
function drill(stage, soldier) {
  soldier.target = new Body({ health: 1e9 })
  const places = [{ x: soldier.x + 3, z: soldier.z, cover: coverHeight }, { x: soldier.x, z: soldier.z }]
  soldier.goal = places[0]
  stage.controllers.push({ update() {
    if (soldier.state !== 'move' && soldier.x === soldier.goal.x && soldier.z === soldier.goal.z)
      soldier.goal = places[(places.indexOf(soldier.goal) + 1) % places.length]
  } })
}

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
    create: async stage => {
      const [whole, upper] = await Promise.all([loadPixelArt(coverSoldierArt.whole), loadPixelArt(coverSoldierArt.upper)])
      const body = new CoverSoldier({ y: coverSoldierModule.coverSoldier.size.height / 2 })
      drill(stage, body)
      stage.add(body, new CoverSoldierSprite(body, { whole, upper }))
      return body
    },
  },
  {
    id: 'nemacki-vojnik-iza-zaklona', name: 'Nemački vojnik iza zaklona', game, block: coverSoldierModelModule, stage: Stage3D,
    create: async stage => {
      const [flashPicture] = await Promise.all([loadPixelArt(coverSoldierModelModule.flash.picture), requestModels(coverSoldierModelModule.models)])
      const body = new CoverSoldier({ y: coverSoldierModule.coverSoldier.size.height / 2 })
      drill(stage, body)
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
