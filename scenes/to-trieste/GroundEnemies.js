import canvas2d from '/core/io/canvas2d.js'
import CombatTarget from './CombatTarget.js'
import EnemyFire from './EnemyFire.js'
import AimedBarrel from './AimedBarrel.js'
import { createCannon } from './EnemyWeapons.js'
import { groundEnemyArt } from './enemyArt.js'

const profiles = [
  { kind: 'germanTank', driveSpeed: 55, createWeapon: createCannon },
  { kind: 'truck', driveSpeed: 80 },
  { kind: 'antiTankGun', driveSpeed: 0, createWeapon: createCannon },
  { kind: 'tank', driveSpeed: 35, createWeapon: createCannon },
]

export class GroundEnemy extends CombatTarget {
  constructor({ kind, art, clock, target, obstacles, groundY, scrollSpeed, driveSpeed = 0, createWeapon, nextSpawnX, x, ...rest }) {
    const { barrel, ...bodyArt } = art
    super({ ...bodyArt, x, groundY: groundY + 5, speed: scrollSpeed - driveSpeed, z: -1, flammable: true, ...rest })
    this.kind = kind
    this.scrollSpeed = scrollSpeed
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
  }

  die(source) {
    super.die(source)
    // Wrecks travel with the scenery instead of continuing under their own power.
    this.dx = this.scrollSpeed
  }

  reset() {
    super.reset()
    this.dx = this.scrollSpeed - this.driveSpeed
    this.fire?.reset()
    this.barrel?.reset()
  }

  checkBounds() {
    if (!Number.isFinite(this.width) || this.x + this.width / 2 >= 0) return
    this.x = this.nextSpawnX()
    this.reset()
  }

  update(dt) {
    super.update(dt)
    this.barrel?.sync()
    this.fire?.update(this.fire.target.x < this.x)
  }

  checkHits() {
    this.fire?.checkHits()
  }
}

export default function createGroundEnemies(options) {
  const gap = Math.max(720, canvas2d.width * 1.25)
  const enemies = []
  const nextSpawnX = () => Math.max(canvas2d.width, ...enemies.map(enemy => enemy.x + (enemy.width || 0) / 2)) + gap
  for (const [index, profile] of profiles.entries()) enemies.push(new GroundEnemy({
    ...options, ...profile, art: groundEnemyArt[profile.kind],
    x: canvas2d.width + gap * .5 + index * gap, nextSpawnX,
  }))
  return enemies
}
