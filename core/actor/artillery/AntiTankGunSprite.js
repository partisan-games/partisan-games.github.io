import BodySprite from '/core/actor/BodySprite.js'
import Barrel from '/core/actor/Barrel.js'
import ShellSprite from '/core/actor/projectiles/ShellSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { wreckFor } from '/core/actor/wreckView.js'
import GunCrew from './GunCrew.js'

const base = 'armies/game-ready/artiljerija/pak38-postolje.png'

/**
 * How a PaK 38 body looks and sounds in 2D, drawn facing left: its carriage with the crew behind it, which works on
 * a shot and falls when the gun is destroyed, its barrel laid on the shot, the bang of a shot, its shells, and the
 * wreck that burns. It only reads the body.
 */
export default class AntiTankGunSprite extends BodySprite {
  constructor(body, { projection, camera, z = -1, shellLayer }) {
    super(body, base, { projection, camera, facing: -1, flammable: true, z })
    wreckFor(base)
    this.shellLayer = shellLayer
    this.crew = new GunCrew('pak38')
    this.barrel = new Barrel({ src: 'armies/game-ready/artiljerija/pak38-cev.png', facing: -1, crop: [0, 0, 90, 8] }, this)
    this.barrel.position.z = z
    this.children.push(this.barrel)
    this.shotSound = new Sound('cannon-shot.mp3', { profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    if (body.shotsFired > this.shotsSeen) {
      this.shotSound.play()
      this.crew.fire()
    }
    this.shotsSeen = body.shotsFired
    this.crew.update(dt, body.dead)
    this.syncViews(body.shells.projectiles, shell => {
      const view = new ShellSprite(shell, this.projection, this.camera)
      if (this.shellLayer !== undefined) view.position.z = this.shellLayer
      return view
    })
  }

  /** The crew stands behind the gun. */
  drawUnder(ctx) {
    this.crew.renderLocal(ctx, this)
  }
}
