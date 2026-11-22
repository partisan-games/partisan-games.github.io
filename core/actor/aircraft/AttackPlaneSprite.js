import TopViewSprite from './TopViewSprite.js'
import AircraftPropellers from './AircraftPropellers.js'
import Sound from '/core/io/audio/SoundSource.js'

/** The pictures each kind of attack plane is drawn as, one picked for each plane. */
export const attackPlaneImages = {
  fighter: ['armies/nemci/avioni/bf-109-odozgo.png', 'armies/nemci/avioni/fw-190-odozgo.png', 'armies/nemci/avioni/avion-odozgo-01.png',
    'armies/nemci/avioni/avion-odozgo-02.png', 'armies/nemci/avioni/avion-odozgo-03.png', 'armies/nemci/avioni/avion-odozgo-05.png'],
  heavy: ['armies/nemci/avioni/bf-110-odozgo.png'],
  boss: ['armies/nemci/avioni/he-111-odozgo.png'],
}

/**
 * How an enemy plane looks and sounds from above, in the picture `src`: its turning propellers and engine, the shots of
 * its guns and their rounds, its fire once badly hit, and the bang and fall when it is shot down. It only reads the
 * body.
 */
export default class AttackPlaneSprite extends TopViewSprite {
  constructor(body, { src, projection, camera }) {
    super(body, src, { projection, camera })
    this.propellers = new AircraftPropellers(src)
    this.engineSound = new Sound('engine-aircraft.mp3', { loop: true, profile: 'engine', volume: .2, spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.shotSound = new Sound('rifle.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.explosionSound, this.shotSound)
    this.seen = { shots: body.shotsFired, alive: body.alive }
  }

  /** It burns once badly hit, when its flame has loaded. */
  get burning() {
    return this.flammable && this.body.burning
  }

  update(dt) {
    super.update(dt)
    const { body, seen } = this
    this.propellers.update(dt, body.alive)
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > seen.shots) this.shotSound.play()
    if (seen.alive && body.dead) this.explosionSound.play()
    Object.assign(seen, { shots: body.shotsFired, alive: body.alive })
    this.syncRounds(body.bullets)
  }

  drawOver(ctx) {
    this.propellers.renderLocal(ctx, this)
  }
}
