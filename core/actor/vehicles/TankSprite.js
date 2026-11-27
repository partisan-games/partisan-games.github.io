import BodySprite from '/core/actor/BodySprite.js'
import Barrel from '/core/actor/Barrel.js'
import GameObject2D from '/core/actor/GameObject2D.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import ShellSprite from '/core/actor/projectiles/ShellSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import { bodyImage, wreckFor } from '/core/actor/wreckView.js'
import atlasFrame from '/core/actor/atlasFrame.js'

/**
 * How a tank body looks and sounds in 2D, from its atlas `art` (vehicleArt.js), which points the way `facing` says
 * (1 right, -1 left), and its `barrel` art (`src`, `facing` and `crop`): its atlas fitted to the body's size, its
 * tracks turning the way it moves, mirrored when it faces left, a separate barrel, the engine, the shot and the
 * reload, fire when it burns, its wreck, and its shells. It only reads the body.
 */
export default class TankSprite extends BodySprite {
  constructor(body, { art, facing = 1, barrel, projection, camera, z = -1, shellLayer }) {
    super(body, art.src, { projection, camera, facing, flammable: true, z })
    this.art = art
    wreckFor(art.src)
    this.shellLayer = shellLayer
    this.barrel = new Barrel(barrel, this)
    this.barrel.position.z = z
    this.flash = new MuzzleFlash(camera ?? { cameraX: 0, cameraY: 0 })
    this.flash.position.z = z
    this.armorHits = art.damageSrc && new GameObject2D(art.damageSrc, { visible: false })
    this.shellViews = this.projectileViews
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .8, profile: 'cannon', spatial: { getPosition: () => this.shotPoint ?? this.position } })
    this.loadSound = new Sound('cannon-load.mp3', { volume: .4, profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.engineSound = new Sound('engine-diesel.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.loadSound, this.engineSound)
    this.children.push(this.barrel, this.flash)
    if (this.armorHits) this.children.push(this.armorHits)
    this.shotsSeen = body.shotsFired
    /** The clip the atlas plays, how far into it, and the way its tracks turn: 1 ahead, -1 back. */
    this.clip = 'idle'
    this.clipTime = 0
    this.tracks = 1
    this.update(0)
  }

  /** Its fire shows once the flame it loads on its own is here. */
  get burning() {
    return this.body.state !== 'wreck' && this.flammable && this.body.burning
  }

  /** The atlas frame: a drive played backwards when the tank backs up. */
  get frameIndex() {
    const { columns, clips } = this.art
    const frame = Math.floor(this.clipTime / clips[this.clip].seconds * columns)
    return this.tracks < 0 ? (columns - frame) % columns : frame
  }

  /** A view for each shell the body has, made the first time it is seen. */
  syncShells() {
    this.syncViews(this.body.shells.projectiles, shell => {
      const view = new ShellSprite(shell, this.projection, this.camera)
      if (this.shellLayer !== undefined) view.position.z = this.shellLayer
      return view
    })
    this.shellViews = this.projectileViews
  }

  update(dt) {
    if (!this.art) return
    const { body, projection } = this
    const previousX = this.x
    super.update(dt)
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > this.shotsSeen) {
      this.shotPoint = projection.point(body.muzzle)
      this.flash.start(this.shotPoint, projection.angle(body.barrelYaw ?? body.yaw, body.elevation))
      this.shotSound.play()
      this.loadSound.play()
    }
    if (body.dead) this.flash.hide()
    this.shotsSeen = body.shotsFired
    this.syncShells()
    const movement = this.x - previousX
    // the loop's first tick after resuming has dt = 0: keep the drive phase it had
    if (dt === 0 && body.alive) return
    const clip = Math.abs(movement) > .001 && body.alive ? 'drive' : 'idle'
    if (clip !== this.clip) this.clipTime = 0
    this.clip = clip
    this.tracks = Math.sign(movement) * body.forward || 1
    this.clipTime = body.alive ? (this.clipTime + dt) % this.art.clips[clip].seconds : 0
  }

  render(ctx) {
    if (!this.shown) return
    const { frame, clips, contentBounds, gutter = 0 } = this.art
    let x = -this.width / 2, y = -this.height / 2, { width, height } = this
    if (contentBounds) {
      const [left, top, right, bottom] = contentBounds
      const scale = Math.min(this.width / (right - left), this.height / (bottom - top))
      x = -(left + right) / 2 * scale
      y = -(top + bottom) / 2 * scale
      width = frame.width * scale
      height = frame.height * scale
    }
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, 1)
    ctx.imageSmoothingEnabled = false
    const image = bodyImage(this)
    const wreckRow = this.body.dead && this.art.wreckRow !== undefined ? this.art.wreckRow : undefined
    if (image !== this.image || wreckRow !== undefined)
      ctx.drawImage(image, ...atlasFrame(frame.width, frame.height, 0, wreckRow ?? 0, image === this.image ? gutter : 0), x, y, width, height)
    else {
      const turretRow = clips[this.clip].row + (this.body.turretBack ? 4 : 2)
      ctx.drawImage(image, ...atlasFrame(frame.width, frame.height, this.frameIndex, turretRow, gutter), x, y, width, height)
      ctx.drawImage(image, ...atlasFrame(frame.width, frame.height, this.frameIndex, clips[this.clip].row, gutter), x, y, width, height)
      if (this.body.health.current < this.body.health.maximum && this.armorHits?.image.naturalWidth)
        ctx.drawImage(this.armorHits.image, x, y, width, height)
    }
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
