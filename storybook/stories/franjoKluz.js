import Rifleman, * as riflemanModule from '/core/actor/soldiers/Rifleman.js'
import Vehicle, * as vehicleModule from '/core/actor/vehicles/Vehicle.js'
import Fighter, * as fighterModule from '/core/actor/aircraft/Fighter.js'
import DiveBomber, * as diveBomberModule from '/core/actor/aircraft/DiveBomber.js'
import Flak, * as flakModule from '/core/actor/artillery/Flak.js'
import Potez, * as potezModule from '/scenes/franjo-kluz/Potez.js'
import { kinds } from '/scenes/franjo-kluz/enemies.js'

/** What every block of Franjo Kluz takes from the stage: where it stands. */
const place = stage => ({ session: stage.session, camera: stage, groundY: stage.groundY, x: stage.width / 2 })

/** Puts `block` on the stage and gives it back. */
const put = (stage, block) => {
  stage.add(block)
  return block
}

const soldier = kind => stage => put(stage, new Rifleman({ ...kinds[kind], ...place(stage), targets: [stage.target] }))

const vehicle = kind => stage => put(stage, new Vehicle({ ...kinds[kind], ...place(stage) }))

/** The fighter flies its pass at the height of the target: left as when it comes head on, right as from behind. */
const fighter = fromBehind => stage => {
  const block = new Fighter({ ...place(stage), plane: stage.target })
  block.enter({ x: stage.width / 2, y: stage.groundY - 300, fromBehind })
  return put(stage, block)
}

/** The Ju 87 comes head on over the right of the view, high enough to dive on the ground below it. */
const diveBomber = stage => {
  const block = new DiveBomber(place(stage))
  block.enter({ x: stage.width * .8, y: stage.groundY - 400, fromBehind: false })
  return put(stage, block)
}

/** The plane flies on at its airspeed, so the view follows it from the start; the keys of the game fly it. */
const plane = src => stage => {
  const block = new Potez({ groundY: stage.groundY, camera: stage, session: stage.session, x: stage.width / 2,
    y: stage.groundY - 300, src })
  stage.follow(block)
  return put(stage, block)
}

const flak = stage => put(stage, new Flak({ ...place(stage), targets: [stage.target] }))

const game = 'Franjo Kluz'

export const soldiers = [
  { id: 'strelac', name: 'Nemački strelac', game, block: riflemanModule, create: soldier('soldier') },
  { id: 'jurisnik', name: 'Nemački jurišnik', game, block: riflemanModule, create: soldier('assault') },
]

export const vehicles = [
  { id: 'hummel', name: 'Hummel', game, block: vehicleModule, create: vehicle('tank') },
  { id: 'opel-blitz', name: 'Opel Blitz', game, block: vehicleModule, create: vehicle('truck') },
  { id: 'opel-blitz-legija', name: 'Opel Blitz, legija', game, block: vehicleModule, create: vehicle('legionTruck') },
  { id: 'bp42', name: 'Oklopni voz BP-42', game, block: vehicleModule, create: vehicle('train') },
]

export const aircraft = [
  { id: 'potez-ndh', name: 'Potez 25, NDH', game, block: potezModule, create: plane(potezModule.markings.ndh) },
  { id: 'potez-partizanski', name: 'Potez 25, partizanski', game, block: potezModule, create: plane(potezModule.markings.partisan) },
  { id: 'bf109-levo', name: 'Bf 109, nalevo', game, block: fighterModule, create: fighter(false) },
  { id: 'bf109-desno', name: 'Bf 109, nadesno', game, block: fighterModule, create: fighter(true) },
  { id: 'ju87-obrusavac', name: 'Ju 87', game, block: diveBomberModule, create: diveBomber },
]

export const artillery = [
  { id: 'flak38', name: 'Flak 38', game, block: flakModule, create: flak },
]

