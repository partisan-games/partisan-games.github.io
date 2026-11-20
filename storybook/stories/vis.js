import * as avionceModule from '/scenes/vis/Avionce.js'
import Enemy, * as enemyModule from '/scenes/vis/Enemy.js'
import Boss, * as bossModule from '/scenes/vis/Boss.js'

/** Puts `block` on the stage and gives it back. */
const put = (stage, block) => {
  stage.add(block)
  return block
}

/** The player plane, flown and fired with the keys of the game, in the middle of the stage. */
const player = aircraftId => stage => put(stage, new avionceModule.Avionce({
  session: stage.session, aircraftId, x: stage.width / 2, y: stage.groundY - 300,
}))

/** An enemy plane stands high above the target with its nose down until it is set to fire or shot down; its bullets hit the target. */
const enemyPlane = create => stage => {
  const block = create(stage.session)
  block.setPosition(stage.width / 2, stage.height * .2)
  block.angle = Math.PI
  block.targets.push(stage.target)
  return put(stage, block)
}

const game = 'Vis'

export const aircraft = [
  { id: 'vis-spitfire', name: 'Spitfire Mk Vb', game, block: avionceModule, create: player('spitfire') },
  { id: 'vis-hurricane', name: 'Hurricane Mk IV', game, block: avionceModule, create: player('hurricane') },
  { id: 'vis-breguet', name: 'Breguet 19', game, block: avionceModule, create: player('breguet') },
  { id: 'vis-yak', name: 'Yak-1b', game, block: avionceModule, create: player('yak') },
  { id: 'vis-lovac', name: 'Nemački lovac', game, block: enemyModule, create: enemyPlane(session => new Enemy({ session })) },
  { id: 'vis-bf110', name: 'Bf 110', game, block: enemyModule, create: enemyPlane(session => new Enemy({ session, type: 'heavy' })) },
  { id: 'vis-he111', name: 'He 111', game, block: bossModule, create: enemyPlane(session => new Boss({ session })) },
]
