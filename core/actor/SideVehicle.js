import Sound from '/core/io/audio/SoundSource.js'
import GameObject2D from './GameObject2D.js'
import ProjectilePool from './ProjectilePool.js'
import Rocket from './projectiles/Rocket.js'
import Weapon from '/core/gameplay/Weapon.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import { nearestTarget } from './targeting.js'

export default class SideVehicle extends GameObject2D {
  constructor(src, { session, ...params } = {}) {
    super(src, { speed: 120, flammable: true, ...params })
    this.tags.add('neprijatelj')
    this.session = session
    this.engineSound = new Sound('engine-diesel.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound)
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Rocket({ src: 'items/raketa.png', scale: .55 }) })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: 10, clock: session.clock }),
      spawnProjectile: (position, angle) => this.bullets.fire(position, angle, 500),
    })
    this.weapon.cooldown.start()
  }

  onload() {
    this.y -= this.height / 2
  }

  patrol() {
    if (this.dead) return

    if (this.x <= 150)
      this.turn(0)

    if (this.x >= 600)
      this.turn(Math.PI)

    this.updateImage()
  }

  updateImage() {
    this.flipX = this.angle === Math.PI ? -1 : 1
  }

  update(dt, t) {
    this.engineSound.setPlaying(!this.dead)
    super.update(dt, t)
    if (this.session.state !== 'running') return
    const target = nearestTarget(this.position, this.targets)
    if (!this.dead && target) this.weapon.tryFire(this.position, this.angleTo(target))
    this.bullets.checkHits(this.targets)
  }
}
