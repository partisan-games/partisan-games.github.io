import { separateModels } from './catalogEntries.js'
import FieldGun, * as fieldGunModule from '/core/gameplay/bodies/artillery/FieldGun.js'
import CannonCrew, * as crewModule from '/core/gameplay/bodies/soldiers/CannonCrew.js'
import Skirmisher, * as skirmisherModule from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import FlagBearer, * as bearerModule from '/core/gameplay/bodies/soldiers/FlagBearer.js'
import FieldGunSprite from '/core/actor/artillery/FieldGunSprite.js'
import CannonCrewSprite from '/core/actor/soldiers/CannonCrewSprite.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'
import FlagBearerSprite from '/core/actor/soldiers/FlagBearerSprite.js'
import { yawOf } from './helpers.js'

/** Ustanak draws its battle at 40 px a metre, where a man is 1.8 m tall. */
const pxPerMeter = 40

/** The middle of the stage in metres, facing `way`, and what the views draw with. */
const placed = (stage, way) => ({ x: stage.width / 2 / stage.projection.pxPerMeter, yaw: yawOf(way) })
const views = stage => ({ projection: stage.projection, camera: stage })

/** Puts `body` and its view on the stage and gives the body back. */
const put = (stage, body, view) => {
  stage.add(body, view)
  return body
}

const skirmisher = (stage, way) => {
  const body = new Skirmisher(placed(stage, way))
  return put(stage, body, new SkirmisherSprite(body, views(stage)))
}

const bearer = (stage, way, italian) => {
  const body = new FlagBearer({ kind: bearerModule.bearerKinds[italian ? 'italian' : 'partisan'], ...placed(stage, way) })
  return put(stage, body, new FlagBearerSprite(body, { italian, flagTime: () => stage.session.clock.now, ...views(stage) }))
}

const crew = (stage, way, italian) => {
  const body = new CannonCrew(placed(stage, way))
  return put(stage, body, new CannonCrewSprite(body, { italian, ...views(stage) }))
}

/** A gun in the middle, whose shots hit the stand-in; both armies' guns are drawn alike. */
const gun = (stage, way) => {
  const body = new FieldGun({ ...placed(stage, way), targets: [stage.dummy] })
  return put(stage, body, new FieldGunSprite(body, views(stage)))
}

/** The partisan and the Italian look of a block, named as its story says them. */
const armies = (partisan, italian) => [
  { id: partisan, name: partisan[0].toUpperCase() + partisan.slice(1), value: false },
  { id: italian, name: italian[0].toUpperCase() + italian.slice(1), value: true },
]

const game = 'Ustanak'

export const soldiers = [
  { id: 'partizanski-strelac', name: 'Partizanski strelac', game, pxPerMeter, way: 1, block: skirmisherModule, create: skirmisher },
  { id: 'zastavnik', name: 'Zastavnik', game, pxPerMeter, way: 1, looks: armies('partizanski', 'italijanski'), block: bearerModule, create: bearer,
    modelNames: { partizanski: 'Partizanski zastavnik', italijanski: 'Italijanski zastavnik' } },
  { id: 'posada-topa', name: 'Posada topa', game, pxPerMeter, way: 1, looks: armies('partizanska', 'italijanska'), block: crewModule, create: crew,
    modelNames: { partizanska: 'Partizanska posada topa', italijanska: 'Italijanska posada topa' } },
].flatMap(story => story.looks ? separateModels(story) : [story])

export const artillery = [
  { id: 'ustanak-top', name: 'Schneider 155 L', game, pxPerMeter, way: 1, block: fieldGunModule, create: gun },
]
