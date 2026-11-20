import Rifleman from '/scenes/franjo-kluz/Rifleman.js'
import Vehicle from '/scenes/franjo-kluz/Vehicle.js'
import Fighter from '/scenes/franjo-kluz/Fighter.js'
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

const game = 'Franjo Kluz'

export const soldiers = [
  { id: 'strelac', name: 'Nemački strelac', game, block: '/scenes/franjo-kluz/Rifleman.js', create: soldier('soldier') },
  { id: 'jurisnik', name: 'Nemački jurišnik', game, block: '/scenes/franjo-kluz/Rifleman.js', create: soldier('assault') },
]

export const vehicles = [
  { id: 'hummel', name: 'Hummel', game, block: '/scenes/franjo-kluz/Vehicle.js', create: vehicle('tank') },
  { id: 'opel-blitz', name: 'Opel Blitz', game, block: '/scenes/franjo-kluz/Vehicle.js', create: vehicle('truck') },
  { id: 'opel-blitz-legija', name: 'Opel Blitz, legija', game, block: '/scenes/franjo-kluz/Vehicle.js', create: vehicle('legionTruck') },
  { id: 'bp42', name: 'Oklopni voz BP-42', game, block: '/scenes/franjo-kluz/Vehicle.js', create: vehicle('train') },
]

export const aircraft = [
  { id: 'bf109-levo', name: 'Bf 109, nalevo', game, block: '/scenes/franjo-kluz/Fighter.js', create: fighter(false) },
  { id: 'bf109-desno', name: 'Bf 109, nadesno', game, block: '/scenes/franjo-kluz/Fighter.js', create: fighter(true) },
]
