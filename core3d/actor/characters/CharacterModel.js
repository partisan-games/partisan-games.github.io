import { Box3, LoopOnce, LoopRepeat, Vector3 } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Animator from '/core3d/actor/Animator.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'
import { getSize } from '/core3d/helpers.js'

/** The clips played once and held at their end; every other clip loops. */
const once = ['attack', 'attack2', 'special', 'jump', 'pain', 'death']
/** Seconds a clip takes to blend into the next. */
const fade = .25
/** A blow reaching farther than this, in metres, is a shot, and sparks where it ends. */
const shotReach = 9

/** The seconds of each one-off clip in `animDict`, which a character's body takes as the lengths of its actions. */
export function clipLengths(animations, animDict) {
  const lengths = {}
  for (const name of ['attack', 'attack2', 'special', 'jump', 'pain']) {
    const clip = animations.find(clip => clip.name === animDict[name])
    if (clip) lengths[name] = clip.duration
  }
  return lengths
}

/** The hit box of a model as a character's body takes it: its depth is its length. */
export function modelSize(mesh) {
  const { x, y, z } = mesh.userData.visibleSize ?? getSize(mesh)
  return { length: z, height: y, width: x }
}

/**
 * How a character on foot looks and sounds in 3D: its model, standing on the body's feet and facing its way, playing
 * the clip of what it does, with its weapon in its hands; its steps, its blows, the thud of a hit or a landing,
 * sparks where a shot ends and the `flame` of its attack. A model whose feet sink below its soles is
 * drawn `raise` metres higher; dead, an `intact` one, as a gun whose crew has fallen, stays as it stands. It only reads
 * the body.
 */
export default class CharacterModel {
  constructor(body, { mesh, animations = mesh.userData.animations ?? [], animDict = {}, twoHandedWeapon,
    rightHandWeapon, attackSound, attackProfile = 'rifle', flame = null, raise = 0, deathPose = null,
    impactAt = () => null }) {
    this.body = body
    Object.assign(this, { raise, flameKind: flame, impactAt, deathPose })
    this.bounds = new Box3()
    this.mesh = animations.length ? clone(mesh) : mesh.clone()
    this.anim = animations.length
      ? new Animator({ mesh: this.mesh, animations, animDict, twoHandedWeapon, rightHandWeapon }) : null
    this.sounds = []
    this.stepSound = new Sound('footstep-gravel-01.mp3', { variants: Array.from({ length: 11 }, (_, i) => `footstep-gravel-${String(i + 2).padStart(2, '0')}.mp3`), profile: 'footstep', spatial: audioPoint(this) })
    this.impactSound = new Sound('body-impact-01.mp3', { variants: ['body-impact-03.mp3', 'body-impact-04.mp3'], profile: 'impact', spatial: audioPoint(this) })
    this.sounds.push(this.stepSound, this.impactSound)
    if (attackSound) {
      this.attackSound = new Sound(attackSound, { profile: attackProfile, spatial: audioPoint(this) })
      this.sounds.push(this.attackSound)
    }
    if (flame) {
      if (!flame.duration) {
        this.fireSound = new Sound('fire.mp3', { loop: true, volume: .2, profile: 'fire', spatial: audioPoint(this) })
        this.sounds.push(this.fireSound)
      }
      import('/core3d/Particles.js').then(particles => {
        if (this.ended) return
        this.flame = flame.particles ? new particles[flame.particles]()
          : new particles.Flame({ num: 25, size: flame.duration ? .3 : flame.weaponMuzzle ? .65 : 5,
            minRadius: 0, maxRadius: .5, minVelocity: 2.5, maxVelocity: 5 })
        this.flame.mesh.material.opacity = 0
        this.flame.mesh.visible = false
      })
    }
    this.clip = null
    this.walked = 0
    this.seen = { shots: body.shotsFired, hits: body.hitsTaken, airborne: body.airborne, alive: body.alive }
    this.place()
    this.play(this.chooseClip())
    this.anim?.mixer.update(0)
  }

  get actions() {
    return this.anim?.actions ?? {}
  }

  place() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.feet + this.raise, body.z)
    // the model faces -z, the body +x at yaw 0
    mesh.rotation.set(0, body.yaw - Math.PI / 2, 0, 'YXZ')
  }

  /** The clip of what the body does now, or the one playing when it has none for that. */
  chooseClip() {
    const { body, actions } = this
    const has = name => name in actions
    if (body.dead) return 'death'
    if (body.hurt > 0 && has('pain')) return 'pain'
    if (body.state === 'attack' && body.swing) return body.swing.kind
    if (body.airborne) {
      if (body.leap > 0 || body.vy > 0) return has('jump') ? 'jump' : this.clip
      return has('fall') ? 'fall' : this.clip
    }
    if (body.aiming && has('aimIdle')) {
      if (body.state === 'move') return body.running && has('aimRun') ? 'aimRun' : has('aimWalk') ? 'aimWalk' : 'aimIdle'
      return 'aimIdle'
    }
    if (body.state === 'move') return body.running && has('run') ? 'run' : has('walk') ? 'walk' : 'idle'
    return 'idle'
  }

  /** Blends into `name`; going backwards, a walk, run or jump plays back to front. */
  play(name) {
    const backwards = ['walk', 'run', 'aimWalk', 'aimRun', 'jump'].includes(name) && this.body.steering.ahead < 0
    if (name === this.clip && backwards === this.backwards) return
    const previous = this.actions[this.clip]
    this.clip = name
    this.backwards = backwards
    const action = this.actions[name]
    if (!action) {
      if (name === 'idle' && this.actions.walk) {
        this.anim.mixer.stopAllAction()
        this.actions.walk.reset().play()
        this.actions.walk.paused = true
      } else if (previous) previous.paused = true
      return
    }
    action.reset()
    // an attack of its own, as a dance move, is played once too
    action.setLoop(once.includes(name) || name === this.body.swing?.kind ? LoopOnce : LoopRepeat, Infinity)
    action.clampWhenFinished = true
    // a clip keeps its own pace, as a run made of a faster walk
    action.setEffectiveTimeScale((backwards ? -1 : 1) * Math.abs(action.timeScale || 1))
    if (backwards) action.time = action.getClip().duration
    if (previous && previous !== action) action.crossFadeFrom(previous, fade)
    action.play()
  }

  /** An unrigged vehicle settles on its side, a tank tilting less and burning. */
  showDeath(dt) {
    const { body, mesh, deathPose } = this
    if (deathPose === 'intact') return
    if (!this.actions.death) {
      const t = Math.min(body.stateTime / .9, 1)
      const ease = t * t * (3 - 2 * t)
      const airborne = body.altitude && body.feet > body.supportHeight + .01
      this.settled = airborne ? 0 : Math.min((this.settled ?? 0) + dt / .55, 1)
      mesh.rotation.z = (deathPose === 'armor' ? .24 : 1.45) * ease
      if (deathPose === 'armor') this.charWreck()
    }
    // Ground the actual deformed skin, including a long gun, and cache its held final pose.
    if (this.finalOffset === undefined) {
      mesh.updateMatrixWorld(true)
      this.bounds.setFromObject(mesh, true)
      const aboveGround = body.altitude && body.feet > body.supportHeight + .01
      const offset = this.bounds.isEmpty() ? 0 : aboveGround
        ? Math.max(0, body.supportHeight - this.bounds.min.y) : body.feet - this.bounds.min.y
      mesh.position.y += offset
      if (this.actions.death?.paused || (!this.actions.death && body.stateTime >= .9 && this.settled === 1))
        this.finalOffset = offset
    } else mesh.position.y += this.finalOffset
  }

  charWreck() {
    if (this.wreckMaterials) return
    this.wreckMaterials = []
    const char = original => {
      const material = original.clone()
      material.color?.multiplyScalar(.28)
      this.wreckMaterials.push(material)
      return material
    }
    this.mesh.traverse(part => {
      if (part.isMesh) part.material = Array.isArray(part.material) ? part.material.map(char) : char(part.material)
    })
  }

  update(dt, t) {
    const { body, seen } = this
    const before = this.mesh.position.clone()
    this.place()
    this.play(this.chooseClip())
    this.anim?.update(dt)
    if (body.dead) this.showDeath(dt)
    if (body.shotsFired > seen.shots) this.strike()
    if (body.hitsTaken > seen.hits || (seen.airborne && !body.airborne && body.alive)) this.impactSound.play()
    this.step(before)
    this.ricochet?.expand({ velocity: 1.2, maxRounds: 5, gravity: .02 })
    this.burn(dt, t)
    Object.assign(seen, { shots: body.shotsFired, hits: body.hitsTaken, airborne: body.airborne, alive: body.alive })
  }

  /** A step sounds each stride it walks on the ground. */
  step(before) {
    const { body } = this
    if (body.dead || body.altitude || body.airborne || this.deathPose === 'armor' || body.state !== 'move') {
      this.walked = 0
      return
    }
    this.walked += before.distanceTo(this.mesh.position)
    const stride = Math.max(.25, body.size.height * .4)
    if (this.walked < stride) return
    this.walked %= stride
    this.stepSound.play()
  }

  /**
   * Its flame, of the `particles` named or a plain one, burns while it attacks with one of the flame's `kinds`, from the
   * start of the attack or, `fromBlow`, from the moment its blow lands; it pours ahead from its hands, or with
   * `around`, it burns where it stands.
   */
  burn(dt, t) {
    const { flame, body } = this
    if (!flame) return
    const { kinds = ['attack', 'attack2'], fromBlow = false, around = false, duration, muzzle, weaponMuzzle } = this.flameKind
    const { swing } = body
    const burning = body.state === 'attack' && body.alive && kinds.includes(swing?.kind) && (!fromBlow || swing.landed)
      && (!duration || swing.time <= swing.length / 2 + duration)
    if (burning && !this.burning) {
      this.mesh.parent?.add(flame.mesh)
      flame.reset({ pos: this.mesh.position, unitAngle: muzzle || weaponMuzzle ? .12 : .5 })
    }
    if (burning) {
      flame.mesh.position.copy(this.mesh.position)
      flame.mesh.rotation.copy(this.mesh.rotation)
      flame.mesh.rotateX(Math.PI)
      if (weaponMuzzle) {
        const gun = this.anim.twoHandedWeapon
        gun.localToWorld(flame.mesh.position.fromArray(weaponMuzzle))
        gun.getWorldQuaternion(flame.mesh.quaternion)
      } else if (muzzle)
        this.mesh.localToWorld(flame.mesh.position.fromArray(muzzle))
      else if (!around) {
        flame.mesh.translateY(-1.2)
        flame.mesh.translateZ(1.75)
      }
    }
    this.burning = burning
    flame.mesh.visible = burning
    if (burning) flame.update(dt, t, { max: body.reach, loop: true })
    this.fireSound?.setPlaying(burning)
  }

  async strike() {
    this.attackSound?.play()
    const { body } = this
    if (body.reach <= shotReach || !body.strike) return
    const scene = this.mesh.parent
    if (this.ended || !scene) return
    const { from, to, target } = body.strike
    const direction = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }
    const distance = Math.hypot(direction.x, direction.y, direction.z)
    // Include the hit face despite rounding of the body's plain-coordinate endpoint.
    const impact = target ? null : this.impactAt(from, direction, distance + .001)
    if (!target && !impact) return
    if (!this.ricochet) {
      const [{ default: Particles }, { shootDecals }] = await Promise.all([
        import('/core3d/Particles.js'), import('/core3d/decals.js'),
      ])
      if (this.ended || this.mesh.parent !== scene) return
      this.ricochet ??= new Particles({ num: 100, size: .05, unitAngle: .2 })
      this.shootDecals = shootDecals
    }
    this.ricochet.reset({ pos: new Vector3(to.x, to.y, to.z), unitAngle: .2, color: target ? 0x8a0303 : 0xcccccc })
    scene.add(this.ricochet.mesh)
    if (impact) this.shootDecals(impact, { scene, color: 0x000000 })
  }

  end() {
    if (this.ended) return
    this.ended = true
    this.wreckMaterials?.forEach(material => material.dispose())
    for (const effect of [this.ricochet, this.flame]) {
      if (!effect) continue
      const { mesh } = effect
      mesh.geometry.dispose()
      mesh.material.map?.dispose()
      mesh.material.dispose()
      mesh.removeFromParent()
    }
  }
}
