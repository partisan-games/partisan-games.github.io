import HullSprite from './HullSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { bodyImage, wreckFor } from '/core/actor/wreckView.js'

const boatPicture = 'armies/camac.png'

/**
 * How the partisan motor boat looks and sounds from above: its hull, wrecked once it is lost, its engine and wake, the
 * shots of its bow gun and their rounds. It only reads the body.
 */
export default class BoatSprite extends HullSprite {
  constructor(body, { projection, camera }) {
    super(body, boatPicture, { projection, camera, z: -1 })
    wreckFor(boatPicture)
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.engineSound = new Sound('engine-boat.mp3', { steady: true, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.wakeSound = new Sound('water-wake.mp3', { volume: .2, mixOffset: -1, loop: true, profile: 'water', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.engineSound, this.wakeSound)
    this.shotsSeen = body.shotsFired
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.engineSound.setPlaying(body.alive)
    this.wakeSound.setPlaying(body.alive && Math.hypot(body.vx, body.vz) > 2)
    if (body.shotsFired > this.shotsSeen) this.shotSound.play()
    this.shotsSeen = body.shotsFired
    this.syncRounds()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.drawImage(bodyImage(this), -this.width / 2, -this.height / 2, this.width, this.height)
    ctx.restore()
  }
}
