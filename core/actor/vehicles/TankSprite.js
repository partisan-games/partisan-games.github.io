import GameObject2D from '/core/actor/GameObject2D.js'
import VehicleSprite from '/core/actor/VehicleSprite.js'
import ShellSprite from '/core/actor/projectiles/ShellSprite.js'
import Sound from '/core/io/audio/SoundSource.js'

/**
 * The separate barrel, drawn from its pivot along the barrel's angle on the screen. `facing` is the way the barrel
 * art points, 1 right or -1 left, so its mouth is always away from the pivot. Its middle line runs through the pivot.
 */
class Barrel extends GameObject2D {
  constructor({ src, facing = 1 }, view) {
    super(src)
    this.facing = facing
    this.view = view
  }

  render(ctx) {
    const { body, projection } = this.view
    if (!this.image.naturalWidth || body.dead) return
    const pivot = projection.point(body.barrelPivot)
    const length = projection.length(body.kind.barrel.length)
    const thickness = length * this.image.naturalHeight / this.image.naturalWidth
    ctx.save()
    ctx.translate(pivot.x, pivot.y)
    ctx.rotate(projection.angle(body.yaw, body.elevation))
    // art pointing left is mirrored, so its mouth leads; it is never flipped upside down, as the tanks drew it before
    if (this.facing < 0) ctx.scale(-1, 1)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.image, this.facing < 0 ? -length : 0, -thickness / 2, length, thickness)
    ctx.restore()
  }
}

/**
 * How a tank body looks and sounds in 2D, from its atlas `art`, which points the way `facing` says (1 right, -1 left),
 * and its `barrel` art (`src` and `facing`): its atlas, fitted to the body's size, mirrored when it faces left, a
 * separate barrel, the engine, the shot and the reload, fire when it burns, and its shells. It only reads the body.
 */
export default class TankSprite extends GameObject2D {
  constructor(body, { art, facing = 1, barrel, projection }) {
    super(art.src, { flammable: true, z: -1 })
    this.facing = facing
    this.body = body
    this.projection = projection
    this.atlas = new VehicleSprite(art)
    this.barrel = new Barrel(barrel, this)
    this.shellViews = new Map()
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .8, profile: 'cannon', spatial: { getPosition: () => this.shotPoint ?? this.position } })
    this.loadSound = new Sound('cannon-load.mp3', { volume: .4, profile: 'cannon', spatial: { getPosition: () => this.position } })
    this.engineSound = new Sound('engine-diesel.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound, this.loadSound, this.engineSound)
    this.children.push(this.barrel)
    this.shotsSeen = body.shotsFired
    this.update(0)
  }

  /** A loaded picture takes its own size; the view keeps the body's, even before the game moves anything. */
  onload() {
    this.fit()
  }

  /** Where the body is and how big, on the screen. */
  fit() {
    const { body, projection } = this
    const { x, y } = projection.point(body)
    this.setPosition(x, y)
    this.width = projection.length(body.size.length)
    this.height = projection.length(body.size.height)
    // the art is mirrored only when the body faces the other way than it points
    this.flipY = (projection.mirrored(body) ? -1 : 1) * this.facing
  }

  /** Its fire shows once the flame it loads on its own is here. */
  get burning() {
    return this.flammable && this.body.burning
  }

  /** A view for each shell the body has, made the first time it is seen. */
  syncShells() {
    for (const shell of this.body.shells.projectiles) {
      if (this.shellViews.has(shell)) continue
      const view = new ShellSprite(shell, this.projection)
      this.shellViews.set(shell, view)
      this.children.push(view)
      this.audioScene?.attach(view)
    }
  }

  update(dt) {
    const { body, projection } = this
    const previousX = this.x
    this.fit()
    this.alive = body.alive
    this.engineSound.setPlaying(body.alive)
    if (body.shotsFired > this.shotsSeen) {
      this.shotPoint = projection.point(body.muzzle)
      this.shotSound.play()
      this.loadSound.play()
    }
    this.shotsSeen = body.shotsFired
    this.syncShells()
    this.updateFlame(dt)
    const movement = this.x - previousX
    // the loop's first tick after resuming has dt = 0: keep the drive phase it had
    if (dt > 0 || body.dead) this.atlas.update(dt, Math.abs(movement) > .001, Math.sign(movement) * body.forward, body.alive)
  }

  render() {
    this.atlas.render(this)
  }
}
