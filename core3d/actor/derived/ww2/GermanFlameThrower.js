import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'

const animDict = {
  idle: 'Machine Gun Idle',
  walk: 'Machine Gun Walk',
  run: 'Rifle Run',
  attack: 'Crouch Rapid Fire',
  attack2: 'Machine Gun Idle',
  pain: 'Hit Reaction',
  death: 'Crouch Death',
}

/* LOADING */

const meshModel = { file: 'german-machine-gunner.fbx', animDict, prefix: 'character/soldier/', angle: Math.PI }
const twoHandedWeaponModel = { file: 'weapon/flame-gun/model.fbx', scale: .75 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, twoHandedWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const twoHandedWeapon = loadedModel(twoHandedWeaponModel)
  return { mesh, animations: mesh.userData.animations, animDict, twoHandedWeapon, speed: 1.8, attackStyle: 'LOOP', attackDistance: 7, attackSound: 'fire-swoosh.mp3', useFlame: true }
}

export class GermanFlameThrowerPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }

  enterAttack() {
    super.enterAttack()
    this.startFlame(0, null, false)
  }

  exitAttack() {
    this.endFlame()
  }
}

export class GermanFlameThrowerAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }

  enterAttack() {
    super.enterAttack()
    this.startFlame(0, null, false)
  }

  exitAttack() {
    this.endFlame()
  }

  update(delta) {
    super.update(delta)
    if (this.state != 'attack') this.endFlame()
  }
}
