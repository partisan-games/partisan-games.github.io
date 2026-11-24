import canvas2d, { ctx } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { progresBar } from '/ui/components.js'
import { tankLeftControls } from '/ui/Controls.js'
import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys } from '/core/io/keys.js'
import { sideProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import { randomInRange } from '/core/utils.js'
import Tank, { tank, tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import VehicleCollisions from '/core/gameplay/VehicleCollisions.js'
import Vehicle, { vehicleKinds } from '/core/gameplay/bodies/vehicles/Vehicle.js'
import GunCarrier, { gunCarrierKinds } from '/core/gameplay/bodies/vehicles/GunCarrier.js'
import RoadVehicle, { roadVehicleKinds } from '/core/gameplay/bodies/vehicles/RoadVehicle.js'
import RoadVehicleSprite from '/core/actor/vehicles/RoadVehicleSprite.js'
import LevelBomber from '/core/gameplay/bodies/aircraft/LevelBomber.js'
import Escort from './Escort.js'
import PictureAircraftSprite, { aircraftPictures } from '/core/actor/aircraft/PictureAircraftSprite.js'
import GunCarrierSprite, { gunCarrierPictures } from '/core/actor/vehicles/GunCarrierSprite.js'
import AntiTankGun from '/core/gameplay/bodies/artillery/AntiTankGun.js'
import Bunker, { bunker, bunkerKinds } from '/core/gameplay/bodies/artillery/Bunker.js'
import Fighter from '/core/gameplay/bodies/aircraft/Fighter.js'
import DiveBomber from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import TankKeys from '/core/gameplay/controllers/TankKeys.js'
import Marksman from '/core/gameplay/controllers/Marksman.js'
import { lead } from '/core/gameplay/controllers/Gunner.js'
import Strafer from '/core/gameplay/controllers/Strafer.js'
import Bombardier, { dropLead } from '/core/gameplay/controllers/Bombardier.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import VehicleSprite from '/core/actor/vehicles/VehicleSprite.js'
import AntiTankGunSprite from '/core/actor/artillery/AntiTankGunSprite.js'
import BunkerSprite from '/core/actor/artillery/BunkerSprite.js'
import FighterSprite from '/core/actor/aircraft/FighterSprite.js'
import DiveBomberSprite from '/core/actor/aircraft/DiveBomberSprite.js'
import vehicleArt from '/core/actor/vehicleArt.js'
import spriteArt from '/core/actor/spriteArt.js'
import Route from './Route.js'
import BattleFeedback from './BattleFeedback.js'

/** How many pixels a metre of the road is drawn: the bodies are in metres, the view and its scenery in pixels. */
const pxPerMeter = 20
const toMeters = pixels => pixels / pxPerMeter
/** How fast the view moves along the road, in pixels a second, and the length of the road, all its stages together. */
const scroll = 160
const levelLength = scroll * 180
/**
 * Drawing order: higher first. Scenery is drawn behind everything, before the objects; the player's tank passes in
 * front of the enemies and their buildings.
 */
export const layers = Object.freeze({ ground: -.5, unit: -1, player: -1.5, projectile: -2, effect: -3 })
/** Seconds before the first air raid and between the start of one and the next. */
const raids = { first: 28, every: 36 }
/** Its tanks do not break down: the column's fights are decided by health alone. */
const noBreakdown = { drive: 0, gun: 0 }
/**
 * The enemies on the ground, in the order they first come: how hard a vehicle drives on, as its share of full
 * throttle, and the enemy tanks' reload, slower than the player's. Almost any shell destroys any of them: an enemy
 * tank's health is this one's share of its model's.
 */
const enemy = { health: 10, tankReload: 4.5, cruise: .372 }
/** The model of each enemy tank. */
const tankModels = { german: 'tiger-i', somua: 'somua-s35' }
/** A Do Trsta fighter's gun: short bursts of light, fast rounds. */
const fighterGun = { reload: .16, speed: 40.04, damage: 2, burst: 3, pause: 5 }
/** How far from a bomb's impact the tank takes its damage, beyond its body, in metres, and the damage. */
const bomb = { radius: 1.76, damage: 12 }

export default class ToTriesteScene extends Scene2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Probij se kroz neprijateljske položaje, obori avione i stigni do kraja puta.' })
  }

  async init() {
    /** The line the road's units stand on, in pixels. */
    this.groundLine = canvas2d.height * .8 + 24
    this.projection = sideProjection({ pxPerMeter, groundY: this.groundLine })
    /** What the screen shows, where rounds leave play. */
    this.screenView = screenView(this.projection, this)
    this.score = 0
    this.levelLength = levelLength
    this.route = new Route({ groundY: this.groundLine, distance: () => this.cameraX, length: levelLength })
    /** The view's left and its right for the tank, in metres, which keep the tank in it. */
    this.bounds = { min: 0, max: toMeters(canvas2d.width * .9) }
    /** What the tank's shells can hit: every enemy in play. */
    this.targets = []
    // the tank rolls on with the column, as fast as the view moves along the road
    this.player = new Tank({ kind: tankKinds.partisan, x: toMeters(randomInRange(0, canvas2d.width * .3)), yaw: 0,
      march: toMeters(scroll), clock: this.session.clock, targets: this.targets, bounds: this.bounds,
      canFire: () => this.running, breakdown: noBreakdown, performance: modelPerformance.partisanTank })
    this.player.y = this.player.size.height / 2
    this.vehicleCollisions = new VehicleCollisions(this.player)
    this.playerView = new TankSprite(this.player, { art: vehicleArt.partisanTank, ...this.views, z: layers.player,
      barrel: { src: 'game-ready/tenkovi/partizanski-tenk-cev-pixel.png' }, shellLayer: layers.projectile })
    this.audioPlayer = () => this.playerView
    this.controllers.push(new TankKeys(this.player, { keyboard, keys: leftPlayerKeys }))
    // partisan riflemen of the Fourth Army hold positions by the road and fire while the enemy is in sight
    this.escort = new Escort({ scene: this, projection: this.projection, z: layers.unit,
      enemyInSight: () => this.hostiles.some(({ body, sort }) => sort !== 'plane' && body.alive && this.inView(body)) })
    this.add(this.player, this.playerView)
    /** Every enemy in play: { sort, kind, body, view, controllers }, and the air raid now over the road. */
    this.hostiles = []
    this.raid = { next: 0, at: this.session.clock.now + raids.first, plane: null }
    const bunkerGap = Math.max(480, canvas2d.width * .65)
    let left = canvas2d.width + bunkerGap
    for (const kind of ['house', 'pillbox']) {
      const half = bunkerKinds[kind].size.length * pxPerMeter / 2
      this.spawn(this.bunker(kind, toMeters(left + half)))
      left += half * 2 + bunkerGap
    }
    const groundGap = Math.max(720, canvas2d.width * 1.25)
    ;['germanTank', 'zundapp-k600', 'motorcycle', 'bmw-r12', 'truck', 'mercedes-830bl', 'halftrack', 'sdkfz-231',
      'antiTankGun', 'pzkpf-612', 'armoredCar', 'marder-ii', 'tank', 'elefant'].forEach((kind, index) =>
      this.spawn(this.groundEnemy(kind, toMeters(canvas2d.width + groundGap * .5 + index * groundGap))))
    this.feedback = new BattleFeedback({ units: () => [this.player, ...this.hostiles.map(({ body }) => body)],
      flies: body => this.hostiles.some(hostile => hostile.body === body && hostile.sort === 'plane'),
      projection: this.projection, clock: this.session.presentationClock, layers })
    this.add(this.feedback.ground, this.feedback.front)
    await this.imagesLoaded()
  }

  imagesLoaded() {
    return Promise.all([super.imagesLoaded(), this.route.loaded()])
  }

  get running() {
    return this.session.state === 'running'
  }

  /** What every view of this scene draws with. */
  get views() {
    return { projection: this.projection, camera: this }
  }

  /** Whether `body` is on the screen. */
  inView(body) {
    const { x, y } = this.projection.point(body)
    const halfWidth = this.projection.length(body.size.length) / 2, halfHeight = this.projection.length(body.size.height) / 2
    return x + halfWidth > this.cameraX && x - halfWidth < this.cameraX + canvas2d.width && y + halfHeight > 0 &&
      y - halfHeight < canvas2d.height
  }

  /** An enemy may fire only while the game runs and its gun is on the screen. */
  mayFire(body) {
    return () => {
      if (!this.running) return false
      const { x } = this.projection.point(body.muzzle ?? body)
      return x >= this.cameraX && x <= this.cameraX + canvas2d.width
    }
  }

  /** It sees the tank while the tank is on the screen. */
  sees = target => target.alive && this.inView(target)

  /** An enemy fires at the marching tank, ahead of it by the flight of its shot at `speed`. */
  marksman(body, speed, rest) {
    return new Marksman(body, this.player, { rest, sees: this.sees, aim: lead(speed) })
  }

  /** A bunker by the road at `x` metres, firing at the tank; the fortified house has its machine gunner at the door. */
  bunker(kind, x) {
    const body = new Bunker({ kind: bunkerKinds[kind], x, yaw: Math.PI, clock: this.session.clock, targets: [this.player],
      view: this.screenView })
    body.canFire = this.mayFire(body)
    body.y = body.size.height / 2
    const view = new BunkerSprite(body, { kind, ...this.views, z: layers.unit, roundLayer: layers.projectile })
    return { sort: 'bunker', kind, body, view, controllers: [this.marksman(body, bunker.speed)] }
  }

  /** An enemy on the ground at `x` metres, driving at the tank or standing, and firing at it if it is armed. */
  groundEnemy(kind, x) {
    const place = { x, yaw: Math.PI, health: enemy.health }
    const armed = { ...place, clock: this.session.clock, targets: [this.player] }
    let body, view
    if (kind in roadVehicleKinds) {
      body = new RoadVehicle({ ...armed, kind: roadVehicleKinds[kind] })
      view = new RoadVehicleSprite(body, { id: kind, ...this.views })
    } else if (kind === 'truck') {
      body = new Vehicle({ ...place, kind: vehicleKinds.truck })
      view = new VehicleSprite(body, { art: spriteArt['opel-blitz'], facing: -1, ...this.views })
    } else if (kind in gunCarrierKinds) {
      body = new GunCarrier({ ...armed, kind: gunCarrierKinds[kind] })
      view = new GunCarrierSprite(body, { picture: gunCarrierPictures[kind], ...this.views })
    } else if (kind === 'antiTankGun') {
      body = new AntiTankGun(armed)
      view = new AntiTankGunSprite(body, { ...this.views, z: layers.unit, shellLayer: layers.projectile })
    } else {
      const tankKind = kind === 'germanTank' ? 'german' : 'somua'
      const performance = modelPerformance[tankModels[tankKind]]
      body = new Tank({ ...armed, kind: tankKinds[tankKind], cruise: enemy.cruise, reloadTime: enemy.tankReload,
        breakdown: noBreakdown, rearAim: false, performance, health: enemy.health * performance.health / tank.health })
      view = new TankSprite(body, { ...this.views, z: layers.unit, shellLayer: layers.projectile, facing: -1,
        ...tankKind === 'german'
          ? { art: vehicleArt.germanTank, barrel: { src: 'game-ready/tenkovi/nemacki-tenk-cev-pixel.png', facing: -1 } }
          : { art: vehicleArt.somuaS35, barrel: { src: 'game-ready/tenkovi/somua-s35-barrel.png', facing: -1, crop: [126, 203, 1923, 309] } } })
    }
    body.canFire = this.mayFire(body)
    body.y = body.size.height / 2
    view.position.z = layers.unit
    const rest = body.states.includes('move') ? 'move' : 'idle'
    body.setState(rest)
    const shotSpeed = body instanceof GunCarrier || body instanceof RoadVehicle ? body.kind.gun.speed : tank.shellSpeed
    const controllers = body.states.includes('attack') ? [this.marksman(body, shotSpeed, rest)] : []
    return { sort: 'ground', kind, body, view, controllers }
  }

  /** A plane of the air raid comes in from the right over the road, at its height. */
  plane(kind) {
    const altitude = toMeters(Math.min(230, Math.max(120, canvas2d.height * .28)))
    const options = { y: altitude, yaw: Math.PI, health: enemy.health, clock: this.session.clock, canFire: () => this.running }
    if (kind === 'diveBomber') {
      const body = new DiveBomber({ ...options, onImpact: point => this.bombBlast(point) })
      body.x = toMeters(this.cameraX + canvas2d.width) + body.size.length / 2 + 1
      body.enter()
      const view = new DiveBomberSprite(body, this.views)
      return { sort: 'plane', kind, body, view, controllers: [new Bombardier(body, this.player, { sees: this.sees, aim: dropLead(body.bomb.pull) })] }
    }
    if (kind === 'bomber') {
      const body = new LevelBomber({ ...options, y: altitude * 1.4, onImpact: point => this.bombBlast(point) })
      body.x = toMeters(this.cameraX + canvas2d.width) + body.size.length / 2 + 1
      body.enter()
      const view = new PictureAircraftSprite(body, { picture: aircraftPictures.he111, ...this.views })
      return { sort: 'plane', kind, body, view, controllers: [new Bombardier(body, this.player, { sees: this.sees, aim: dropLead(body.bombs[0].pull) })] }
    }
    const body = new Fighter({ ...options, targets: [this.player], gun: fighterGun, view: this.screenView })
    body.x = toMeters(this.cameraX + canvas2d.width) + body.size.length / 2 + 1
    const view = new FighterSprite(body, this.views)
    const strafer = new Strafer(body, this.player, { sees: this.sees, viewWidth: () => toMeters(canvas2d.width),
      aim: lead(fighterGun.speed) })
    return { sort: 'plane', kind, body, view, controllers: [strafer] }
  }

  /** Puts an enemy in play: in the world, among the tank's targets, with its controllers. */
  spawn(hostile) {
    hostile.view.position.z = layers.unit
    hostile.alive = true
    this.hostiles.push(hostile)
    this.targets.push(hostile.body)
    this.controllers.push(...hostile.controllers)
    this.add(hostile.body, hostile.view)
    return hostile
  }

  /** Takes an enemy out of play. */
  despawn(hostile) {
    this.hostiles.splice(this.hostiles.indexOf(hostile), 1)
    this.targets.splice(this.targets.indexOf(hostile.body), 1)
    const kept = this.controllers.filter(controller => !hostile.controllers.includes(controller))
    this.controllers.splice(0, this.controllers.length, ...kept)
    this.remove(hostile.body, hostile.view)
  }

  /** A bomb burst damages the tank when it reaches its body. */
  bombBlast({ x, y }) {
    const { player } = this
    if (player.dead || !this.running) return
    const reach = bomb.radius + Math.max(player.size.length, player.size.height) / 2
    if (Math.hypot(player.x - x, player.y - y) <= reach) player.takeHit(bomb.damage)
  }

  /** The right edge of the farthest enemy of `sort`, in metres. */
  farthest(sort) {
    return Math.max(...this.hostiles.filter(hostile => hostile.sort === sort).map(({ body }) => body.x + body.size.length / 2))
  }

  /**
   * An enemy passed on the left comes again from the right, as a new one, behind the last of its sort: bunkers a
   * bunker gap apart, the rest a ground gap apart.
   */
  returnPassed() {
    const left = toMeters(this.cameraX)
    for (const hostile of [...this.hostiles]) {
      const { body, sort, kind } = hostile
      if (body.x + body.size.length / 2 >= left) continue
      this.despawn(hostile)
      if (sort === 'plane') continue
      const right = toMeters(this.cameraX + canvas2d.width)
      if (sort === 'bunker') {
        const gap = toMeters(Math.max(480, canvas2d.width * .65))
        this.spawn(this.bunker(kind, Math.max(right, this.farthest('bunker')) + gap + body.size.length / 2))
      } else {
        const gap = toMeters(Math.max(720, canvas2d.width * 1.25))
        this.spawn(this.groundEnemy(kind, Math.max(right, this.farthest('ground')) + gap))
      }
    }
  }

  /** One plane at a time comes over the road, a fighter, a dive bomber and a level bomber in turn; a crashed one is gone. */
  airRaid() {
    const { raid } = this
    // a crashed plane is gone once its burst is over
    if (raid.plane?.body.crashed && !raid.plane.view.burst.visible && this.hostiles.includes(raid.plane)) this.despawn(raid.plane)
    if (raid.plane && this.hostiles.includes(raid.plane)) return
    raid.plane = null
    if (this.session.clock.now < raid.at) return
    const kinds = ['fighter', 'diveBomber', 'bomber']
    raid.plane = this.spawn(this.plane(kinds[raid.next]))
    raid.next = (raid.next + 1) % kinds.length
    raid.at = this.session.clock.now + raids.every
  }

  /** Each enemy destroyed counts once. */
  countKills() {
    for (const hostile of this.hostiles) {
      if (!hostile.alive || hostile.body.alive) continue
      hostile.alive = false
      this.score++
    }
  }

  update(dt, t) {
    if (!this.running) return
    const { blocked } = this.vehicleCollisions
    this.player.march = blocked ? 0 : toMeters(scroll)
    this.cameraX = Math.min(this.levelLength, this.cameraX + (blocked ? 0 : scroll * dt))
    this.bounds.min = toMeters(this.cameraX)
    this.bounds.max = toMeters(this.cameraX + canvas2d.width * .9)
    this.airRaid()
    this.escort.update(dt)
    const vehicles = this.hostiles.filter(({ sort }) => sort === 'ground').map(({ body }) => body)
    this.vehicleCollisions.capture(vehicles)
    super.update(dt, t)
    this.vehicleCollisions.resolve(vehicles, dt)
    this.countKills()
    this.returnPassed()
    this.feedback.update()
    if (this.player.dead) this.defeat('Tvoj tenk je uništen.')
    else if (this.cameraX >= this.levelLength) this.victory('Proboj je uspeo. Stigao si do kraja puta.')
  }

  clear() {
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height)
    this.route?.render()
  }

  sceneUI() {
    return /* html */`
      <main class="top-left">
        Score: ${this.score}
        ${progresBar(this.player.health.current / this.player.health.maximum * 100)}
      </main>
    `
  }
}
