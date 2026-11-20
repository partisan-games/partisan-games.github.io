import Sound from '/core/io/audio/SoundSource.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import Marksman from '/core/gameplay/controllers/Marksman.js'
import canvas2d from '/core/io/canvas2d.js'
import CombatTarget from './CombatTarget.js'
import EnemyFire from './EnemyFire.js'
import AimedBarrel from './AimedBarrel.js'
import { createCannon } from './EnemyWeapons.js'
import { groundEnemyArt } from './enemyArt.js'

/** Each kind of ground enemy: how fast it drives towards the tank, and its gun, if it has one. */
export const profiles = [
  { kind: 'germanTank', driveSpeed: 55, createWeapon: createCannon },
  { kind: 'truck', driveSpeed: 80 },
  { kind: 'antiTankGun', driveSpeed: 0, createWeapon: createCannon },
  { kind: 'tank', driveSpeed: 35, createWeapon: createCannon },
]

/**
 * A ground enemy stands with the scenery, or drives towards the tank, or fires where it aims without changing how it
 * moves, or lies wrecked; who sets it, and when, is up to the world. Each has only the states it can: a gun does not
 * drive and a truck does not fire.
 */
const allStates = {
  idle: {
    enter: enemy => {
      enemy.dx = enemy.scrollSpeed
    },
  },
  drive: {
    enter: enemy => {
      enemy.dx = enemy.scrollSpeed - enemy.driveSpeed
    },
  },
  fire: {},
  dead: {
    enter: enemy => {
      enemy.die()
      // Wrecks travel with the scenery instead of continuing under their own power.
      enemy.dx = enemy.scrollSpeed
    },
  },
}

/**
 * Its shots hit the `target` and any `obstacles` in their way. It starts, and starts each new life, in `state`. The
 * world may give it a `controller`, which chooses its state once the enemy has moved each frame.
 */
export class GroundEnemy extends CombatTarget {
  constructor({ kind, art, clock, target, obstacles, groundY, scrollSpeed, driveSpeed = 0, createWeapon, nextSpawnX, x, state = 'idle', ...rest }) {
    const { barrel, ...bodyArt } = art
    super({ ...bodyArt, x, groundY: groundY + 5, z: -1, flammable: true, ...rest })
    this.kind = kind
    this.scrollSpeed = scrollSpeed
    this.engineSound = new Sound('engine-diesel.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position, getRevision: () => this.lifeId } })
    this.sounds.push(this.engineSound)
    this.driveSpeed = driveSpeed
    this.nextSpawnX = nextSpawnX
    if (barrel) {
      this.barrel = new AimedBarrel({ ...barrel, owner: this })
      this.children.push(this.barrel)
    }
    if (createWeapon) this.fire = new EnemyFire({
      owner: this, clock, target, obstacles, groundY, createWeapon, barrel: this.barrel,
      muzzle: () => ({ x: this.x - this.width * .45, y: this.y - this.height * .2 }),
    })
    this.projectiles = this.fire?.projectiles
    this.controller = null
    this.initialState = state
    const states = Object.fromEntries(Object.entries(allStates).filter(([name]) =>
      (name !== 'drive' || driveSpeed > 0) && (name !== 'fire' || this.fire)))
    this.machine = new StateMachine(this, states, state)
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** Faces left: the art is drawn so. */
  get forward() {
    return -1
  }

  /** A barrel near level for a near target, and raised for a far one. */
  get shots() {
    return this.fire && { straight: { x: 300, y: 0 }, up: { x: 700, y: 0 } }
  }

  /** Turns the barrel to the shot that reaches `point`, if it is ahead: the gun does not turn round. */
  aimAt(point) {
    if (!this.fire || Math.sign(point.x - this.x) !== this.forward) return false
    this.fire.aimAt(point)
    return true
  }

  die(source) {
    super.die(source)
    this.setState('dead')
  }

  reset() {
    super.reset()
    this.setState(this.initialState)
    this.fire?.reset()
    this.barrel?.reset()
  }

  checkBounds() {
    if (!Number.isFinite(this.width) || this.x + this.width / 2 >= 0) return
    this.x = this.nextSpawnX()
    this.reset()
  }

  update(dt) {
    this.engineSound.setPlaying(!this.dead && this.driveSpeed > 0)
    super.update(dt)
    this.barrel?.sync()
    this.controller?.update(dt)
    this.fire?.update(this.state === 'fire')
  }

  checkHits() {
    this.fire?.checkHits()
  }
}

export default function createGroundEnemies(options) {
  const gap = Math.max(720, canvas2d.width * 1.25)
  const enemies = []
  const nextSpawnX = () => Math.max(canvas2d.width, ...enemies.map(enemy => enemy.x + (enemy.width || 0) / 2)) + gap
  for (const [index, profile] of profiles.entries()) {
    const state = profile.driveSpeed ? 'drive' : 'idle'
    const enemy = new GroundEnemy({
      ...options, ...profile, art: groundEnemyArt[profile.kind], state,
      x: canvas2d.width + gap * .5 + index * gap, nextSpawnX,
    })
    if (enemy.fire) enemy.controller = new Marksman(enemy, options.target, { rest: state })
    enemies.push(enemy)
  }
  return enemies
}
