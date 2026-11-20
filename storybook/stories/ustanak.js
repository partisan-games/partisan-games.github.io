import Strelac from '/scenes/ustanak/Strelac.js'
import Zastavnik from '/scenes/ustanak/Zastavnik.js'
import Posada from '/scenes/ustanak/Posada.js'

/** Puts `block` on the stage and gives it back. */
const put = (stage, block) => {
  stage.add(block)
  return block
}

/** Each stands as high above the ground line as in the game, which sets its feet by that offset. */
const rifleman = stage => put(stage, new Strelac(stage.width / 2, stage.groundY + 8))

const bearer = italian => stage => put(stage, new Zastavnik(stage.width / 2, stage.groundY + (italian ? -3 : 1), {
  italian, flagTime: () => stage.session.clock.now,
}))

const crew = italian => stage => put(stage, new Posada(stage.width / 2, stage.groundY + 8, { italian, direction: italian ? -1 : 1 }))

const game = 'Ustanak'

export const soldiers = [
  { id: 'partizanski-strelac', name: 'Partizanski strelac', game, block: '/scenes/ustanak/Strelac.js', create: rifleman },
  { id: 'partizanski-zastavnik', name: 'Partizanski zastavnik', game, block: '/scenes/ustanak/Zastavnik.js', create: bearer(false) },
  { id: 'italijanski-zastavnik', name: 'Italijanski zastavnik', game, block: '/scenes/ustanak/Zastavnik.js', create: bearer(true) },
  { id: 'partizanska-posada', name: 'Partizanska posada topa', game, block: '/scenes/ustanak/Posada.js', create: crew(false) },
  { id: 'italijanska-posada', name: 'Italijanska posada topa', game, block: '/scenes/ustanak/Posada.js', create: crew(true) },
]
