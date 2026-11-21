import BodySprite from '/core/actor/BodySprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'

/**
 * The rows of the atlas, each of five frames, and the seconds of a loop. Its last row, a recoil, tears the figure
 * apart between frames, so he fires in the row of walking towards the viewer.
 */
const rows = ['up', 'down', 'left', 'right', 'death', 'fire']
const columns = 5
const loop = .5
/** Where his gun's muzzle is as he stands firing, from the middle of the frame, in its pixels. */
const muzzle = { x: -7, y: -18 }

/**
 * How an occupier looks and sounds, seen from the front: walking the way he faces, firing his burst with its flash,
 * and falling. It only reads the body.
 */
export default class OccupierSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, 'armies/game-ready/vojnici/occupier-sprites.png', { projection, camera })
    this.flash = new Image()
    this.flash.src = `${assets.images}pucanje.png`
    this.burstSound = new Sound('rafal.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.burstSound)
  }

  /** He is drawn as he stands, never mirrored: his atlas has a row for each way. */
  fit() {
    super.fit()
    this.flipY = 1
  }

  get row() {
    const { state, forward } = this.body
    if (state === 'dead') return 'death'
    if (state === 'fire') return 'down'
    return forward > 0 ? 'right' : 'left'
  }

  update(dt) {
    super.update(dt)
    if (this.body.state === 'fire') this.burstSound.play()
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const width = this.image.naturalWidth / columns, height = this.image.naturalHeight / rows.length
    const { state, stateTime } = this.body
    // he walks round, turns to the viewer once and stands firing, or falls once and lies
    const frame = state === 'walk' ? Math.floor(stateTime % loop / loop * columns)
      : Math.min(columns - 1, Math.floor(stateTime / loop * columns))
    // the figure fills only the middle of its square frame, which is drawn at its own size around the body
    ctx.drawImage(this.image, frame * width, rows.indexOf(this.row) * height, width, height,
      this.x - width / 2, this.y - height / 2, width, height)
    if (state !== 'fire' || !this.flash.naturalWidth) return
    const { naturalWidth: flashWidth, naturalHeight: flashHeight } = this.flash
    ctx.drawImage(this.flash, this.x + muzzle.x - flashWidth / 2, this.y + muzzle.y - flashHeight / 2)
  }
}
