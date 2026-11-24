import BodySprite from '/core/actor/BodySprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'
import art from '/core/actor/occupierArt.js'

/**
 * Walking directions, a held death pose, and the registered front-facing recoil loop.
 */
const rows = ['up', 'down', 'left', 'right', 'death', 'fire']
const { columns, rows: rowCount } = art.frame
const loop = art.fire.duration

/**
 * How an occupier looks and sounds, seen from the front: walking the way he faces, firing his burst with its flash,
 * and falling. It only reads the body.
 */
export default class OccupierSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'game-ready/vojnici/occupier-sprites.png', { projection, camera })
    this.flash = new Image()
    this.flash.src = `${assets.images}pucanje.png`
    this.burstSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
    this.shotsSeen = body.shotsFired
  }

  /** He is drawn as he stands, never mirrored: his atlas has a row for each way. */
  fit() {
    super.fit()
    this.flipY = 1
  }

  get row() {
    const { state, forward } = this.body
    if (state === 'dead') return 'death'
    if (state === 'attack') return 'fire'
    if (state === 'idle') return 'down'
    return forward > 0 ? 'right' : 'left'
  }

  update(dt) {
    super.update(dt)
    if (this.body.alive && this.shotsSeen < this.body.shotsFired) this.burstSound.play()
    this.shotsSeen = this.body.shotsFired
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const width = this.image.naturalWidth / columns, height = this.image.naturalHeight / rowCount
    const { state, stateTime } = this.body
    const elapsed = Math.max(0, stateTime) * columns / loop
    const frame = state === 'idle' ? columns - 1 :
      state === 'dead' ? Math.min(columns - 1, Math.floor(elapsed)) : Math.floor(elapsed) % columns
    const row = state === 'attack' ? art.fire.row : rows.indexOf(this.row)
    // the figure fills only the middle of its square frame, which is drawn at its own size around the body
    ctx.drawImage(this.image, frame * width, row * height, width, height,
      this.x - width / 2, this.y - height / 2, width, height)
    if (state !== 'attack' || !this.flash.naturalWidth) return
    const { naturalWidth: flashWidth, naturalHeight: flashHeight } = this.flash
    const muzzle = art.fire.muzzle[frame]
    ctx.drawImage(this.flash, this.x - width / 2 + muzzle.x - flashWidth / 2,
      this.y - height / 2 + muzzle.y - flashHeight / 2)
  }
}
