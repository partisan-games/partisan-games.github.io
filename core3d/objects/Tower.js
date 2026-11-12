import { loadedModel } from '/core3d/assets/models.js'
import Bullet from './Bullet.js'
import Building from './Building.js'

const model = {
  file: 'building/tower/ww2/D85VT1X9UHDSYASVUM1UY02HA.obj',
  mtl: 'building/tower/ww2/D85VT1X9UHDSYASVUM1UY02HA.mtl',
  size: 18,
  shouldAdjustHeight: true
}

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

export default class Tower extends Building {
  constructor({ mesh = loadedModel(model), range = 200, interval = 500, damage = 100, damageDistance = 2, ...rest } = {}) {
    super({ mesh, name: 'tower', ...rest })
    this.range = range
    this.damage = damage
    this.damageDistance = damageDistance
    this.bullets = []
    this.age = 0 // seconds of game time, so the tower waits in a pause
    this.last = 0
    this.interval = interval // milliseconds
  }

  get targetInRange() {
    if (!this.playerMesh) return false
    return this.playerMesh.userData.energy && this.distanceTo(this.playerMesh) < this.range
  }

  get ableToShoot() {
    return !this.dead && (this.age - this.last) * 1000 >= this.interval
  }

  createBullet() {
    const pos = this.position.clone()
    pos.y += this.height
    const bullet = new Bullet({ pos, damage: this.damage, damageDistance: this.damageDistance })
    this.scene.add(bullet.mesh)
    this.bullets.push(bullet)
  }

  removeBullet(bullet) {
    this.scene.remove(bullet.mesh)
    this.bullets.splice(this.bullets.indexOf(bullet), 1)
  }

  removeBullets() {
    this.bullets.forEach(bullet => this.scene?.remove(bullet.mesh))
    this.bullets = []
  }

  update(delta) {
    this.age += delta
    super.update(delta)

    if (this.targetInRange && this.ableToShoot) {
      this.createBullet()
      this.last = this.age
    }

    if (!this.targetInRange) this.removeBullets()

    this.bullets.forEach(bullet => {
      if (bullet.dead) this.removeBullet(bullet)
      bullet.update(delta)
    })
  }
}

export class AirportTower extends Tower {
  constructor(x, z) {
    super({ pos: [x, 0, z], range: 50, interval: 1500, damage: 10, damageDistance: 1, name: 'enemy' })
  }
}