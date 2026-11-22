import Partisan, * as partisanModule from '/core/gameplay/bodies/soldiers/Partisan.js'
import PartisanSprite from '/core/actor/soldiers/PartisanSprite.js'
import { yawOf } from './helpers.js'

export const soldiers = [
  ['runner', 'partizanski-strelac-trk', 'Partizanski strelac u trku', 'Do Trsta'],
  ['lmg', 'partizanski-puskomitraljezac', 'Partizanski puškomitraljezac', 'Do Trsta, Franjo Kluz'],
  ['rear', 'partizan-otpozadi', 'Partizan otpozadi', 'Neretva'],
  ['loader', 'aerodromska-posada', 'Partizanska aerodromska posada', 'Franjo Kluz'],
].map(([role, id, name, game]) => ({ id, name, game, block: partisanModule, way: 1,
  create(stage, way) {
    const body = new Partisan({ role, x: stage.width / 2 / stage.projection.pxPerMeter, y: .9,
      yaw: yawOf(way), targets: [stage.dummy] })
    const view = new PartisanSprite(body, { projection: stage.projection, camera: stage })
    stage.add(body, view)
    return body
  } }))
