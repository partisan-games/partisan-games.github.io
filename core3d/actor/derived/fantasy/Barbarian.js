import Player from '/core3d/actor/Player.js'
import AI from '/core3d/actor/AI.js'
import { loadedModel } from '/core3d/assets/models.js'
import { RedFlame } from '/core3d/Particles.js'

const animDict = {
  idle: 'Idle',
  walk: 'Dwarf Walk',
  run: 'Fast Run',
  jump: 'Mutant Jumping',
  attack: 'Sword And Shield Slash',
  attack2: 'Mma Kick',
  special: 'Standing 2H Magic Attack 05',
  pain: 'Standing React Large From Right',
  death: 'Falling Back Death',
}

/* LOADING */

const meshModel = { prefix: 'character/huntress/', file: 'model.fbx', angle: Math.PI, animDict, size: 1.78, runCoefficient: 4 }
const rightHandWeaponModel = { file: 'weapon/axe-lowpoly/model.fbx', scale: .18 }

/** What to load; a game awaits requestModels(models) before it creates one of these. */
export const models = [meshModel, rightHandWeaponModel]

/* EXTENDED CLASSES */

const sharedProps = () => {
  const mesh = loadedModel(meshModel)
  const rightHandWeapon = loadedModel(rightHandWeaponModel)
  return { rightHandWeapon, mesh, animations: mesh.userData.animations, animDict, jumpStyle: 'FLY_JUMP', maxJumpTime: .3, runCoefficient: 2.5, attackStyle: 'LOOP' }
}

export class BarbarianPlayer extends Player {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
    this.flame = new RedFlame()
  }

  enterAttack() {
    super.enterAttack('enemy', this.height * .5)
  }

  checkHit() {
    if (this.state.includes('attack')) {
      this.hitAmount = 0 // untouchable during attack
      return
    }
    super.checkHit()
  }

  resetFlame() {
    const { flame } = this
    flame.reset({ pos: this.mesh.position })
    flame.mesh.rotation.copy(this.mesh.rotation)
    flame.mesh.rotateX(Math.PI)
    this.shouldLoop = true
  }

  enterSpecial() {
    this.startFlame(1, () => this.areaDamage())
  }

  exitSpecial() {
    this.endFlame()
  }
}

export class BarbarianAI extends AI {
  constructor(props = {}) {
    super({ ...sharedProps(), ...props })
  }
}
