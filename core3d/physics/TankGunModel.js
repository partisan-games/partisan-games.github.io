import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'
import { shootDecals } from '/core3d/decals.js'
import PowerMeter from '/ui/PowerMeter.js'
import { tankGun } from './TankGun.js'

/**
 * How a tank's gun looks and sounds: the power bar its shot charges, the shot from the tank each time it fires, the fireball and bang where each
 * shell bursts, and the scorch it leaves on a wall or the ground. Its explosion sits in its own mesh, which the scene
 * adds; it only reads the gun.
 */
export default class TankGunModel {
  constructor(gun) {
    this.gun = gun
    this.mesh = new THREE.Group()
    this.seen = { shots: gun.shotsFired, blasts: gun.blasts }
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: audioPoint(gun.tank) })
    this.sounds = [this.shotSound]
    const [min, max] = tankGun.range
    this.power = new PowerMeter({ min, max, chargePerSecond: tankGun.charge })
    this.power.element.setAttribute('aria-label', 'Shot power')
    import('/core3d/Particles.js').then(({ Explosion }) => {
      this.explosion = new Explosion({ size: 3 })
      this.mesh.add(this.explosion.mesh)
    })
  }

  update() {
    const { gun, seen } = this
    this.power.value = gun.power
    this.power.render()
    if (gun.shotsFired > seen.shots) this.shotSound.play()
    if (gun.blasts > seen.blasts) {
      this.explosion?.reset({ pos: gun.lastBlast.clone(), unitAngle: .2 })
      this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: gun.lastBlast.clone() } })
      if (gun.lastScar && this.mesh.parent) shootDecals(gun.lastScar, { scene: this.mesh.parent, size: [1.2, 1.8] })
    }
    Object.assign(seen, { shots: gun.shotsFired, blasts: gun.blasts })
    this.explosion?.expand({ velocity: 1.1, maxRounds: 30 })
  }

  end() {
    this.power.end()
  }
}
