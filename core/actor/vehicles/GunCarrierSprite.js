import BodySprite from '/core/actor/BodySprite.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * The source drawings of each kind, until their own art comes, the way its front points (1 right, -1 left), and the
 * sound of its engine.
 */
export const gunCarrierPictures = {
  motorcycle: { src: 'armies/nemci/motori/mg34.png', facing: 1, engine: 'engine-6000.mp3' },
  halftrack: { src: 'armies/nemci/vozila/sdkfz-251-05.png', facing: -1, engine: 'engine-diesel.mp3' },
  armoredCar: { src: 'armies/nemci/vozila/sdkfz-221-02.png', facing: -1, engine: 'engine-diesel.mp3' },
}

/**
 * How a machine-gun carrier drawn as its `picture` looks and sounds in 2D: the vehicle with its crew, its engine, the
 * bursts of its gun and their rounds, and its fire once wrecked. It only reads the body.
 */
export default class GunCarrierSprite extends BodySprite {
  constructor(body, { picture, projection, camera, z }) {
    super(body, picture.src, { projection, camera, facing: picture.facing, flammable: true, z })
    this.engineSound = new Sound(picture.engine, { steady: true, loop: true, volume: .5, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.gunSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.gunSound)
    this.shotsSeen = body.shotsFired
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > this.shotsSeen && body.burstFired === 1) this.gunSound.play()
    this.shotsSeen = body.shotsFired
    this.syncViews(body.bullets.projectiles, round => new BulletSprite(round, this.projection, { scale: .4 }))
  }
}
