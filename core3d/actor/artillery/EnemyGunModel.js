import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'
import { Explosion, FlameUp, Smoke } from '/core3d/Particles.js'
import GunImpactCloud from './GunImpactCloud.js'

const flashTime = .105
const recoilTime = .24
const smokeTime = 2.4
const smokeOpacity = .36

/** The stationed gun recoils and flashes when it fires, shows hits and gives way to its wreck on destruction. */
export default class EnemyGunModel {
  constructor(gun, { visual, damaged, wreck }) {
    Object.assign(this, { gun, visual, damaged, wreck })
    this.mesh = new THREE.Group()
    this.seen = { shots: gun.shotsFired, blasts: gun.blasts, hits: gun.hitsTaken }
    this.recoilAge = this.smokeAge = Infinity
    this.elevation = visual.getObjectByName('Elevation')
    this.damagedElevation = damaged?.getObjectByName('Elevation')
    this.restZ = this.elevation?.position.z
    this.muzzle = visual.getObjectByName('Muzzle')
    this.effectPoint = new THREE.Vector3()
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => visual.position } })
    this.sounds = [this.shotSound]
    this.explosion = new Explosion({ size: 3 })
    this.flash = new Explosion({ size: .48, num: 9, color: 0xffc182 })
    this.embers = new FlameUp({ num: 12, size: .52, color: 0xffa050, opacity: .85,
      minRadius: .02, maxRadius: .21, minVelocity: .75, maxVelocity: 1.35, min: -.65 })
    this.embers.mesh.frustumCulled = false
    this.smoke = new Smoke({ num: 8, size: .5, opacity: smokeOpacity, color: 0x777167, maxRadius: .16,
      minVelocity: .3, maxVelocity: .65 })
    for (const effect of [this.explosion, this.flash, this.embers, this.smoke]) {
      effect.mesh.visible = false
      this.mesh.add(effect.mesh)
    }
  }

  updateMuzzle() {
    const { recoilAge: age, elevation, damagedElevation, flash } = this
    if (elevation) {
      elevation.position.z = this.restZ + .16 * Math.max(0, 1 - age / recoilTime) ** 2
      if (damagedElevation) damagedElevation.position.z = elevation.position.z
    }
    flash.mesh.visible = this.gun.alive && age < flashTime
    if (!flash.mesh.visible) return
    const progress = age / flashTime
    this.muzzle?.getWorldPosition(flash.mesh.position)
    flash.mesh.scale.setScalar(1 + progress * 1.6)
    flash.mesh.material.opacity = 1 - progress ** 2
    flash.mesh.material.size = .48 + progress * .32
  }

  update(dt, t) {
    const { gun, seen, visual, damaged, wreck } = this
    visual.rotation.y = wreck.rotation.y = gun.yaw + Math.PI
    if (damaged) {
      damaged.rotation.y = visual.rotation.y
      damaged.visible = gun.alive && gun.hitsTaken > 0
    }
    visual.visible = gun.alive && !damaged?.visible
    wreck.visible = gun.dead
    this.recoilAge += dt
    if (gun.shotsFired > seen.shots) {
      this.shotSound.play()
      const pos = this.muzzle?.getWorldPosition(this.effectPoint) ?? visual.localToWorld(this.effectPoint.set(0, .84, -1.4))
      this.flash.reset({ pos, unitAngle: .12 })
      this.recoilAge = 0
    }
    this.updateMuzzle()
    if (gun.blasts > seen.blasts) {
      this.explosion.reset({ pos: gun.lastBlast, unitAngle: .2 })
      this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: gun.lastBlast.clone() } })
    }
    if (gun.state === 'wreck') {
      this.explosion.mesh.visible = false
      if (this.hit) this.hit.mesh.visible = false
    }
    this.explosion.expand({ velocity: 1.1, maxRounds: 30 })
    if (gun.alive && gun.hitsTaken > seen.hits) {
      this.hit ??= new GunImpactCloud()
      if (!this.hit.mesh.parent) this.mesh.add(this.hit.mesh)
      this.hit.start(visual.localToWorld(this.effectPoint.set(0, .72, -.32)), gun.health.current / gun.health.maximum)
    }
    this.hit?.update(dt)
    this.smokeAge += dt
    if (gun.state === 'dead' && seen.state !== 'dead') {
      wreck.localToWorld(this.effectPoint.set(0, .32, .10))
      this.embers.reset({ pos: this.effectPoint, unitAngle: .15, opacity: .85 })
      wreck.localToWorld(this.effectPoint.set(0, .45, 0))
      this.smoke.reset({ pos: this.effectPoint, unitAngle: .13, opacity: smokeOpacity })
      this.smokeAge = 0
    }
    this.embers.mesh.visible = gun.state === 'dead'
    if (this.embers.mesh.visible) this.embers.update(dt, t)
    this.smoke.mesh.visible = gun.state === 'dead' && this.smokeAge < smokeTime
    if (this.smoke.mesh.visible) {
      this.smoke.update(dt, t, { rotateY: 0 })
      this.smoke.mesh.material.opacity = smokeOpacity * (1 - this.smokeAge / smokeTime)
    }
    Object.assign(seen, { shots: gun.shotsFired, blasts: gun.blasts, hits: gun.hitsTaken, state: gun.state })
  }

  end() {
    this.hit?.end()
  }
}
