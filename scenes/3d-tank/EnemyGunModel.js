import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * How a German gun looks and sounds: its drawn `visual`, made facing -z, turns to where it aims; each shot bangs at the
 * gun and bursts where it lands, and a destroyed gun smokes. It only reads the gun.
 */
export default class EnemyGunModel {
  constructor(gun, visual) {
    Object.assign(this, { gun, visual })
    this.mesh = new THREE.Group()
    this.seen = { shots: gun.shotsFired, blasts: gun.blasts }
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => visual.position } })
    this.sounds = [this.shotSound]
    import('/core3d/Particles.js').then(({ Explosion, BigSmoke }) => {
      this.explosion = new Explosion({ size: 3 })
      this.smoke = new BigSmoke()
      this.smoke.mesh.position.copy(visual.position)
      this.smoke.mesh.visible = false
      this.mesh.add(this.explosion.mesh, this.smoke.mesh)
    })
  }

  update(dt, t) {
    const { gun, seen, visual } = this
    visual.rotation.y = gun.yaw + Math.PI
    if (gun.shotsFired > seen.shots) this.shotSound.play()
    if (gun.blasts > seen.blasts) {
      this.explosion?.reset({ pos: gun.lastBlast.clone(), unitAngle: .2 })
      this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: gun.lastBlast.clone() } })
    }
    Object.assign(seen, { shots: gun.shotsFired, blasts: gun.blasts })
    this.explosion?.expand({ velocity: 1.1, maxRounds: 30 })
    if (this.smoke) {
      this.smoke.mesh.visible = gun.dead
      if (gun.dead) this.smoke.update(dt, t)
    }
  }
}
