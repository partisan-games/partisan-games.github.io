import Occupier, * as occupierModule from '/core/actor/Occupier.js'
import { put } from './helpers.js'

/** The occupier walks in from the left edge, his feet on the ground line. */
const occupier = stage => put(stage, new Occupier({ x: 0, y: stage.groundY - 90, heading: 1 }))

export const soldiers = [
  { id: 'okupator', name: 'Okupator', game: 'Otpisani', block: occupierModule, create: occupier },
]
