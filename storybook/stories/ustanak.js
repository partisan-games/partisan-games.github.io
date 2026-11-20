import Strelac, * as strelacModule from '/scenes/ustanak/Strelac.js'
import Zastavnik, * as zastavnikModule from '/scenes/ustanak/Zastavnik.js'
import Posada, * as posadaModule from '/scenes/ustanak/Posada.js'
import Top, * as topModule from '/scenes/ustanak/Top.js'

/** Puts `block` on the stage and gives it back. */
const put = (stage, block) => {
  stage.add(block)
  return block
}

/** What the scene of a game does after everything on the stage has moved, such as ending the flights of shells. */
const afterEachStep = (stage, step) => {
  const update = stage.update.bind(stage)
  stage.update = (dt, t) => {
    update(dt, t)
    step(dt)
  }
}

/** Each stands as high above the ground line as in the game, which sets its feet by that offset. */
const rifleman = stage => put(stage, new Strelac(stage.width / 2, stage.groundY + 8))

const bearer = italian => stage => put(stage, new Zastavnik(stage.width / 2, stage.groundY + (italian ? -3 : 1), {
  italian, flagTime: () => stage.session.clock.now,
}))

const crew = italian => stage => put(stage, new Posada(stage.width / 2, stage.groundY + 8, { italian, direction: italian ? -1 : 1 }))

/** Where a cannon's barrel is when its wheel stands on the ground line. */
const barrelY = stage => stage.groundY - Top.floorY(0)

/** A cannon in the middle, facing right or left, whose shells end their flight as in the game. */
const cannon = (direction, options = {}) => stage => {
  const block = new Top({ x: stage.width / 2, y: barrelY(stage), direction,
    clock: stage.session.clock, targets: [stage.target], ...options })
  afterEachStep(stage, () => block.resolveShots())
  return put(stage, block)
}

const game = 'Ustanak'

export const soldiers = [
  { id: 'partizanski-strelac', name: 'Partizanski strelac', game, block: strelacModule, create: rifleman },
  { id: 'partizanski-zastavnik', name: 'Partizanski zastavnik', game, block: zastavnikModule, create: bearer(false) },
  { id: 'italijanski-zastavnik', name: 'Italijanski zastavnik', game, block: zastavnikModule, create: bearer(true) },
  { id: 'partizanska-posada', name: 'Partizanska posada topa', game, block: posadaModule, create: crew(false) },
  { id: 'italijanska-posada', name: 'Italijanska posada topa', game, block: posadaModule, create: crew(true) },
]

export const artillery = [
  { id: 'ustanak-partizanski-top', name: 'Partizanski top', game, block: topModule, create: cannon(1) },
  { id: 'ustanak-italijanski-top', name: 'Italijanski top', game, block: topModule, create: cannon(-1) },
]

