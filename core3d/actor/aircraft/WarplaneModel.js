import * as THREE from 'three'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'
import { shootDecals } from '/core3d/decals.js'

/** The scorch a crashed plane leaves on the ground, as wide as its wingspan at most, in metres. */
const scorchSize = { least: 6, most: 9 }
const down = { x: 0, y: -1, z: 0 }

const missileMesh = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 2), new THREE.MeshBasicMaterial({ color: 0x333333 }))
missileMesh.rotateX(Math.PI * .5)

/** A missile in flight: its body and the roar of its rocket, seen while it flies. */
class MissileModel {
  constructor(body) {
    this.body = body
    this.mesh = missileMesh.clone()
    this.thrustSound = new Sound('rocket-thrust.mp3', { volume: .3, loop: true, profile: 'flight', spatial: audioPoint(this) })
    this.sounds = [this.thrustSound]
  }

  update() {
    const { body, mesh } = this
    const flying = body.state === 'flight'
    mesh.visible = flying
    mesh.position.set(body.x, body.y, body.z)
    this.thrustSound.setPlaying(flying)
  }
}

/**
 * How a warplane looks and sounds in 3D: its model where the body flies, nosed up as it pitches and banked as it rolls,
 * its propeller, if it has one at `propellerPlace`, turning as fast as it flies, smoke trailing from the first hit on,
 * its engine while it flies and, when it comes down shot, the blast and crash of its fall, its wreck burning and the
 * scorch on the ground under it, which `impactAt(from, direction, far)` finds, as `worldQueries` gives; its missiles,
 * if it fires them, and the blast and bang where each one bursts. It only reads the body.
 */
export default class WarplaneModel {
  constructor(body, { mesh, propeller, propellerPlace = [0, .63, -.5], propellerName, impactAt }) {
    this.body = body
    this.impactAt = impactAt
    this.mesh = mesh.clone()
    this.mesh.rotation.order = 'YXZ'
    if (propeller) {
      this.propeller = propeller.clone()
      this.propeller.position.set(propellerPlace[0], propellerPlace[1], propellerPlace[2] * body.size.length)
      this.mesh.add(this.propeller)
    }
    if (propellerName) {
      this.propeller = this.mesh.getObjectByName(propellerName)
      if (!this.propeller) throw new Error(`Missing aircraft propeller: ${propellerName}`)
    }
    this.missiles = []
    this.bursts = new Map()
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .25, loop: true, profile: 'engine', spatial: audioPoint(this) })
    this.crashSound = new Sound('metal-impact.mp3', { profile: 'impact', spatial: audioPoint(this) })
    this.sounds = [this.engineSound, this.crashSound]
    this.audioChildren = this.missiles
    this.seen = { hits: 0, crashed: false }
    import('/core3d/Particles.js').then(({ Explosion, Smoke, Fire }) => {
      this.explosion = new Explosion({ size: 4 })
      Object.assign(this, { Smoke, Fire })
    })
    this.place()
  }

  place() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.y, body.z)
    mesh.rotation.set(body.pitch, body.yaw - Math.PI / 2, body.roll)
  }

  /** A model for each missile of the pool, if it fires missiles, made the first time the pool has it. */
  syncMissiles() {
    for (const missile of (this.body.missiles?.projectiles ?? []).slice(this.missiles.length)) {
      const model = new MissileModel(missile)
      this.missiles.push(model)
      this.mesh.parent?.add(model.mesh)
      this.audioScene?.attach(model)
      this.bursts.set(missile, missile.bursts)
    }
  }

  /** The blast where the plane hits the ground, then its wreck burning and the scorch the ground keeps under it. */
  crash() {
    const { body } = this
    const point = new THREE.Vector3(body.x, body.y, body.z)
    this.crashSound.play()
    this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: point.clone() } })
    if (this.explosion) {
      this.explosion.reset({ pos: point, unitAngle: .2 })
      if (!this.explosion.mesh.parent) this.mesh.parent?.add(this.explosion.mesh)
    }
    if (this.Fire) {
      this.fire = new this.Fire()
      this.mesh.parent?.add(this.fire.mesh)
    }
    const ground = this.impactAt?.({ x: body.x, y: body.y + body.size.height, z: body.z }, down, body.size.height * 3)
    if (!ground || !this.mesh.parent) return
    this.scorch = shootDecals(ground, { scene: this.mesh.parent, size: [scorchSize.least, scorchSize.most] })
    // the ground may move, as under a plane that flies on, and the scorch with it
    ground.object.attach(this.scorch)
  }

  /** The fire on the wreck stands upright however the wreck lies. */
  burn(dt, t) {
    const { body, fire } = this
    if (!fire) return
    fire.mesh.position.set(body.x, body.y + body.size.height / 2, body.z)
    fire.update(dt, t, { min: -body.size.height, max: 0 })
  }

  /** Where a missile has burst since the last frame, the blast flares and bangs. */
  showBursts() {
    for (const { body: missile } of this.missiles) {
      if (missile.bursts === this.bursts.get(missile)) continue
      this.bursts.set(missile, missile.bursts)
      const point = { x: missile.x, y: missile.y, z: missile.z }
      if (this.explosion) {
        this.explosion.reset({ pos: new THREE.Vector3(point.x, point.y, point.z), unitAngle: .2 })
        if (!this.explosion.mesh.parent) this.mesh.parent?.add(this.explosion.mesh)
      }
      this.audioScene?.emit('explosion.mp3', { profile: 'explosion', spatial: { position: point } })
    }
  }

  update(dt, t) {
    const { body } = this
    this.place()
    this.engineSound.setPlaying(body.alive && !body.landing)
    if (body.dead && !body.airborne && !this.seen.crashed) {
      this.seen.crashed = true
      this.crash()
    }
    this.burn(dt, t)
    if ((body.hitsTaken > 0 || body.dead) && !this.smoke && this.Smoke) {
      this.smoke = new this.Smoke()
      this.mesh.add(this.smoke.mesh)
      this.smoke.mesh.position.y += body.size.height * .4
      this.smoke.mesh.position.z += body.size.length * .4
    }
    this.smoke?.update(dt, t, { min: body.health.current / 100 - 5 })
    this.propeller?.rotateZ(-body.speed * dt)
    this.syncMissiles()
    this.missiles.forEach(missile => missile.update())
    this.showBursts()
    this.explosion?.expand({ velocity: 1.1, maxRounds: 30 })
  }

  end() {
    this.missiles.forEach(missile => missile.mesh.removeFromParent())
    this.explosion?.mesh.removeFromParent()
    this.fire?.mesh.removeFromParent()
    this.scorch?.removeFromParent()
  }
}
