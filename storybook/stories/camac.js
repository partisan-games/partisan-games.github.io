import Boat, * as boatModule from '/scenes/camac/Boat.js'
import SBoat, * as sBoatModule from '/scenes/camac/SBoat.js'
import ShoreMachineGun, * as shoreMachineGunModule from '/scenes/camac/ShoreMachineGun.js'
import { fromAbove, put } from './helpers.js'

/** What the boats and the shore take from the stage: the left edge of the view. */
const river = stage => {
  fromAbove(stage)
  return { session: stage.session, viewLeft: () => stage.cameraX }
}

/** The partisan boat, driven and fired by the game's keys. */
const boat = stage => {
  fromAbove(stage)
  const block = new Boat(() => stage.cameraX, stage.session, stage.width * .2)
  block.setPosition(stage.width / 2, stage.height / 2)
  return put(stage, block)
}

/** The German speedboat lies still right of the target, bow to the left. */
const sBoat = stage => {
  const block = put(stage, new SBoat(river(stage)))
  block.launch(1)
  block.setPosition(stage.width * .8, stage.target.y)
  return block
}

/** A machine-gun nest on the shore above the target, facing the water. */
const nest = stage => {
  const block = put(stage, new ShoreMachineGun(river(stage)))
  block.deploy(stage.width / 2, stage.target.y - 200, -1)
  return block
}

const game = 'Čamac'

export const boats = [
  { id: 'partizanski-camac', name: 'Partizanski čamac', game, block: boatModule, create: boat },
  { id: 'schnellboot', name: 'Schnellboot S-30', game, block: sBoatModule, create: sBoat },
]

export const artillery = [
  { id: 'mitraljesko-gnezdo', name: 'Mitraljesko gnezdo', game, block: shoreMachineGunModule, create: nest },
]
