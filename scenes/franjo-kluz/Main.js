import { icons, iconImages } from '/core/io/icons.js'
import canvas2d, { drawSky } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { progresBar } from '/ui/components.js'
import { randomInRange } from '/core/utils.js'
import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'
import Input from '/core/io/Input.js'
import { attackLabels } from '/core/io/keys.js'
import { baseControls } from '/ui/Controls.js'
import { isLocalCoinHost } from '/ui/DevelopmentCoins.js'
import { sideProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import Body from '/core/gameplay/bodies/Body.js'
import Potez, { plane } from '/core/gameplay/bodies/aircraft/Potez.js'
import Fighter from '/core/gameplay/bodies/aircraft/Fighter.js'
import DiveBomber from '/core/gameplay/bodies/aircraft/DiveBomber.js'
import Rifleman, { riflemanKinds } from '/core/gameplay/bodies/soldiers/Rifleman.js'
import Vehicle, { vehicleKinds } from '/core/gameplay/bodies/vehicles/Vehicle.js'
import Hummel from '/core/gameplay/bodies/vehicles/Hummel.js'
import Flak, { flak } from '/core/gameplay/bodies/artillery/Flak.js'
import Sentry from '/core/gameplay/controllers/Sentry.js'
import Gunner, { lead } from '/core/gameplay/controllers/Gunner.js'
import Interceptor from '/core/gameplay/controllers/Interceptor.js'
import PlaneKeys from '/core/gameplay/controllers/PlaneKeys.js'
import RearGunner from '/core/gameplay/controllers/RearGunner.js'
import PotezSprite, { markings } from '/core/actor/aircraft/PotezSprite.js'
import FighterSprite from '/core/actor/aircraft/FighterSprite.js'
import DiveBomberSprite from '/core/actor/aircraft/DiveBomberSprite.js'
import RiflemanSprite from '/core/actor/soldiers/RiflemanSprite.js'
import VehicleSprite from '/core/actor/vehicles/VehicleSprite.js'
import FlakSprite from '/core/actor/artillery/FlakSprite.js'
import WorldSprite from '/core/actor/WorldSprite.js'
import { groundUnitLooks } from '/core/actor/groundUnitLooks.js'
import { missions } from './missions.js'
import Airfield from './Airfield.js'
import ParallaxLayer from './ParallaxLayer.js'

/** The Potez sinks unless it is flown, metres a second squared: the player has to keep it up (a rule of this game). */
const potezSink = 2.92

const groundLevel = canvas2d.height
/** How many pixels a metre of the world is drawn: the bodies are in metres, the levels and scenery in pixels. */
const pxPerMeter = 30.8
const toMeters = pixels => pixels / pxPerMeter
/** The camera rises once the plane climbs above `cameraTop`. */
const cameraTop = canvas2d.height / 4
/**
 * World x of the ruin the plane must fly over, of the airfield a mission takes off from, and of the plane standing on
 * its runway, which begins half the 780 px building past the airfield's x; the sizes come only with the pictures.
 */
const ruinX = 1200
const departureX = -200
const takeoffX = departureX + 600
/** Where the plane starts in the air, in pixels. */
const flightStart = { x: 200, y: 200 }
/** Where the scene is found, to start it again for the next mission. */
const scenePath = 'franjo-kluz'
/** Seconds the story of a won mission shows before the next one: as long as the UI shows a message. */
const nextMissionDelay = 3
/** The key that drops a bomb; on a phone the 💣 button. */
export const bombKey = attackLabels.Enter

/** The mission the next scene of this game starts with: the first, unless one was just won. */
let missionToStart = 0

/** The next scene of this game starts with mission `index`. */
export const continueWithMission = index => {
  missionToStart = index
}

/**
 * On the local server, `?mission=3` before the `#` starts the game with that mission, to try a level without flying
 * the ones before it.
 */
const missionToTry = () => {
  if (!isLocalCoinHost(location.hostname)) return 0
  const number = Number(new URLSearchParams(location.search).get('mission'))
  return Number.isInteger(number) && number >= 1 && number <= missions.length ? number - 1 : 0
}
/**
 * The fastest touchdown the plane survives, the sink rates of a hard landing and of a crash, in metres a second, and
 * the speed under which it has stopped. The owner wants landing easy: holding down to the ground sinks about 10 m/s
 * and is only a hard landing, and the takeoff speed of 10.14 leaves room above it.
 */
const landing = { airspeed: 19.5, hardSink: 4.87, crashSink: 11.36, stopped: .65 }
/** How close to a bomb's impact a target is destroyed, in metres: the reach of the burst beyond its body. */
export const blast = { radius: 3.89 }
/** The ruin comes back this far ahead after the plane passes it, as the old scrolling scenery did. */
const ruinReturn = { min: canvas2d.width, max: canvas2d.width * 3 }
/** A raider enters this far outside the view unless its raid says otherwise, and has gone this far past it, in px. */
const raiderMargin = 200
const raiderGone = 600
/** A Ju 87 flies this high above the ground, in metres: high enough to dive, low enough to be fought. */
const diveBomberAltitude = 14.61
/** Seconds between the wreck hitting the ground and the defeat screen, so the crash is seen. */
const crashScreenDelay = 1.5

export default class FranjoKluzScene extends Scene2D {
  constructor(manager) {
    super({
      controlKeys: { ...baseControls, Space: 'Machine gun', [bombKey]: 'Drop bomb' },
      intro: 'Break through the enemy to the partisan airfield.',
    })
    this.manager = manager
  }

  init() {
    this.missionIndex = missionToStart || missionToTry()
    missionToStart = 0
    this.mission = missions[this.missionIndex]
    this.projection = sideProjection({ pxPerMeter, groundY: groundLevel })
    /** What the screen shows, where rounds leave play. */
    this.screenView = screenView(this.projection, this)
    /** Whether the enemy knows the plane is hostile; the NDH plane of a disguised mission fools it until half way. */
    this.alarm = { raised: !this.mission.disguised }
    /** Heard everywhere, not from one place: the whole valley is on alert; in an air raid, from the start. */
    this.siren = { sounds: [new Sound('air-raid-siren.mp3', { profile: 'ambience', autoplay: this.mission.airRaid })] }
    this.audioChildren.push(this.siren)
    const camera = this
    const departure = this.mission.takeoff && new Airfield({ camera, groundY: groundLevel, x: departureX })
    this.aerodrom = new Airfield({ camera, groundY: groundLevel, x: this.mission.airfieldX })
    this.airfields = [departure, this.aerodrom].filter(Boolean)
    this.ruina = new WorldSprite('buildings/ruina.png', { camera, groundY: groundLevel, x: ruinX })

    /** What the plane's guns and bombs can hit, what the observer fires back at, and what it can crash into. */
    this.targets = []
    this.fighters = []
    this.solids = []
    /** The view's left and right in metres, which keep the plane in it. */
    this.bounds = { min: 0, max: toMeters(canvas2d.width) }
    const start = departure ? { x: takeoffX, y: groundLevel } : flightStart
    this.player = new Potez({
      x: toMeters(start.x), y: toMeters(groundLevel - start.y), onGround: Boolean(departure),
      clock: this.session.clock, groundAt: x => this.groundAt(x), bounds: this.bounds, canFire: () => this.running,
      targets: this.targets, fighters: this.fighters, solids: this.solids, onBombImpact: point => this.destroyAround(point),
      view: this.screenView, sink: potezSink,
    })
    this.playerView = new PotezSprite(this.player, { src: this.mission.disguised ? markings.ndh : markings.partisan,
      ...this.views })
    this.audioPlayer = () => this.playerView
    this.input = new Input({ attackKey: 'Space', buttonDict: { attack: icons.shoot, special: icons.bomb } })
    this.controllers.push(new PlaneKeys(this.player, { input: this.input, bombKey }),
      new RearGunner(this.player, { fighters: this.fighters }))
    /** How many shots and bombs the plane has let go, which give away a disguised plane to the enemy who sees them. */
    this.attacksSeen = 0

    this.enemies = this.mission.enemies.map(({ kind, x }) => this.createEnemy(kind, x))
    this.targets.push(...this.enemies.map(({ body }) => body))
    this.solids.push(...this.enemies.filter(({ body }) => body instanceof Vehicle).map(({ body }) => body))
    // in the first missions the plane can crash into the ruin; later it is only scenery
    this.ruinBody = new Body({ states: { idle: {}, dead: {} } })
    if (this.mission.solidRuin) this.solids.push(this.ruinBody)
    this.raiders = this.mission.raids.map(({ kind }) => this.createRaider(kind))
    /** How many raiders have come so far, and those now in the air over the view. */
    this.raidersSent = 0
    this.inPlay = new Set()
    /** Those who know the plane is hostile; their gunners fire at it, and the soldiers among them keep watch no more. */
    this.alerted = new Set()
    // calm soldiers keep watch: they stand and walk their patrol in turn until they fire
    this.controllers.push(...this.enemies.filter(({ body }) => body instanceof Rifleman).map(({ body }) => new Sentry(body)))
    this.followPlane(0)

    this.scenery = [
      new ParallaxLayer({ src: 'nature/shumarak.png', count: 10, depth: .2, z: 2, camera,
        place: height => groundLevel + 5 - height / 2 }),
      new ParallaxLayer({ src: 'nature/oblak.gif', count: 3, depth: .1, drift: -32, z: 3, camera,
        place: () => randomInRange(0, groundLevel) }),
      new ParallaxLayer({ src: 'nature/zbun.png', count: 10, depth: 1, z: -2, camera,
        place: height => randomInRange(groundLevel - height / 2, canvas2d.height) }),
    ]

    // The plane is drawn in front of the buildings and the enemies, so a crash into them is seen burning and falling.
    this.add(...this.airfields, this.ruina, ...this.enemies.flatMap(({ body, view }) => [body, view]), this.player,
      this.playerView, ...this.scenery)
    if (this.alarm.raised) this.openFire(this.armed)
  }

  /** What every view of this scene draws with. */
  get views() {
    return { projection: this.projection, camera: this }
  }

  get running() {
    return this.session.state === 'running'
  }

  /** The task of the mission flashes up as the plane sets off; the start screen has the game's general orders. */
  start() {
    super.start()
    // the sizes of the airfields and the ruin are known only once their pictures have loaded
    this.ruina.x = this.clearOfAirfields(this.ruina.x)
    this.placeRuin()
    this.ui.showMessage(this.mission.intro)
  }

  /** An enemy on the ground at `x` pixels: its body, which stands on the ground, and its view. */
  createEnemy(kind, x) {
    const place = { x: toMeters(x), clock: this.session.clock, targets: [this.player], canFire: () => this.running }
    if (kind === 'flak') {
      const body = new Flak(place)
      body.y = body.size.height / 2
      return { body, view: new FlakSprite(body, this.views) }
    }
    const { art, attack, facing = 1 } = groundUnitLooks[kind]
    if (riflemanKinds[kind]) {
      const body = new Rifleman({ ...place, kind: riflemanKinds[kind], y: riflemanKinds[kind].size.height / 2, yaw: Math.PI,
        view: this.screenView })
      return { body, view: new RiflemanSprite(body, { art, ...this.views }) }
    }
    const VehicleBody = kind === 'tank' ? Hummel : Vehicle
    const body = new VehicleBody({ kind: vehicleKinds[kind], x: place.x, y: vehicleKinds[kind].size.height / 2,
      yaw: facing < 0 ? Math.PI : 0, targets: [this.player], canFire: () => this.running })
    return { body, view: new VehicleSprite(body, { art, attack, facing, ...this.views }) }
  }

  /** A Bf 109 flies at the plane; a Ju 87 at its own height, and bombs what the scene says its burst reaches. */
  createRaider(kind) {
    const options = { clock: this.session.clock, canFire: () => this.running, groundAt: x => this.groundAt(x),
      onCrash: point => this.destroyAround(point) }
    if (kind === 'diveBomber') {
      const body = new DiveBomber({ ...options, onImpact: point => this.bombGround(point) })
      return { body, view: new DiveBomberSprite(body, this.views) }
    }
    const body = new Fighter({ ...options, targets: [this.player], view: this.screenView })
    return { body, view: new FighterSprite(body, this.views) }
  }

  /** What the Ju 87s dive on: the plane, only while it stands on the ground. */
  groundedPlane() {
    const { player } = this
    return {
      get x() {
        return player.x
      },
      get y() {
        return player.y
      },
      get alive() {
        return player.alive && player.isGrounded
      },
    }
  }

  /** A gunner for an armed enemy: the flak leads the plane with its slow shell; the Ju 87s dive on it on the ground. */
  gunnerFor(body) {
    if (body instanceof DiveBomber) return new Gunner(body, this.groundedPlane())
    return new Gunner(body, this.player, body instanceof Flak ? lead(flak.shellSpeed) : undefined)
  }

  /** Every living target whose body reaches into a burst at `point` is destroyed. */
  destroyAround({ x, y }) {
    for (const target of this.targets) {
      const reach = blast.radius + Math.max(target.size.length, target.size.height) / 2
      if (target.alive && Math.hypot(target.x - x, target.y - y) <= reach) target.setState('dead')
    }
  }

  /** A Ju 87's bomb destroys the plane standing on the ground when its body reaches into the blast. */
  bombGround({ x, y }) {
    const { player } = this
    if (player.dead || !player.isGrounded) return
    if (Math.hypot(player.x - x, player.y - y) > blast.radius + Math.max(player.size.length, player.size.height) / 2) return
    this.crashReason = 'The bombs caught you on the ground.'
    player.setState('dead')
  }

  /** The enemies that can aim at the plane; the Hummel's fixed cannon is not an automatic anti-aircraft gun. */
  get armed() {
    return [...this.enemies, ...this.raiders].map(({ body }) => body)
      .filter(body => body.states.includes('fire') && typeof body.aimAt === 'function')
  }

  /** The enemy knows the plane is hostile: the living among `bodies` stop keeping watch and fire at it. */
  openFire(bodies) {
    for (const body of bodies) {
      if (body.dead || this.alerted.has(body)) continue
      this.alerted.add(body)
      this.release(body, Sentry)
      this.controllers.push(this.gunnerFor(body))
    }
  }

  /** Takes `body` from its controllers of `kind`. */
  release(body, kind) {
    const kept = this.controllers.filter(controller => !(controller.body === body && controller instanceof kind))
    this.controllers.splice(0, this.controllers.length, ...kept)
  }

  /** Whether the body is in the air or on the ground of the view. */
  inView(body) {
    const { x, y } = this.projection.point(body)
    const halfWidth = this.projection.length(body.size.length) / 2, halfHeight = this.projection.length(body.size.height) / 2
    return x + halfWidth > this.cameraX && x - halfWidth < this.cameraX + canvas2d.width &&
      y + halfHeight > this.cameraY && y - halfHeight < this.cameraY + canvas2d.height
  }

  /** Whether the enemy is on the ground, or a raider now over the view. */
  isPresent(body) {
    return !this.raiders.some(raider => raider.body === body) || this.inPlay.has(body)
  }

  /**
   * Before the alarm, the armed enemies in view who see the plane attack, or see others in view firing at it, fire
   * back. Those who come into view while all is calm stay fooled.
   */
  alertInView(attack = false) {
    if (this.alarm.raised) return
    const inView = this.armed.filter(body => body.alive && this.isPresent(body) && this.inView(body))
    if (attack || inView.some(body => this.alerted.has(body))) this.openFire(inView)
  }

  /** A shot or a bomb of the plane gives it away. */
  watchAttacks() {
    const attacks = this.player.shotsFired + this.player.bombsDropped
    if (attacks > this.attacksSeen) this.alertInView(true)
    this.attacksSeen = attacks
  }

  /** Each raider comes when the view reaches its place: head on from the right edge, or from behind the left. */
  sendRaiders() {
    const raid = this.mission.raids[this.raidersSent]
    if (!raid || !this.running) return
    const edge = raid.fromBehind ? this.cameraX : this.cameraX + canvas2d.width
    if (edge < raid.x) return
    const raider = this.raiders[this.raidersSent++]
    if (raider.body.alive) this.enterRaider(raider, raid)
  }

  /** In an air raid a raider that has left the view comes back from the other side until it is shot down. */
  returnRaiders() {
    if (!this.mission.airRaid || !this.running) return
    for (const raider of this.raiders.slice(0, this.raidersSent))
      if (raider.body.alive && !this.inPlay.has(raider.body)) this.enterRaider(raider, { fromBehind: !raider.fromBehind })
  }

  /**
   * A raider comes `distance` pixels outside the view: a fighter at the plane's height, flying past it, a Ju 87 at its
   * own. It is drawn behind the plane.
   */
  enterRaider(raider, { fromBehind, distance = raiderMargin }) {
    const { body, view } = raider
    raider.fromBehind = fromBehind
    body.x = toMeters(fromBehind ? this.cameraX - distance : this.cameraX + canvas2d.width + distance)
    body.face(fromBehind ? 1 : -1)
    if (body instanceof DiveBomber) {
      body.y = this.groundAt(body.x) + diveBomberAltitude
      body.enter()
    } else {
      body.y = this.player.y
      this.controllers.push(new Interceptor(body, { plane: this.player, groundAt: x => this.groundAt(x) }))
    }
    this.inPlay.add(body)
    this.targets.push(body)
    this.fighters.push(body)
    this.solids.push(body)
    this.world.objects.splice(this.world.objects.indexOf(this.player), 0, body, view)
    this.syncSounds()
  }

  /** Takes `body` out of the lists the plane fights; its view stays to show its crash. */
  leaveFight(body) {
    for (const list of [this.targets, this.fighters, this.solids]) if (list.includes(body)) list.splice(list.indexOf(body), 1)
  }

  /**
   * A raider far past the view has gone: head on past its left, from behind past its right, or past its left once it
   * has dropped behind the faster view. A crashed one fights no more.
   */
  removeRaiders() {
    for (const raider of this.raiders) {
      const { body, view } = raider
      if (!this.inPlay.has(body)) continue
      if (body.crashed) this.leaveFight(body)
      if (body.dead) continue
      const screenX = this.projection.point(body).x - this.cameraX
      if (screenX >= -raiderGone && !(raider.fromBehind && screenX > canvas2d.width + raiderGone)) continue
      this.inPlay.delete(body)
      this.leaveFight(body)
      this.release(body, Interceptor)
      this.remove(body, view)
    }
  }

  /** Half way to the airfield the enemy sees through the disguise. */
  raiseAlarm() {
    if (this.alarm.raised || this.player.x * pxPerMeter < this.aerodrom.x / 2) return
    this.soundAlarm()
  }

  /** The air raid siren wails and all the enemy opens fire. */
  soundAlarm() {
    this.alarm.raised = true
    this.siren.sounds[0].play()
    this.openFire(this.armed)
  }

  /**
   * The view moves on at the plane's airspeed and rises with it above `cameraTop`, never sinking under the ground; the
   * plane keeps within it.
   */
  followPlane(dt) {
    this.cameraX += this.player.airspeed * pxPerMeter * dt
    this.cameraY = Math.min(0, this.projection.point(this.player).y - cameraTop)
    this.bounds.min = toMeters(this.cameraX)
    this.bounds.max = toMeters(this.cameraX + canvas2d.width)
  }

  /** The height in metres of what stands under `x` metres: a runway's top, or the ground elsewhere. */
  groundAt(x) {
    const surface = this.airfieldAt(x)?.surface ?? groundLevel
    return toMeters(groundLevel - surface)
  }

  /** The airfield whose runway is under `x` metres, if any. */
  airfieldAt(x) {
    return this.airfields.find(airfield => airfield.holds(x * pxPerMeter))
  }

  /** Where the ruin may stand near `x`: past the building and runway of any airfield it would stand on. */
  clearOfAirfields(x) {
    const half = this.ruina.width / 2
    let place = x
    for (const airfield of this.airfields) {
      const left = airfield.x - airfield.width / 2
      if (place + half > left && place - half < airfield.runway.right) place = airfield.runway.right + this.ruina.width
    }
    return place
  }

  /** The ruin the plane can crash into stands where its picture stands. */
  placeRuin() {
    const { ruina, ruinBody } = this
    ruinBody.size = { length: toMeters(ruina.width), height: toMeters(ruina.height), width: 1 }
    ruinBody.x = toMeters(ruina.x)
    ruinBody.y = toMeters(groundLevel - ruina.y)
  }

  /** The ruin never comes back over the airfield to land on or its runway. */
  returnRuin() {
    if (this.ruina.x + this.ruina.width / 2 > this.cameraX) return
    this.ruina.x = this.clearOfAirfields(this.cameraX + canvas2d.width + randomInRange(ruinReturn.min, ruinReturn.max))
    this.ruina.audioRevision = (this.ruina.audioRevision ?? 0) + 1
    this.placeRuin()
  }

  checkOutcome() {
    if (this.player.wrecked && !this.crashSeen) {
      this.crashSeen = true
      this.session.gameplay.after(crashScreenDelay, () => this.defeat(this.crashReason ?? 'You fell gloriously.'))
    }
    this.checkLanding()
  }

  /**
   * The plane may touch the ground only on a runway and slowly enough, or it crashes. Flying past the runway to land
   * on loses the mission; stopping on it wins, however many enemies were destroyed on the way, but in an air raid
   * only once no raider is left.
   */
  checkLanding() {
    const { player, aerodrom } = this
    if (player.dead) return
    if (!player.isGrounded) {
      if (player.x * pxPerMeter > aerodrom.runway.right) this.defeat('You missed the airfield.')
      return
    }
    const { airspeed, sink } = player.touchdown
    this.crashReason = !this.airfieldAt(player.x) ? 'You touched down off the runway.'
      : airspeed > landing.airspeed ? 'You touched down too fast.'
        : sink > landing.crashSink ? 'You landed too hard.' : null
    if (this.crashReason) return player.setState('dead')
    if (aerodrom.holds(player.x * pxPerMeter) && player.airspeed < landing.stopped && this.raidersDown) {
      const kind = sink < landing.hardSink ? 'A soft landing.' : 'A hard landing.'
      this.completeMission(`Mission successfully completed! ${kind}`)
    }
  }

  get raidersDown() {
    return !this.mission.airRaid || this.raiders.every(({ body }) => body.dead)
  }

  /** The last mission wins the game; any other tells how its story goes on and starts the next mission. */
  completeMission(text) {
    if (this.missionIndex === missions.length - 1) return this.victory(text)
    if (this.missionCompleted) return
    this.missionCompleted = true
    this.ui.showMessage(this.mission.outro)
    this.session.presentation.after(nextMissionDelay, () => {
      continueWithMission(this.missionIndex + 1)
      this.manager.start(scenePath, true, { prepaid: true })
    })
  }

  /** The plane's health, then rounds above bombs, as similar games show them, top left as in Vis. */
  sceneUI() {
    const { bombs, ammo, health } = this.player
    return /* html */`
      <div class="top-left">
        ${progresBar(health.current / plane.health * 100)}
        <div>
          <img src="${assets.images}${iconImages.ammunition}" alt="Rounds" width="32" height="8"> ${ammo}
          <br>${icons.bomb.repeat(bombs)}
        </div>
      </div>
    `
  }

  clear() {
    drawSky(groundLevel - this.cameraY, 'blue', 'lightblue', -this.cameraY)
  }

  update(dt, t) {
    this.followPlane(dt)
    super.update(dt, t)
    this.returnRuin()
    this.sendRaiders()
    this.returnRaiders()
    this.removeRaiders()
    this.raiseAlarm()
    this.watchAttacks()
    this.alertInView()
    this.checkOutcome()
  }

  end() {
    this.input?.end()
    super.end()
  }
}
