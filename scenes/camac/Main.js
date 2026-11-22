import Scene2D from '/core/Scene2D.js'
import canvas2d from '/core/io/canvas2d.js'
import Input from '/core/io/Input.js'
import { icons } from '/core/io/icons.js'
import { progresBar } from '/ui/components.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { baseControls } from '/ui/Controls.js'
import { topProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import Boat from '/core/gameplay/bodies/boats/Boat.js'
import TurnKeys from '/core/gameplay/controllers/TurnKeys.js'
import BoatSprite from '/core/actor/boats/BoatSprite.js'
import Obala from './Obala.js'
import SBoatEncounter from './SBoatEncounter.js'
import collideWithWreck from './wreckCollision.js'
import BoatCamera from './BoatCamera.js'
import ShoreDefenses from './ShoreDefenses.js'
import Landing from './Landing.js'
import Passengers from './Passengers.js'
import AirRaids from './AirRaids.js'
import WaterEffects from './WaterEffects.js'
import Minefield from './Minefield.js'

/** How many pixels a metre of the sea is drawn. */
const pxPerMeter = 25
/** How far before a stage's end, in pixels, its one fighter raid comes. */
const airRaidBefore = 2500
/** Seconds the game rests between two stages, telling the player one is done. */
const stagePause = 2

/**
 * The stages, sailed in turn without a new coin: the name a stage is announced by, the coast painted along it, how
 * far the boat sails it, in pixels, the sides its islands lie on in turn when it has its own (-1 above, 1 below, 0
 * both), the pace of the S-boats' passes (seconds before the first and between two), its fleet, and whether it ends
 * landing troops at a pier: out of the harbour of Vis by night, among rocky islands on both sides, the landing on
 * Šolta, and back across the channel.
 */
export const stages = [
  { name: 'Out of Vis harbour', coast: 'vis-luka', length: 20000, sides: [0, 1, 0, -1, 0], sBoats: { first: 6, quiet: 14 }, fleet: ['german-skiff', 'german-launch', 'vorpostenboot', 'rboot', 'german-patrol-vessel', 'sboat'] },
  { name: 'Landing on Šolta', coast: 'solta', length: 9000, sBoats: { first: 10, quiet: 20 }, fleet: ['german-launch', 'german-skiff', 'mfp', 'german-patrol-vessel', 'sboat'], landing: true },
  { name: 'Back to Vis', coast: 'vis-kanal', length: 8000, sBoats: { first: 4, quiet: 12 }, fleet: ['sboat', 'rboot', 'german-patrol-vessel', 'german-skiff', 'german-launch'] },
]

export default class CamacScene extends Scene2D {
  /** `stage` is the one a game starts at, the first unless asked otherwise. */
  constructor({ stage = 0, ...options } = {}) {
    super({
      controlKeys: { ...baseControls, [keys.down.label]: '', [attackLabels.Space]: 'shoot', [keys.attack2.label]: 'rocket' },
      ...options,
    })
    this.stage = stage
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
      clock: this.session.clock, targets: this.targets, canFire: () => this.running && this.onScreen(this.player),
      view: this.screenView })
    this.playerView = new BoatSprite(this.player, { projection: this.projection, camera: this })
    this.audioPlayer = () => this.playerView
    this.input = new Input({ attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.rocket } })
    this.keys = new TurnKeys(this.player, { input: this.input })
    this.waterEffects = new WaterEffects({ session: this.session, viewLeft: () => this.cameraX })
    this.audioChildren.push(this.waterEffects)
    this.add(...this.waterEffects.drawables, this.player, this.playerView)
    this.hitsSeen = new Map()
    this.backgroundColor = '#173f5a'
    /** What only the current stage draws. */
    this.stageScenery = []
    this.startStage()
  }

  /** The boat sets out again from the start of the current stage, along its coast, against its enemies. */
  startStage() {
    const stage = stages[this.stage]
    for (const enemy of [...this.enlisted]) this.discharge(enemy)
    this.remove(...this.stageScenery)
    Object.assign(this.player, { x: this.startX / pxPerMeter, z: canvas2d.height / 2 / pxPerMeter, vx: 0, vz: 0, yaw: 0 })
    this.camera = new BoatCamera()
    this.cameraX = 0
    if (!this.controllers.includes(this.keys)) this.controllers.push(this.keys)
    this.obala = new Obala(canvas2d, stage.coast, { start: this.startX, length: stage.length, sides: stage.sides })
    /** Where the stage ends, in pixels: at its pier, or ahead on the open sea. */
    this.finishX = this.startX + stage.length
    this.encounter = new SBoatEncounter({ scene: this, target: this.player, pace: stage.sBoats, fleet: stage.fleet })
    this.minefield = new Minefield({ scene: this, stage })
    this.shoreDefenses = new ShoreDefenses({ coast: this.obala, scene: this, target: this.player })
    this.airRaids = new AirRaids({ scene: this, target: this.player })
    // the same partisans sail out, land and, after the fight, all sail home
    const passengers = new Passengers({ view: this.playerView })
    this.landing = stage.landing ? new Landing({ coast: this.obala, session: this.session, player: this.player,
      passengers, projection: this.projection, viewLeft: () => this.cameraX, startX: this.startX,
      distance: stage.length }) : null
    this.stageScenery = [this.obala, passengers.layer,
      ...this.landing ? [{ position: this.landing.position, render: () => this.landing.render() }] : []]
    this.add(...this.stageScenery)
  }

  /** After the last stage the game is won; after another, the game rests a moment, saying so, and the next begins. */
  finishStage() {
    this.minefield.clear()
    if (this.stage === stages.length - 1) return this.victory('Your troops have landed on Šolta.')
    if (this.betweenStages) return
    this.betweenStages = true
    this.releaseKeys()
    this.ui.showMessage(`Stage ${this.stage + 1} of ${stages.length} complete`)
    this.session.gameplay.after(stagePause, () => {
      this.betweenStages = false
      this.stage++
      this.startStage()
      this.ui.showMessage(`Stage ${this.stage + 1}: ${stages[this.stage].name}`)
    })
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
    this.hitsSeen.delete(enemy.body)
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
        this.waterEffects.hit(x, y, body === this.player || body === this.encounter.boat?.body || this.airRaids.flies(body))
      }
      this.hitsSeen.set(body, body.hitsTaken)
    }
  }

  /** At the pier the landing takes the boat out of the player's hands. */
  releaseKeys() {
    if (this.controllers.includes(this.keys)) this.controllers.splice(this.controllers.indexOf(this.keys), 1)
  }

  /** Keep even the turned bow off the painted rocks. In the open channel only the viewport limits travel. */
  keepOnWater(boat = this.player, view = this.playerView) {
    const direction = { x: Math.cos(boat.yaw), z: -Math.sin(boat.yaw) }
    const dx = Math.abs(direction.x), dz = Math.abs(direction.z)
    const halfX = (dx * boat.size.length + dz * boat.size.width) * pxPerMeter / 2
    const halfY = (dz * boat.size.length + dx * boat.size.width) * pxPerMeter / 2
    const { x, y } = this.projection.point(boat)
    const upper = this.obala.edgeRange(x - halfX, x + halfX, -1)?.max ?? 0
    const lower = this.obala.edgeRange(x - halfX, x + halfX, 1)?.min ?? this.canvas.height
    const middle = (upper + lower) / 2
    const min = Math.min(middle, upper + halfY), max = Math.max(middle, lower - halfY)
    if (y >= min && y <= max) return
    const side = y < min ? -1 : 1
    boat.z = (y < min ? min : max) / pxPerMeter
    if (boat.vz * side > 0) boat.vz = 0
    if (direction.z * side > 0) boat.yaw = -boat.yaw
    view.fit()
  }

  /** The landing brings the boat alongside the pier, where it is drawn, and lands its troops; the fight stands still. */
  land(dt) {
    this.landing.update()
    this.playerView.update(dt)
    if (this.landing.complete) this.finishStage()
  }

  update(dt, t) {
    if (!this.running) return
    this.waterEffects.update(dt)
    if (this.betweenStages) return
    if (this.landing?.active) return this.land(dt)
    this.shoreDefenses.update()
    this.minefield.update()
    const underShoreFire = this.shoreDefenses.positions.some(({ body }) =>
      body.alive && this.onScreen(body) && (this.player.z - body.z) * body.side < 0)
    const toFinish = this.finishX - this.projection.point(this.player).x
    this.encounter.update({ allowSpawn: !underShoreFire && toFinish > 800 })
    this.airRaids.update({ nearEnd: toFinish > 800 && toFinish < airRaidBefore })
    const wreck = this.encounter.boat
    const before = { player: { x: this.player.x, z: this.player.z }, wreck: wreck && { x: wreck.body.x, z: wreck.body.z } }
    const trails = [this.playerView, wreck?.view].filter(Boolean).map(view => ({ view, x: view.x, y: view.y }))
    if (this.input.attack2) this.player.fireRocket()
    super.update(dt, t)
    this.camera.update(dt, this.player.alive && this.input.up, this.projection.point(this.player).x > this.startX)
    this.cameraX = this.camera.left(this.projection.point(this.player).x, canvas2d.width, this.playerView.width || 0)
    this.splashHits()
    if (wreck) collideWithWreck(this.player, wreck.body, before.player, before.wreck)
    this.keepOnWater()
    if (wreck?.body.alive) this.keepOnWater(wreck.body, wreck.view)
    for (const { view, x, y } of trails) this.waterEffects.trail(view, { x, y }, dt)
    this.landing?.update()
    if (this.landing?.active) this.releaseKeys()
    this.cameraX = this.camera.left(this.projection.point(this.player).x, canvas2d.width, this.playerView.width || 0)
    if (this.player.dead) this.defeat()
    else if (!this.landing && toFinish <= 0) this.finishStage()
  }

  /** The boat's health and the rockets it has left. */
  sceneUI() {
    const { health, rockets } = this.player
    return /* html */`
      <div class="top-left">
        ${progresBar(health.current / health.maximum * 100)}
        <div>${icons.rocket.repeat(rockets)}</div>
      </div>
    `
  }

  end() {
    this.input?.end()
    super.end()
  }
}
