import Scene2D from '/core/Scene2D.js'
import canvas2d from '/core/io/canvas2d.js'
import Input from '/core/io/Input.js'
import { icons } from '/core/io/icons.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { baseControls } from '/ui/Controls.js'
import { topProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import Boat from '/core/gameplay/bodies/boats/Boat.js'
import TurnKeys from '/core/gameplay/controllers/TurnKeys.js'
import BoatSprite from '/core/actor/boats/BoatSprite.js'
import Obala, { bankWidth } from './Obala.js'
import SBoatEncounter from './SBoatEncounter.js'
import collideWithWreck from './wreckCollision.js'
import BoatCamera from './BoatCamera.js'
import ShoreDefenses from './ShoreDefenses.js'
import Landing from './Landing.js'
import WaterEffects from './WaterEffects.js'

/** How many pixels a metre of the river is drawn, and how near the edges of the view the boat may sail, off the banks, in pixels. */
const pxPerMeter = 25
const bankMargin = bankWidth + 47

export default class CamacScene extends Scene2D {
  constructor(options = {}) {
    super({
      controlKeys: { ...baseControls, [keys.down.label]: '', [attackLabels.Space]: 'shoot' },
      ...options,
    })
  }

  init() {
    this.cameraX = 0
    this.projection = topProjection({ pxPerMeter })
    /** What the screen shows, where rounds leave play. */
    this.screenView = screenView(this.projection, this)
    this.camera = new BoatCamera()
    /** The enemies in play, which the boat's gun hits, and those in play with their views and controllers. */
    this.targets = []
    this.enlisted = []
    this.startX = this.camera.screenX(canvas2d.width, 0)
    this.player = new Boat({ x: this.startX / pxPerMeter, z: canvas2d.height / 2 / pxPerMeter, startX: this.startX / pxPerMeter,
      bounds: { minZ: bankMargin / pxPerMeter, maxZ: (canvas2d.height - bankMargin) / pxPerMeter },
      clock: this.session.clock, targets: this.targets, canFire: () => this.running && this.onScreen(this.player),
      view: this.screenView })
    this.playerView = new BoatSprite(this.player, { projection: this.projection, camera: this })
    this.audioPlayer = () => this.playerView
    this.input = new Input({ attackKey: 'Space', buttonDict: { attack: icons.shoot } })
    this.keys = new TurnKeys(this.player, { input: this.input })
    this.controllers.push(this.keys)
    this.obala = new Obala(() => this.cameraX)
    this.add(this.obala)
    this.waterEffects = new WaterEffects({ session: this.session, viewLeft: () => this.cameraX })
    this.audioChildren.push(this.waterEffects)
    this.add(...this.waterEffects.drawables, this.player, this.playerView)
    this.encounter = new SBoatEncounter({ scene: this, target: this.player })
    this.shoreDefenses = new ShoreDefenses({ coast: this.obala, scene: this, target: this.player })
    this.landing = new Landing({ coast: this.obala, session: this.session, player: this.player, view: this.playerView,
      projection: this.projection, viewLeft: () => this.cameraX, startX: this.startX })
    this.add({ position: this.landing.position, render: () => this.landing.render() })
    this.add(this.landing.passengerLayer)
    this.hitsSeen = new Map()
    this.backgroundColor = '#173f5a'
  }

  get running() {
    return this.session.state === 'running'
  }

  /** Whether `body` is on the screen. */
  onScreen(body) {
    const { x, y } = this.projection.point(body)
    const half = this.projection.length(Math.max(body.size.length, body.size.width)) / 2
    return x + half >= this.cameraX && x - half <= this.cameraX + canvas2d.width && y + half >= 0 && y - half <= canvas2d.height
  }

  /** Puts an enemy in play: `{ body, view }`, with its `controllers`. */
  enlist(enemy, controllers) {
    enemy.controllers = controllers
    this.enlisted.push(enemy)
    this.targets.push(enemy.body)
    this.controllers.push(...controllers)
    this.add(enemy.body, enemy.view)
  }

  /** Takes an enemy out of play. */
  discharge(enemy) {
    this.enlisted.splice(this.enlisted.indexOf(enemy), 1)
    this.targets.splice(this.targets.indexOf(enemy.body), 1)
    const kept = this.controllers.filter(controller => !enemy.controllers.includes(controller))
    this.controllers.splice(0, this.controllers.length, ...kept)
    this.remove(enemy.body, enemy.view)
  }

  /** Each hit splashes on the water or kicks up the bank where it lands. */
  splashHits() {
    for (const body of [this.player, ...this.targets]) {
      const seen = this.hitsSeen.get(body) ?? 0
      if (body.hitsTaken > seen) {
        const { x, y } = this.projection.point(body)
        this.waterEffects.hit(x, y, body === this.player || body === this.encounter.boat?.body)
      }
      this.hitsSeen.set(body, body.hitsTaken)
    }
  }

  /** At the pier the landing takes the boat out of the player's hands. */
  releaseKeys() {
    if (this.controllers.includes(this.keys)) this.controllers.splice(this.controllers.indexOf(this.keys), 1)
  }

  /** The landing brings the boat alongside the pier, where it is drawn, and lands its troops; the fight stands still. */
  land(dt) {
    this.landing.update()
    this.playerView.update(dt)
    if (this.landing.complete) this.victory('Your troops have landed on Šolta.')
  }

  update(dt, t) {
    if (!this.running) return
    this.waterEffects.update(dt)
    if (this.landing.active) return this.land(dt)
    this.shoreDefenses.update()
    const underShoreFire = this.shoreDefenses.positions.some(({ body }) =>
      body.alive && this.onScreen(body) && (this.player.z - body.z) * body.side < 0)
    const toPier = this.landing.x - this.projection.point(this.player).x
    this.encounter.update({ allowSpawn: !underShoreFire && toPier > 800 })
    const wreck = this.encounter.boat
    const before = { player: { x: this.player.x, z: this.player.z }, wreck: wreck && { x: wreck.body.x, z: wreck.body.z } }
    const trails = [this.playerView, wreck?.view].filter(Boolean).map(view => ({ view, x: view.x, y: view.y }))
    super.update(dt, t)
    this.camera.update(dt, this.player.alive && this.input.up, this.projection.point(this.player).x > this.startX)
    this.cameraX = this.camera.left(this.projection.point(this.player).x, canvas2d.width, this.playerView.width || 0)
    this.splashHits()
    if (wreck) collideWithWreck(this.player, wreck.body, before.player, before.wreck)
    for (const { view, x, y } of trails) this.waterEffects.trail(view, { x, y }, dt)
    this.landing.update()
    if (this.landing.active) this.releaseKeys()
    this.cameraX = this.camera.left(this.projection.point(this.player).x, canvas2d.width, this.playerView.width || 0)
    if (this.player.dead) this.defeat()
  }

  end() {
    this.input?.end()
    super.end()
  }
}
