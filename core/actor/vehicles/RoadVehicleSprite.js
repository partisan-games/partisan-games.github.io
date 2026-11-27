import BodySprite from '../BodySprite.js'
import ActorAtlas from '../ActorAtlas.js'
import ShellSprite from '../projectiles/ShellSprite.js'
import MuzzleFlash from '../effects/MuzzleFlash.js'
import DamageSmoke from '../effects/DamageSmoke.js'
import Sound from '/core/io/audio/SoundSource.js'
import roadVehicleArt from './roadVehicleArt.js'

export { roadVehicleArt }

/** The same registered atlas, muzzle and held wreck in the road level and the actor catalogue. */
export default class RoadVehicleSprite extends BodySprite {
  constructor(body, { id, projection, camera, z }) {
    const art = roadVehicleArt[id]
    super(body, art.src, { facing: art.facing, projection, camera, z, flammable: true })
    this.sheet = new ActorAtlas(art)
    this.flash = new MuzzleFlash(camera ?? { cameraX: 0, cameraY: 0 })
    this.children.push(this.sheet, this.flash, new DamageSmoke(this))
    const engine = id === 'bmw-r12' || id === 'zundapp-k600' ? 'engine-6000.mp3' : 'engine-diesel.mp3'
    this.engine = new Sound(engine, { loop: true, steady: true, volume: .35, profile: 'engine',
      spatial: { getPosition: () => this.position } })
    this.gun = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engine, this.gun)
    this.elapsed = 0
    this.sinceShot = Infinity
    this.shotsSeen = body.shotsFired
  }

  update(dt) {
    super.update(dt)
    this.elapsed += dt
    const shot = this.body.shotsFired > this.shotsSeen
    this.sinceShot = shot ? 0 : this.sinceShot + dt
    this.engine.setPlaying(this.body.alive)
    if (shot) {
      this.gun.play()
      this.flash.start(this.projection.point(this.body.muzzle), this.projection.angle(this.body.yaw))
    }
    if (this.body.dead) this.flash.hide()
    this.shotsSeen = this.body.shotsFired
    this.syncViews(this.body.shells.projectiles, shell => new ShellSprite(shell, this.projection, this.camera))
  }

  render(ctx) {
    if (!this.shown) return
    const { body } = this
    const moving = Math.abs(body.vx) > .025
    const clip = body.dead ? 'dead' : this.sinceShot < .4 ? 'attack' : body.health.current < body.health.maximum / 2
      ? 'damaged' : moving ? 'drive' : 'idle'
    const time = body.state === 'wreck' ? this.sheet.seconds('dead')
      : body.dead ? body.stateTime : clip === 'attack' ? this.sinceShot : moving || clip === 'idle' ? this.elapsed : 0
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.scale(this.flipY, 1)
    this.sheet.drawLocal(ctx, this, clip, time)
    ctx.restore()
    if (this.burning) this.flame.render(this.smoky)
  }
}
