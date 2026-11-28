import * as THREE from 'three'
import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'
import { shootDecals } from '/core3d/decals.js'
import { tracerMesh, trailLength } from '/core3d/actor/ProjectilesModel.js'
import PowerMeter from '/ui/PowerMeter.js'
import { tankGun } from './TankGun.js'

const shotLook = { flash: .105, shellReveal: .024, muzzleSmoke: .58, fireball: .28, impactSmoke: 1.1, trail: 12 }
/** How quickly the barrel follows the lay of the shot, a share of the way each second. */
const barrelPace = 10
const textureLoader = new THREE.TextureLoader()

function sprite(map, color, blending = THREE.NormalBlending) {
  const effect = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, blending, transparent: true, depthWrite: false, toneMapped: false }))
  effect.visible = false
  return effect
}

function show(sprite, origin, size, opacity) {
  sprite.position.copy(origin)
  sprite.scale.setScalar(size)
  sprite.material.opacity = opacity
  sprite.visible = true
}

/** A brief muzzle flash, a moving shell and trail, then a fireball and rising dust at the impact. */
export default class TankGunModel {
  constructor(gun) {
    this.gun = gun
    this.mesh = new THREE.Group()
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: audioPoint(gun.tank) })
    // the barrel goes down as the shot is charged, to show where the shell will come down (owner, 2026-11-28)
    this.barrel = gun.tank.mesh.getObjectByName('gun')
    this.sounds = [this.shotSound]
    const [min, max] = tankGun.range
    this.power = new PowerMeter({ min, max, chargePerSecond: tankGun.charge })
    this.power.element.setAttribute('aria-label', 'Shot power')
    // the power stands under the health, as it always does; an attribute, as a change of style sets its classes anew
    this.power.element.dataset.row = 'second'

    const fire = textureLoader.load(`${assets.textures}particles/fireball.png`)
    const smoke = textureLoader.load(`${assets.textures}particles/smoke.png`)
    this.flash = sprite(fire, 0xffd091, THREE.AdditiveBlending)
    this.smoke = sprite(smoke, 0xa29a89)
    this.fireball = sprite(fire, 0xffa348, THREE.AdditiveBlending)
    this.dust = [sprite(smoke, 0x61564b), sprite(smoke, 0xa38c70), sprite(smoke, 0x7c6a55)]

    this.shell = tracerMesh.clone(true)
    const [head, trail] = this.shell.children
    head.scale.set(.7, .7, .16)
    head.material = new THREE.MeshBasicMaterial({ color: 0xffecb5, fog: false, toneMapped: false })
    head.material.userData.outlineParameters = { visible: false }
    trail.scale.set(.75, .75, 0)
    this.trail = trail
    this.shell.visible = false
    this.mesh.add(this.shell, this.flash, this.smoke, this.fireball, ...this.dust)
    this.seen = { shot: gun.lastShot, blasts: gun.blasts }
    this.impactAge = Infinity
  }

  announceImpact() {
    const { lastBlast: at, lastScar: scar } = this.gun
    this.impactAge = 0
    this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: at.clone() } })
    if (scar && this.mesh.parent) shootDecals(scar, { scene: this.mesh.parent, size: [1.2, 1.8] })
  }

  showShot({ from, to, way, age, duration }) {
    const { flash, smoke, shell, trail } = this
    flash.visible = age < shotLook.flash
    if (flash.visible) {
      const progress = age / shotLook.flash
      show(flash, from, .72 + 1.05 * progress, 1 - progress ** 2)
      flash.position.addScaledVector(way, .17 + progress * .28)
    }
    smoke.visible = age < shotLook.muzzleSmoke
    if (smoke.visible) {
      const progress = age / shotLook.muzzleSmoke
      show(smoke, from, .36 + progress * 1.15, .48 * (1 - progress))
      smoke.position.addScaledVector(way, .25 + progress * .75)
      smoke.position.y += progress * .55
    }
    shell.visible = age >= shotLook.shellReveal && age < duration
    if (shell.visible) {
      const progress = age / duration
      shell.position.lerpVectors(from, to, progress)
      shell.lookAt(to)
      trail.scale.z = Math.min(shotLook.trail, from.distanceTo(to) * progress) / trailLength
    }
  }

  showImpact() {
    const { lastBlast: at } = this.gun
    const { fireball, impactAge, dust } = this
    fireball.visible = impactAge < shotLook.fireball
    if (fireball.visible) {
      const progress = impactAge / shotLook.fireball
      show(fireball, at, 1.45 + progress * 3.4, (1 - progress) ** 1.5)
      fireball.position.y += .28 + progress * .75
    }
    for (const [i, cloud] of dust.entries()) {
      const age = impactAge - i * .04
      cloud.visible = age >= 0 && age < shotLook.impactSmoke
      if (!cloud.visible) continue
      const progress = age / shotLook.impactSmoke
      const spread = .25 + progress * 1.3
      show(cloud, at, .9 + progress * 3.1, (.5 + i * .09) * (1 - progress) * Math.min(1, .25 + progress * 12))
      cloud.position.x += (i - 1) * spread
      cloud.position.z += (i - 1) * spread * .5
      cloud.position.y += .24 + progress * (1.3 + i * .4)
    }
  }

  update(dt = 0) {
    const { gun, seen, barrel } = this
    this.power.value = gun.power
    this.power.render()
    if (barrel) barrel.rotation.x += (gun.lay - barrel.rotation.x) * Math.min(1, dt * barrelPace)
    if (gun.lastShot !== seen.shot) {
      seen.shot = gun.lastShot
      this.shotSound.play()
    }
    if (gun.lastShot) this.showShot(gun.lastShot)
    this.impactAge += dt
    if (gun.blasts !== seen.blasts) {
      seen.blasts = gun.blasts
      this.announceImpact()
    }
    this.showImpact()
  }

  end() {
    this.power.end()
  }
}
