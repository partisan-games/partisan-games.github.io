import TrenchSoldier, * as trenchSoldierModule from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'

/** The isolated upper-body figure; its cut-off waist rests on the ground line, without scenery. */
const trench = faction => stage => {
  const body = new TrenchSoldier({ x: stage.width / 2 / stage.projection.pxPerMeter, y: 14 / stage.projection.pxPerMeter })
  body.setState('aim')
  stage.add(body, new TrenchSoldierSprite(body, { faction, projection: stage.projection, camera: stage }))
  return body
}

const game = 'Neretva'

export const soldiers = [
  { id: 'nemac-u-rovu', name: 'Nemac spreda', game, block: trenchSoldierModule, create: trench('nemci') },
  { id: 'cetnik-u-rovu', name: 'Četnik spreda', game, block: trenchSoldierModule, create: trench('cetnici') },
]
