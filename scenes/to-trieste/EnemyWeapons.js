import Sound from '/core/io/audio/SoundSource.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Projectile from '/core/actor/projectiles/Projectile.js'
import Shell from '/core/actor/projectiles/Shell.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'
import { shellGravity, shellSpeed } from '../tenkici/shellPhysics.js'
import CombatTarget from './CombatTarget.js'

const FIRST_SHOT_DELAY = 1.5

class EnemyBullet extends Projectile {
  hit(target) {
    if (!(target instanceof CombatTarget)) return super.hit(target)
    target.die('enemy')
    this.reset()
  }
}

class EnemyShell extends Shell {
  hit(target) {
    if (!(target instanceof CombatTarget)) return super.hit(target)
    target.die('enemy')
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

class EnemyWeapon {
  constructor({ owner, clock, createProjectile, aim, speed, burstSize, interval, reload, sound = null, profile = 'rifle', firstShotDelay = FIRST_SHOT_DELAY }) {
    this.aim = aim
    this.origin = null
    if (sound) {
      this.shotSound = new Sound(sound, { profile, spatial: { getPosition: () => this.origin } })
      owner.sounds.push(this.shotSound)
    }
    this.burstSize = burstSize
    this.shots = 0
    this.firstShotDelay = firstShotDelay
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
    this.burst.start(this.firstShotDelay)
    this.weapon.cooldown.start(0)
  }

  fire(origin, target, angle = this.aim(origin, target)) {
    if (!this.burst.ready) return false
    this.origin = origin
    if (angle === null || !this.weapon.tryFire(origin, angle)) return false
    this.shotSound?.play()
    if (++this.shots === this.burstSize) {
      this.shots = 0
      this.burst.start()
    }
    return true
  }
}

export function createMachineGun({ owner, clock }) {
  return new EnemyWeapon({
    owner, clock, sound: 'rifle.mp3',
    createProjectile: () => {
      const bullet = new EnemyBullet({ src: null, width: 9, height: 2 })
      bullet.damage = 3
      return bullet
    },
    aim: (origin, target) => Math.atan2(target.y - origin.y, target.x - origin.x),
    speed: 720, burstSize: 5, interval: .13, reload: 4,
  })
}

export function createCannon({ owner, clock, groundY }) {
  return new EnemyWeapon({
    owner, clock, sound: 'cannon-shot.mp3', profile: 'cannon',
    createProjectile: () => {
      const shell = new EnemyShell({ clock, gravity: shellGravity, groundLevel: groundY })
      shell.damage = 20
      return shell
    },
    aim: shellAngle,
    speed: shellSpeed, burstSize: 1, interval: 0, reload: 4.5,
  })
}

export function createAircraftGun({ owner, clock }) {
  return new EnemyWeapon({
    owner, clock, sound: 'rifle.mp3',
    createProjectile: () => {
      const bullet = new EnemyBullet({ src: null, width: 9, height: 2 })
      bullet.damage = 2
      return bullet
    },
    // Fixed aircraft guns follow the nose, rather than aiming independently of it.
    aim: () => Math.atan2(owner.dy, owner.dx),
    speed: 720, burstSize: 3, interval: .16, reload: 5, firstShotDelay: .35,
  })
}

export function createAirBomb({ owner, clock, groundY }) {
  return new EnemyWeapon({
    owner, clock, sound: null,
    createProjectile: () => {
      const bomb = new EnemyShell({ clock, gravity: shellGravity, groundLevel: groundY })
      bomb.damage = 12
      bomb.tags.add('air-bomb')
      return bomb
    },
    // Release inherits horizontal aircraft speed; gravity determines the rest of the flight.
    aim: () => Math.PI,
    speed: owner.flightSpeed, burstSize: 1, interval: 0, reload: 8, firstShotDelay: 0,
  })
}
