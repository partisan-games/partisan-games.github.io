import { Vector3 } from 'three'
import { mapRange } from '/core3d/helpers.js'
import { loadedModel } from '/core3d/assets/models.js'
import Vehicle from '/core3d/physics/Vehicle.js'
import { models as hotchkissModels } from '/core3d/actor/derived/Hotchkiss.js'
import { hotchkissTrackMotion } from '/core3d/actor/derived/HotchkissTracks.js'
import { Smoke } from '/core3d/Particles.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'

const wheelFront = { x: .75, y: .1, z: 1.25 }
const wheelBack = { x: .75, y: .1, z: -1.25 }

/**
 * The Hotchkiss H35 of Kraljevo, at its real size, centred on the wheels of the body; it drives forward as built, at
 * most 28 km/h, as fast as the real one (owner, 2026-11-28).
 */
const model = { ...hotchkissModels[0], shouldCenter: true }

/** What to load; a game awaits requestModels(models) before it creates one. */
export const models = [model]

const smokeParam = { size: .5, num: 25, maxRadius: .22, color: 0xffffff, opacity: .5 }

export default class Tank extends Vehicle {
  constructor(param = {}) {
    super({ mesh: loadedModel(model).clone(), wheelFront, wheelBack, maxSpeed: 28, maxEngineForce: 1000, ...param })
    const forward = new Vector3()
    this.tracks = hotchkissTrackMotion(this.mesh, () => {
      const { position: { x, z }, quaternion } = this.mesh
      forward.set(0, 0, 1).applyQuaternion(quaternion)
      return { x, z, yaw: Math.atan2(-forward.z, forward.x) }
    })
    this.zvuk = new Sound('engine-6000.mp3', { volume: .2, loop: true, profile: 'engine', spatial: audioPoint(this) })
    this.sounds.push(this.zvuk)
    this.smokeLeft = this.createSmoke()
    this.smokeLeft.mesh.translateX(.4)
    this.smokeRight = this.createSmoke()
    this.smokeRight.mesh.translateX(-.4)
  }

  createSmoke() {
    const smoke = new Smoke(smokeParam)
    smoke.mesh.translateY(.5)
    // the exhaust is at the back
    smoke.mesh.translateZ(-2)
    smoke.mesh.rotateX(-Math.PI * .5)
    this.mesh.add(smoke.mesh)
    return smoke
  }

  /** The centre of the muzzle ring, which goes down with the gun. */
  get muzzle() {
    return this.mesh.getObjectByName('muzzle')?.getWorldPosition(new Vector3())
  }

  end() {
    super.end()
    this.tracks?.dispose()
    this.zvuk.stop() // the engine must not go on in the next game
  }

  updateMeshes() {
    super.updateMeshes()
    this.tracks?.update()
  }

  update(delta, t) {
    super.update(delta)
    this.zvuk.volume = .15 + .2 * Math.min(1, Math.abs(this.engineForce) / this.maxEngineForce)
    this.zvuk.setPlaying(true)

    const maxVelocity = mapRange(this.speed, 0, 30, 3, 8)
    const options = { min: -1.25, minVelocity: maxVelocity / 2, maxVelocity, loop: this.input.keyPressed }

    this.smokeLeft.update(delta, t, options)
    this.smokeRight.update(delta, t, options)

    if (!this.input.controlsPressed) {
      this.smokeLeft.reset({ randomize: false, opacity: smokeParam.opacity })
      this.smokeRight.reset({ randomize: false, opacity: smokeParam.opacity })
    }
  }
}
