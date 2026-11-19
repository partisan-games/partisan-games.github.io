import canvas2d, { drawSky } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { baseControls } from '/ui/Controls.js'
import { randomInRange } from '/core/utils.js'
import Potez from './Potez.js'
import Hummel from './Hummel.js'
import WorldSprite from './WorldSprite.js'
import Airfield from './Airfield.js'
import ParallaxLayer from './ParallaxLayer.js'

const groundLevel = canvas2d.height
/** The camera rises once the plane climbs above `cameraTop`. */
const cameraTop = canvas2d.height / 4
/** World x of the Urije airfield, about 40 seconds of flight at takeoff speed, and of the ruin the plane must fly over. */
const airfieldX = 12_000
const ruinX = 1200
/**
 * The fastest touchdown the plane survives, the sink rates of a hard landing and of a crash, in pixels per second,
 * and the speed under which it has stopped. The owner wants landing easy: holding down to the ground sinks about
 * 300 px/s and is only a hard landing, and the takeoff speed of 312 leaves room above it.
 */
const landing = { airspeed: 600, hardSink: 150, crashSink: 350, stopped: 20 }
/** The ruin comes back this far ahead after the plane passes it, as the old scrolling scenery did. */
const ruinReturn = { min: canvas2d.width, max: canvas2d.width * 3 }
/** Seconds between the wreck hitting the ground and the defeat screen, so the crash is seen. */
const crashScreenDelay = 1.5

export default class FranjoKluzScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Space: 'Shoot', V: 'Homing missile' },
    })
  }

  init() {
    const camera = this
    this.player = new Potez({ groundY: groundLevel, groundAt: x => this.aerodrom.groundAt(x), camera, session: this.session })
    this.aerodrom = new Airfield({ camera, groundY: groundLevel, x: airfieldX })
    this.ruina = new WorldSprite('buildings/ruina.png', { camera, groundY: groundLevel, x: ruinX })
    this.vozilo = new Hummel({ camera, pace: () => this.player.airspeed, groundY: groundLevel, session: this.session })
    this.followPlane(0)

    this.player.solidBodies.push(this.vozilo, this.ruina)
    this.player.targets.push(this.vozilo)
    this.vozilo.targets.push(this.player)

    this.scenery = [
      new ParallaxLayer({ src: 'nature/shumarak.png', count: 10, depth: .2, z: 2, camera,
        place: height => groundLevel + 5 - height / 2 }),
      new ParallaxLayer({ src: 'nature/oblak.gif', count: 3, depth: .1, drift: -32, z: -1, camera,
        place: () => randomInRange(0, groundLevel) }),
      new ParallaxLayer({ src: 'nature/zbun.png', count: 10, depth: 1, z: -2, camera,
        place: height => randomInRange(groundLevel - height / 2, canvas2d.height) }),
    ]

    // The plane is drawn in front of the buildings and the vehicle, so a crash into them is seen burning and falling.
    this.add(this.aerodrom, this.ruina, this.vozilo, this.player, ...this.scenery)
    this.ui.intro = 'Destroy the German tank and land on the Urije airfield!'
    // TEMP: owner's landing test; remove after it. The airfield is close, the tank is already destroyed.
    this.aerodrom.x = 1800
    this.ruina.x = 6000
    this.vozilo.die()
  }

  /** The view moves on at the plane's airspeed and rises with it above `cameraTop`, never sinking under the ground. */
  followPlane(dt) {
    this.cameraX += this.player.airspeed * dt
    this.cameraY = Math.min(0, this.player.y - cameraTop)
  }

  /** The ruin never comes back over the airfield or its runway. */
  returnRuin() {
    if (this.ruina.x + this.ruina.width / 2 > this.cameraX) return
    let x = this.cameraX + canvas2d.width + randomInRange(ruinReturn.min, ruinReturn.max)
    const airfieldLeft = this.aerodrom.x - this.aerodrom.width / 2
    if (x + this.ruina.width / 2 > airfieldLeft && x - this.ruina.width / 2 < this.aerodrom.runway.right)
      x = this.aerodrom.runway.right + this.ruina.width
    this.ruina.x = x
    this.ruina.alive = true
    this.ruina.audioRevision = (this.ruina.audioRevision ?? 0) + 1
  }

  checkOutcome() {
    if (this.player.wrecked && !this.crashSeen) {
      this.crashSeen = true
      this.session.gameplay.after(crashScreenDelay, () => this.defeat(this.crashReason ?? 'You fell gloriously.'))
    }
    this.checkLanding()
  }

  /**
   * The plane may touch the ground only on the runway and slowly enough, or it crashes. Flying past the runway loses
   * the mission; stopping on it with the tank destroyed wins.
   */
  checkLanding() {
    const { player, aerodrom } = this
    if (player.dead) return
    if (!player.isGrounded) {
      if (player.x > aerodrom.runway.right) this.defeat('You missed the airfield.')
      return
    }
    const { airspeed, sink } = player.touchdown
    this.crashReason = !aerodrom.holds(player.x) ? 'You touched down off the runway.'
      : airspeed > landing.airspeed ? 'You touched down too fast.'
        : sink > landing.crashSink ? 'You landed too hard.' : null
    if (this.crashReason) return player.die()
    if (this.vozilo.dead && player.airspeed < landing.stopped) {
      const kind = sink < landing.hardSink ? 'A soft landing.' : 'A hard landing.'
      this.victory(`Mission successfully completed! ${kind}`)
    }
  }

  clear() {
    drawSky(groundLevel - this.cameraY, 'blue', 'lightblue', -this.cameraY)
  }

  update(dt, t) {
    this.followPlane(dt)
    super.update(dt, t)
    this.vozilo.patrol()
    this.returnRuin()
    this.checkOutcome()
  }

  render() {
    const { cameraX, cameraY } = this.renderer
    this.renderer.cameraX = this.cameraX
    this.renderer.cameraY = this.cameraY
    try {
      super.render()
    } finally {
      // The renderer is shared with other scenes; camera ownership remains local.
      this.renderer.cameraX = cameraX
      this.renderer.cameraY = cameraY
    }
  }
}
