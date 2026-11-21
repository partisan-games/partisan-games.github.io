import FieldGun, * as fieldGunModule from '/core/gameplay/bodies/artillery/FieldGun.js'
import CannonCrew, * as crewModule from '/core/gameplay/bodies/soldiers/CannonCrew.js'
import Skirmisher, * as skirmisherModule from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import FlagBearer, * as bearerModule from '/core/gameplay/bodies/soldiers/FlagBearer.js'
import FieldGunSprite from '/core/actor/artillery/FieldGunSprite.js'
import CannonCrewSprite from '/core/actor/soldiers/CannonCrewSprite.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'
import FlagBearerSprite from '/core/actor/soldiers/FlagBearerSprite.js'

/** Ustanak draws its battle at 40 px a metre, where a man is 1.8 m tall. */
const pxPerMeter = 40

/** The middle of the stage in metres, facing right (side 0) or left (side 1), and what the views draw with. */
const placed = (stage, side = 0) => ({ x: stage.width / 2 / stage.projection.pxPerMeter, yaw: side * Math.PI })
const views = stage => ({ projection: stage.projection, camera: stage })

/** Puts `body` and its view on the stage and gives the body back. */
const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

const skirmisher = stage => {
  const body = new Skirmisher(placed(stage))
  return put(stage, body, new SkirmisherSprite(body, views(stage)))
}

const bearer = italian => stage => {
  const body = new FlagBearer({ kind: bearerModule.bearerKinds[italian ? 'italian' : 'partisan'], ...placed(stage, Number(italian)) })
  return put(stage, body, new FlagBearerSprite(body, { italian, flagTime: () => stage.session.clock.now, ...views(stage) }))
}

const crew = italian => stage => {
  const body = new CannonCrew(placed(stage, Number(italian)))
  return put(stage, body, new CannonCrewSprite(body, { italian, ...views(stage) }))
}

/** A gun in the middle, facing right or left, whose shots hit the stand-in. */
const gun = side => stage => {
  const body = new FieldGun({ ...placed(stage, side), targets: [stage.dummy] })
  return put(stage, body, new FieldGunSprite(body, views(stage)))
}

const game = 'Ustanak'

export const soldiers = [
  { id: 'partizanski-strelac', name: 'Partizanski strelac', game, pxPerMeter, block: skirmisherModule, create: skirmisher },
  { id: 'partizanski-zastavnik', name: 'Partizanski zastavnik', game, pxPerMeter, block: bearerModule, create: bearer(false) },
  { id: 'italijanski-zastavnik', name: 'Italijanski zastavnik', game, pxPerMeter, block: bearerModule, create: bearer(true) },
  { id: 'partizanska-posada', name: 'Partizanska posada topa', game, pxPerMeter, block: crewModule, create: crew(false) },
  { id: 'italijanska-posada', name: 'Italijanska posada topa', game, pxPerMeter, block: crewModule, create: crew(true) },
]

export const artillery = [
  { id: 'ustanak-partizanski-top', name: 'Partizanski top', game, pxPerMeter, block: fieldGunModule, create: gun(0) },
  { id: 'ustanak-italijanski-top', name: 'Italijanski top', game, pxPerMeter, block: fieldGunModule, create: gun(1) },
]
