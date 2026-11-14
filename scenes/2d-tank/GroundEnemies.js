import platno from '/core/io/platno.js'
import CombatTarget from './CombatTarget.js'
import EnemyFire from './EnemyFire.js'
import AimedBarrel from './AimedBarrel.js'
import { createMachineGun, createCannon } from './EnemyWeapons.js'
import { groundEnemyArt } from './enemyArt.js'

const profiles = [
  { kind: 'tankette', driveSpeed: 55, createWeapon: createMachineGun },
  { kind: 'truck', driveSpeed: 80 },
  { kind: 'antiTankGun', driveSpeed: 0, createWeapon: createCannon },
  { kind: 'tank', driveSpeed: 35, createWeapon: createCannon },
]

export class GroundEnemy extends CombatTarget {
  constructor({ kind, art, clock, target, obstacles, groundY, scrollSpeed, driveSpeed = 0, createWeapon, nextSpawnX, x, ...rest }) {
    const { barrel, ...bodyArt } = art
    super({ ...bodyArt, x, tlo: groundY + 5, brzina: scrollSpeed - driveSpeed, z: -1, zapaljiv: true, ...rest })
    this.kind = kind
    this.scrollSpeed = scrollSpeed
    this.driveSpeed = driveSpeed
    this.nextSpawnX = nextSpawnX
    if (barrel) {
      this.barrel = new AimedBarrel({ ...barrel, owner: this })
      this.predmeti.push(this.barrel)
    }
    if (createWeapon) this.fire = new EnemyFire({
      owner: this, clock, target, obstacles, groundY, createWeapon, barrel: this.barrel,
      muzzle: () => ({ x: this.x - this.sirina * .45, y: this.y - this.visina * .2 }),
    })
  }

  umri(source) {
    super.umri(source)
    // Wrecks travel with the scenery instead of continuing under their own power.
    this.dx = this.scrollSpeed
  }

  reset() {
    super.reset()
    this.dx = this.scrollSpeed - this.driveSpeed
    this.fire?.reset()
    this.barrel?.reset()
  }

  proveriGranice() {
    if (!Number.isFinite(this.sirina) || this.x + this.sirina / 2 >= 0) return
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
  const gap = Math.max(360, platno.width * .65)
  const enemies = []
  const nextSpawnX = () => Math.max(platno.width, ...enemies.map(enemy => enemy.x + (enemy.sirina || 0) / 2)) + gap
  for (const [index, profile] of profiles.entries()) enemies.push(new GroundEnemy({
    ...options, ...profile, art: groundEnemyArt[profile.kind],
    x: platno.width + 120 + index * gap, nextSpawnX,
  }))
  return enemies
}
