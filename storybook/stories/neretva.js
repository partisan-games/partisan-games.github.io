import TrenchSoldier, * as trenchSoldierModule from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'

/** A soldier in his trench on the ground line, as near as the near row of the game. */
const trench = faction => stage => {
  const body = new TrenchSoldier({ x: stage.width / 2 / stage.projection.pxPerMeter })
  stage.add(body, new TrenchSoldierSprite(body, { faction, projection: stage.projection, camera: stage }))
  return body
}

const game = 'Neretva'

export const soldiers = [
  { id: 'nemac-u-rovu', name: 'Nemac u rovu', game, settings: ['trench.aimTime', 'trench.damage'], block: trenchSoldierModule, create: trench('nemci') },
  { id: 'cetnik-u-rovu', name: 'Četnik u rovu', game, settings: ['trench.aimTime', 'trench.damage'], block: trenchSoldierModule, create: trench('cetnici') },
]
