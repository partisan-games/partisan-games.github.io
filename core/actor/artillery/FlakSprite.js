import BodySprite from '/core/actor/BodySprite.js'
import WorldPart from '/core/actor/WorldPart.js'
import Sound from '/core/io/audio/SoundSource.js'
import Explosion from '/core/actor/effects/Explosion.js'
import MuzzleFlash from '/core/actor/effects/MuzzleFlash.js'
import { barrel } from '/core/gameplay/bodies/artillery/Flak.js'
import { wreckFor } from '/core/actor/wreckView.js'
import GunCrew from './GunCrew.js'

/** The base picture is 204 px wide; the barrel picture is drawn at the base's scale, turned about its middle. */
const baseWidth = 204
const base = 'armies/game-ready/artiljerija/flak38-postolje.png'

/**
 * How a flak body looks and sounds in 2D: its base with the crew behind it, which works on a shot and falls when the
 * gun is destroyed, the barrel turned about its breech, the flash and bang of a shot, the shell in flight and the
 * black cloud of its burst, and the wreck that burns. It only reads the body.
 */
export default class FlakSprite extends BodySprite {
  constructor(body, { projection, camera }) {
    super(body, base, { projection, camera, flammable: true })
    wreckFor(base)
    this.crew = new GunCrew('flak38')
    this.barrel = new WorldPart('armies/game-ready/artiljerija/flak38-cev.png', { camera })
    this.shell = new WorldPart('items/granata.gif', { camera, scale: .4, visible: false })
    this.muzzleFlash = new MuzzleFlash(camera)
    this.burstView = new Explosion(camera, { scale: .75, smoke: true })
    this.children.push(this.barrel, this.shell, this.burstView, this.muzzleFlash)
    this.shotSound = new Sound('cannon-shot.mp3', { volume: .5, profile: 'rifle', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.shotSound)
    this.shotsSeen = body.shotsFired
    this.burstsSeen = body.shell.bursts
  }

  /** The barrel, as wide as the base draws it, at the breech and turned from the angle it was drawn at. */
  placeBarrel() {
    const { body, projection, barrel: part } = this
    const scale = this.width / baseWidth
    part.width = part.image.naturalWidth * scale
    part.height = part.image.naturalHeight * scale
    const breech = projection.point(body.breech)
    part.setPosition(breech.x, breech.y)
    part.angle = projection.angle(0, body.barrelAngle) - projection.angle(0, barrel.rest)
    part.visible = body.alive
  }

  update(dt) {
    super.update(dt)
    const { body, projection } = this
    this.placeBarrel()
    if (body.shotsFired > this.shotsSeen) {
      this.muzzleFlash.start(projection.point(body.muzzle), projection.angle(0, body.barrelAngle))
      this.shotSound.play()
      this.crew.fire()
    }
    this.shotsSeen = body.shotsFired
    const { shell } = body
    if (shell.bursts > this.burstsSeen) {
      const { x, y } = projection.point(shell)
      this.burstView.start(x, y)
    }
    this.burstsSeen = shell.bursts
    const { x, y } = projection.point(shell)
    this.shell.setPosition(x, y)
    this.shell.angle = projection.angle(shell.yaw, shell.pitch)
    this.shell.visible = shell.state === 'flight'
    if (body.dead) this.muzzleFlash.hide()
    this.crew.update(dt, body.dead)
  }

  /** The crew stands behind the gun. */
  drawUnder(ctx) {
    this.crew.renderLocal(ctx, this)
  }
}
