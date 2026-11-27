import BodySprite from '/core/actor/BodySprite.js'
import ArtClip from '/core/actor/ArtClip.js'
import { partisanCrewDeath, italianCrewDeath } from '/core/actor/actionArt.js'

/**
 * The mortar crewman's sheet at 80 px a metre, facing right: a row an army, a column a pose, each frame with a clear
 * margin round it, and where his feet stand in a frame.
 */
const sheet = {
  src: 'game-ready/artiljerija/minobacac/posada-sprites.webp', pxPerMeter: 80, frame: 160, margin: 4,
  feet: { x: 76, y: 154 }, rows: { italian: 0, partisan: 1 },
}
/** The pose for each state of the crew: standing by, kneeling with a bomb while loading, and reaching up to drop it. */
const poses = { idle: 0, attack: 1, load: 2 }

/**
 * How a mortar crewman looks, partisan or `italian`, standing on the body's bottom: standing by, kneeling with a bomb
 * while the shot is charged, and reaching to drop it as it fires. He falls as a gun crew falls. It only reads the body.
 */
export default class MortarCrewSprite extends BodySprite {
  constructor(body, { italian = false, projection, camera }) {
    super(body, sheet.src, { projection, camera })
    this.row = sheet.rows[italian ? 'italian' : 'partisan']
    this.deathArt = new ArtClip(italian ? italianCrewDeath : partisanCrewDeath)
    this.children.push(this.deathArt)
  }

  render(ctx) {
    if (!this.shown || !this.image.naturalWidth) return
    const { body, projection } = this
    const feet = { x: this.x, y: this.y + this.height / 2 }
    if (body.dead) {
      this.deathArt.draw(ctx, { name: 'death', time: body.stateTime, ...feet,
        scaleX: this.width / 128, scaleY: this.height / 128, flip: this.flipY })
      return
    }
    const { frame, margin } = sheet
    const step = frame + margin * 2
    const size = projection.length(frame / sheet.pxPerMeter)
    const scale = size / frame
    ctx.save()
    ctx.translate(feet.x, feet.y)
    ctx.scale(this.flipY, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, (poses[body.state] ?? 0) * step + margin, this.row * step + margin, frame, frame,
      -sheet.feet.x * scale, -sheet.feet.y * scale, size, size)
    ctx.restore()
  }
}
