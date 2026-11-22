import BodySprite from '/core/actor/BodySprite.js'
import WorldPart from '/core/actor/WorldPart.js'
import AtlasPart from '/core/actor/AtlasPart.js'
import BulletSprite from '/core/actor/projectiles/BulletSprite.js'
import BombSprite from '/core/actor/projectiles/BombSprite.js'
import Explosion from '/core/actor/effects/Explosion.js'
import Sound from '/core/io/audio/SoundSource.js'
import { assets } from '/config.js'
import { wreckFor } from '/core/actor/wreckView.js'

/** The plane in partisan markings, and in the NDH markings it flew in until it went over to the partisans. */
export const markings = {
  partisan: 'armies/game-ready/avioni/potez-25-partisan-bez-mitraljeza.png',
  ndh: 'armies/game-ready/avioni/potez-25-ndh-bez-mitraljeza.png',
}
/**
 * The moving parts on the 400 × 173 airframe picture, in its pixels, from the art's `crew.json`: the crew strip of the
 * same size, behind the airframe; the propeller hub; the observer's gun mount, and on the gun picture, which points
 * left, its pivot.
 */
const art = {
  airframe: { width: 400, height: 173 },
  crew: { src: 'armies/game-ready/avioni/potez-25-posada-sprites.png', frames: 4 },
  propeller: { src: 'armies/game-ready/avioni/potez-25-propeler-sprites.png', frames: 4, hub: { x: 390, y: 80 } },
  gun: { src: 'armies/game-ready/avioni/potez-25-zadnji-mitraljez.png', width: 48, height: 20, mount: { x: 210, y: 52 },
    pivot: { x: 39, y: 12 } },
}
/** The living crew's breathing loop and the propeller's turn at full power, in seconds. */
const motion = { crewLoop: 1.6, propellerLoop: .12 }

/** The crew in the cockpit, drawn right before the airframe, so its sides hide them. */
class Crew {
  constructor() {
    this.image = new Image()
    this.image.src = assets.images + art.crew.src
    this.frame = 0
  }

  renderLocal(ctx, view) {
    if (!this.image.naturalWidth) return
    const width = this.image.naturalWidth / art.crew.frames
    ctx.drawImage(this.image, this.frame * width, 0, width, this.image.naturalHeight,
      -view.width / 2, -view.height / 2, view.width, view.height)
  }
}

/**
 * How Franjo Kluz's Potez 25 looks and sounds in 2D, in the markings `src`: the airframe with the crew in it, the
 * turning propeller and the observer's gun, its engine, guns, bullets and bombs, the smoke of a damaged engine, the
 * burst when it is shot down and again when its wreck hits the ground. It only reads the body.
 */
export default class PotezSprite extends BodySprite {
  constructor(body, { src = markings.partisan, projection, camera }) {
    super(body, src, { projection, camera, flammable: true })
    wreckFor(src)
    const scale = this.width / art.airframe.width
    this.crew = new Crew()
    this.propeller = new AtlasPart(art.propeller.src, { camera, scale, frames: art.propeller.frames })
    this.rearGunPart = new WorldPart(art.gun.src, { camera, scale })
    this.bursts = [new Explosion(camera), new Explosion(camera)]
    this.children.push(this.propeller, this.rearGunPart, ...this.bursts,
      ...body.bombBay.map(bomb => new BombSprite(bomb, { projection, camera })))
    this.engineSound = new Sound('engine-aircraft.mp3', { volume: .2, loop: true, profile: 'engine', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.gunSound = new Sound('aircraft-gun.mp3', { profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.engineSound, this.explosionSound, this.gunSound)
    /** Game seconds into the crew's breathing loop, and the propeller's turn as a share of its loop. */
    this.crewTime = 0
    this.propellerTurn = 0
    this.seen = { shots: body.shotsFired, alive: body.alive, wrecked: body.wrecked }
  }

  /** A damaged plane smokes and a shot down one burns, once its flame has loaded. */
  get burning() {
    return this.flammable && this.body.burning
  }

  /** The shot-down airframe stays whole in the air; its wreck appears at ground impact. */
  get picture() {
    return this.body.wrecked ? super.picture : this.image
  }

  /** A point of the airframe picture, in its pixels, on the screen as the plane is now placed and turned. */
  airframePoint({ x, y }) {
    const scale = this.width / art.airframe.width
    const localX = (x - art.airframe.width / 2) * scale
    const localY = (y - art.airframe.height / 2) * scale
    const cos = Math.cos(this.angle), sin = Math.sin(this.angle)
    return { x: this.x + localX * cos - localY * sin, y: this.y + localX * sin + localY * cos }
  }

  /** The crew breathes and the propeller turns by game time, so both stand still in a pause. */
  animateParts(dt) {
    if (this.body.dead) return
    this.crewTime = (this.crewTime + dt) % motion.crewLoop
    this.propellerTurn = (this.propellerTurn + dt / motion.propellerLoop) % 1
  }

  /** Puts the crew, propeller and gun on the airframe, with their current frames. */
  placeParts() {
    this.crew.frame = Math.floor(this.crewTime / motion.crewLoop * art.crew.frames)
    const hub = this.airframePoint(art.propeller.hub)
    this.propeller.setPosition(hub.x, hub.y)
    this.propeller.angle = this.angle
    this.propeller.frame = Math.floor(this.propellerTurn * art.propeller.frames)
    // the gun picture points left, so it turns by the aim less a half turn, about its pivot on the mount
    const gunAngle = this.projection.angle(0, this.body.rearAim) - Math.PI
    const mount = this.airframePoint(art.gun.mount)
    const scale = this.width / art.airframe.width
    const localX = (art.gun.width / 2 - art.gun.pivot.x) * scale
    const localY = (art.gun.height / 2 - art.gun.pivot.y) * scale
    const cos = Math.cos(gunAngle), sin = Math.sin(gunAngle)
    this.rearGunPart.setPosition(mount.x + localX * cos - localY * sin, mount.y + localX * sin + localY * cos)
    this.rearGunPart.angle = gunAngle
    for (const part of [this.propeller, this.rearGunPart]) part.visible = this.visible && !this.body.wrecked
  }

  explode() {
    const burst = this.bursts.find(free => !free.visible) ?? this.bursts[0]
    burst.start(this.x, this.y)
    this.explosionSound.play()
  }

  update(dt) {
    super.update(dt)
    const { body, seen } = this
    this.smoky = body.alive
    this.engineSound.setPlaying(body.alive)
    // the fire crackles only on a shot down plane, not on a smoking one
    this.burnSound?.setPlaying(body.dead && this.visible)
    if (body.shotsFired > seen.shots) this.gunSound.play()
    if (seen.alive && body.dead) this.explode()
    if (!seen.wrecked && body.wrecked) this.explode()
    Object.assign(seen, { shots: body.shotsFired, alive: body.alive, wrecked: body.wrecked })
    this.animateParts(dt)
    this.placeParts()
    const bullet = round => new BulletSprite(round, this.projection)
    this.syncViews(body.bullets.projectiles, bullet)
    this.syncViews(body.rearBullets.projectiles, bullet)
  }

  /** The crew sits in the cockpit, under the airframe's sides. */
  drawUnder(ctx) {
    if (!this.body.wrecked) this.crew.renderLocal(ctx, this)
  }
}
