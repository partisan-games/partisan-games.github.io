import ProjectilePool from '/core/actor/ProjectilePool.js'
import Metak from '/core/actor/projektili/Metak.js'
import Granata from '/core/actor/projektili/Granata.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'
import { shellGravity, shellSpeed } from '../tenkici/shellPhysics.js'
import CombatTarget from './CombatTarget.js'

const FIRST_SHOT_DELAY = 1.5

class EnemyBullet extends Metak {
  povredi(target) {
    if (!(target instanceof CombatTarget)) return super.povredi(target)
    target.umri('enemy')
    this.reset()
  }
}

class EnemyShell extends Granata {
  povredi(target) {
    if (!(target instanceof CombatTarget)) return super.povredi(target)
    target.umri('enemy')
    this.reset()
  }
}

/** Low ballistic arc in screen coordinates, where positive y points down. */
export function shellAngle(origin, target, speed = shellSpeed, gravity = shellGravity) {
  const dx = target.x - origin.x
  const distance = Math.abs(dx)
  if (distance < 1) return null
  const dy = target.y - origin.y
  const squaredSpeed = speed * speed
  const discriminant = squaredSpeed * squaredSpeed - gravity * (gravity * distance * distance - 2 * dy * squaredSpeed)
  if (discriminant < 0) return null
  const elevation = Math.atan((squaredSpeed - Math.sqrt(discriminant)) / (gravity * distance))
  return dx < 0 ? Math.PI + elevation : -elevation
}

class BunkerWeapon {
  constructor({ owner, clock, createProjectile, aim, speed, burstSize, interval, reload }) {
    this.aim = aim
    this.burstSize = burstSize
    this.shots = 0
    this.burst = new Cooldown({ clock, seconds: reload })
    this.projectiles = new ProjectilePool({ owner, create: createProjectile })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ clock, seconds: interval }),
      spawnProjectile: (position, angle) => this.projectiles.fire(position, angle, speed),
    })
    this.reset()
  }

  reset() {
    this.shots = 0
    this.burst.start(FIRST_SHOT_DELAY)
    this.weapon.cooldown.start(0)
  }

  fire(origin, target) {
    if (!this.burst.ready) return
    const angle = this.aim(origin, target)
    if (angle === null || !this.weapon.tryFire(origin, angle)) return
    if (++this.shots === this.burstSize) {
      this.shots = 0
      this.burst.start()
    }
  }
}

export function createMachineGun({ owner, clock }) {
  return new BunkerWeapon({
    owner, clock,
    createProjectile: () => {
      const bullet = new EnemyBullet({ src: null, sirina: 9, visina: 2 })
      bullet.steta = 3
      return bullet
    },
    aim: (origin, target) => Math.atan2(target.y - origin.y, target.x - origin.x),
    speed: 720, burstSize: 5, interval: .13, reload: 3,
  })
}

export function createCannon({ owner, clock, groundY }) {
  return new BunkerWeapon({
    owner, clock,
    createProjectile: () => {
      const shell = new EnemyShell({ clock, gravitacija: shellGravity, nivoTla: groundY })
      shell.steta = 20
      return shell
    },
    aim: shellAngle,
    speed: shellSpeed, burstSize: 1, interval: 0, reload: 3.5,
  })
}
