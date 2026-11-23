import Partisan, * as partisanModule from '/core/gameplay/bodies/soldiers/Partisan.js'
import PartisanSprite from '/core/actor/soldiers/PartisanSprite.js'
import { yawOf } from './helpers.js'
import scales from '../scales.js'

export const soldiers = [
  ['runner', 'partizanski-strelac-trk', 'Partizanski strelac u trku', 'Do Trsta', scales.side],
  ['lmg', 'partizanski-puskomitraljezac', 'Partizanski puškomitraljezac', 'Do Trsta, Franjo Kluz', scales.side],
  ['rear', 'partizan-otpozadi', 'Partizan otpozadi', 'Neretva', scales.side],
  ['loader', 'aerodromska-posada', 'Partizanska aerodromska posada', 'Franjo Kluz', scales.side],
].map(([role, id, name, game, pxPerMeter]) => ({ id, name, game, pxPerMeter, block: partisanModule, way: 1,
  create(stage, way) {
    const body = new Partisan({ role, x: stage.width / 2 / stage.projection.pxPerMeter, y: .9,
      yaw: yawOf(way), targets: [stage.dummy] })
    const view = new PartisanSprite(body, { projection: stage.projection, camera: stage })
    stage.add(body, view)
    return body
  } }))
