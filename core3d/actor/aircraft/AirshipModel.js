import { AnimationMixer } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Sound from '/core/io/audio/SoundSource.js'
import { audioPoint } from '/core/io/audio/audio3d.js'
import { getMesh } from '/core3d/helpers.js'

/**
 * How an airship looks and sounds in 3D: its model on the body's place, turned its way and nosed up as it pitches,
 * its propellers, at `propellerPlaces` on the hull, turning as fast as it flies, its own clip playing in the air, and its
 * engine humming while it is off the ground. It only reads the body.
 */
export default class AirshipModel {
  constructor(body, { mesh, propeller, propellerPlaces = [] }) {
    this.body = body
    const animations = mesh.userData.animations ?? []
    this.mesh = animations.length ? clone(mesh) : mesh.clone()
    this.mesh.rotation.order = 'YZX'
    this.propellers = propellerPlaces.map(([x, y, z]) => {
      const part = propeller.clone()
      part.position.set(x, y, z)
      this.mesh.add(part)
      return part
    })
    if (animations.length) {
      this.mixer = new AnimationMixer(getMesh(this.mesh))
      this.action = this.mixer.clipAction(animations[0])
    }
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: audioPoint(this) })
    this.sounds = [this.engineSound]
    this.place()
  }

  place() {
    const { body, mesh } = this
    mesh.position.set(body.x, body.feet, body.z)
    // the model faces -z, the body +x at yaw 0
    mesh.rotation.set(body.pitch, body.yaw - Math.PI / 2, 0)
  }

  update(dt) {
    const { body } = this
    this.place()
    const flying = body.alive && !body.touchingGround
    this.engineSound.setPlaying(flying)
    if (flying) this.propellers.forEach(propeller => propeller.rotateZ(-body.speed * dt))
    if (this.action) {
      if (flying) this.action.play()
      else this.action.stop()
      this.mixer.update(dt)
    }
  }
}
