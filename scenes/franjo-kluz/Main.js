import { icons, iconImages } from '/core/io/icons.js'
import canvas2d, { drawSky } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { progresBar } from '/ui/components.js'
import { randomInRange } from '/core/utils.js'
import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'
import Sentry from '/core/gameplay/controllers/Sentry.js'
import Gunner, { lead } from '/core/gameplay/controllers/Gunner.js'
import Potez, { plane, markings, controlKeys } from './Potez.js'
import Vehicle from '/core/actor/vehicles/Vehicle.js'
import Rifleman from '/core/actor/soldiers/Rifleman.js'
import Flak, { flak } from '/core/actor/artillery/Flak.js'
import Fighter from '/core/actor/aircraft/Fighter.js'
import DiveBomber from '/core/actor/aircraft/DiveBomber.js'
import { kinds } from './enemies.js'
import { missions } from './missions.js'
import { isLocalCoinHost } from '/ui/DevelopmentCoins.js'
import WorldSprite from '/core/actor/WorldSprite.js'
import Airfield from './Airfield.js'
import ParallaxLayer from './ParallaxLayer.js'

const groundLevel = canvas2d.height
/** The camera rises once the plane climbs above `cameraTop`. */
const cameraTop = canvas2d.height / 4
/**
 * World x of the ruin the plane must fly over, of the airfield a mission takes off from, and of the plane standing on
 * its runway, which begins half the 780 px building past the airfield's x; the sizes come only with the pictures.
 */
const ruinX = 1200
const departureX = -200
const takeoffX = departureX + 600
/** Where the scene is found, to start it again for the next mission. */
const scenePath = 'franjo-kluz'
/** Seconds the story of a won mission shows before the next one: as long as the UI shows a message. */
const nextMissionDelay = 3

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
 * The fastest touchdown the plane survives, the sink rates of a hard landing and of a crash, in pixels per second,
 * and the speed under which it has stopped. The owner wants landing easy: holding down to the ground sinks about
 * 300 px/s and is only a hard landing, and the takeoff speed of 312 leaves room above it.
 */
const landing = { airspeed: 600, hardSink: 150, crashSink: 350, stopped: 20 }
/** The ruin comes back this far ahead after the plane passes it, as the old scrolling scenery did. */
const ruinReturn = { min: canvas2d.width, max: canvas2d.width * 3 }
/** A raider enters this far outside the view unless its raid says otherwise, in pixels. */
const raiderMargin = 200
/** A Ju 87 flies this high above the ground, in pixels: high enough to dive, low enough to be fought. */
const diveBomberAltitude = 450
/** Seconds between the wreck hitting the ground and the defeat screen, so the crash is seen. */
const crashScreenDelay = 1.5

export default class FranjoKluzScene extends Scene2D {
  constructor(manager) {
    super({
      controlKeys,
      intro: 'Break through the enemy to the partisan airfield.',
    })
    this.manager = manager
  }

  init() {
    this.missionIndex = missionToStart || missionToTry()
    missionToStart = 0
    this.mission = missions[this.missionIndex]
    /** Whether the enemy knows the plane is hostile; the NDH plane of a disguised mission fools it until half way. */
    this.alarm = { raised: !this.mission.disguised }
    /** Heard everywhere, not from one place: the whole valley is on alert; in an air raid, from the start. */
    this.siren = { sounds: [new Sound('air-raid-siren.mp3', { profile: 'ambience', autoplay: this.mission.airRaid })] }
    this.audioChildren.push(this.siren)
    const camera = this
    const departure = this.mission.takeoff && new Airfield({ camera, groundY: groundLevel, x: departureX })
    this.player = new Potez({ groundY: groundLevel, groundAt: x => this.groundAt(x), camera, session: this.session,
      src: this.mission.disguised ? markings.ndh : markings.partisan, onAttack: () => this.alertInView(true),
      ...departure && { x: takeoffX, onGround: true } })
    this.aerodrom = new Airfield({ camera, groundY: groundLevel, x: this.mission.airfieldX })
    this.airfields = [departure, this.aerodrom].filter(Boolean)
    this.ruina = new WorldSprite('buildings/ruina.png', { camera, groundY: groundLevel, x: ruinX })
    this.enemies = this.mission.enemies.map(({ kind, x }) => this.createEnemy(kind, x))
    /** Calm soldiers keep watch: they stand and walk their patrol in turn until they fire. */
    this.sentries = this.enemies.filter(enemy => enemy.states?.includes('patrol')).map(soldier => new Sentry(soldier))
    this.raiders = this.mission.raids.map(({ kind }) => this.createRaider(kind))
    /** How many raiders have come so far. */
    this.raidersSent = 0
    /**
     * Those who know the plane is hostile; they fire at it as gunners, the flak leading it with its slow shell, and
     * the Ju 87s dive on it while it stands on the ground.
     */
    this.alerted = new Set()
    this.gunners = this.armed.map(enemy => enemy instanceof DiveBomber ? new Gunner(enemy, this.groundedPlane())
      : new Gunner(enemy, this.player, enemy instanceof Flak ? lead(flak.shellSpeed) : undefined))
    this.followPlane(0)

    // in the first missions the plane can crash into the ruin; later it is only scenery
    if (this.mission.solidRuin) this.player.solidBodies.push(this.ruina)
    this.player.solidBodies.push(...this.enemies.filter(enemy => enemy.vehicle), ...this.raiders)
    this.player.targets.push(...this.enemies, ...this.raiders)
    this.player.fighters.push(...this.raiders)

    this.scenery = [
      new ParallaxLayer({ src: 'nature/shumarak.png', count: 10, depth: .2, z: 2, camera,
        place: height => groundLevel + 5 - height / 2 }),
      new ParallaxLayer({ src: 'nature/oblak.gif', count: 3, depth: .1, drift: -32, z: 3, camera,
        place: () => randomInRange(0, groundLevel) }),
      new ParallaxLayer({ src: 'nature/zbun.png', count: 10, depth: 1, z: -2, camera,
        place: height => randomInRange(groundLevel - height / 2, canvas2d.height) }),
    ]

    // The plane is drawn in front of the buildings and the enemies, so a crash into them is seen burning and falling.
    this.add(...this.airfields, this.ruina, ...this.enemies, ...this.raiders, this.player, ...this.scenery)
    if (this.alarm.raised) this.openFire(this.armed)
  }

  /** The task of the mission flashes up as the plane sets off; the start screen has the game's general orders. */
  start() {
    super.start()
    // the sizes of the airfields and the ruin are known only once their pictures have loaded
    this.ruina.x = this.clearOfAirfields(this.ruina.x)
    this.ui.showMessage(this.mission.intro)
  }

  createEnemy(kind, x) {
    const place = { camera: this, groundY: groundLevel, x }
    if (kind === 'flak') return new Flak({ targets: [this.player], session: this.session, ...place })
    return kinds[kind].rifle
      ? new Rifleman({ ...kinds[kind], targets: [this.player], session: this.session, ...place })
      : new Vehicle({ ...kinds[kind], ...place })
  }

  /** A Bf 109 flies at the plane; a Ju 87 at its height, and bombs what the scene says a burst reaches. */
  createRaider(kind) {
    const options = { camera: this, groundY: groundLevel, session: this.session, onCrash: point => this.player.destroyAround(point) }
    return kind === 'diveBomber'
      ? new DiveBomber({ ...options, groundAt: x => this.groundAt(x), onImpact: point => this.bombGround(point) })
      : new Fighter({ ...options, plane: this.player })
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

  /** A Ju 87's bomb destroys the plane standing on the ground when its body reaches into the blast. */
  bombGround({ x, y }) {
    const { player } = this
    if (player.dead || !player.isGrounded) return
    if (Math.hypot(player.x - x, player.y - y) > plane.blastRadius + Math.max(player.width, player.height) / 2) return
    this.crashReason = 'The bombs caught you on the ground.'
    player.die()
  }

  /** The enemies that can fire at the plane: those with a state to fire in. */
  get armed() {
    return [...this.enemies, ...this.raiders].filter(enemy => enemy.states?.includes('fire'))
  }

  /** The enemy knows the plane is hostile: the living among `enemies` fire at it. */
  openFire(enemies) {
    for (const enemy of enemies) if (enemy.alive) this.alerted.add(enemy)
  }

  /**
   * Before the alarm, the armed enemies in view who see the plane attack, or see others in view firing at it, fire
   * back. Those who come into view while all is calm stay fooled.
   */
  alertInView(attack = false) {
    if (this.alarm.raised) return
    const inView = this.armed.filter(enemy => enemy.alive && enemy.visible && !enemy.offScreen)
    if (attack || inView.some(enemy => this.alerted.has(enemy))) this.openFire(inView)
  }

  /** Each raider comes when the view reaches its place: head on from the right edge, or from behind the left. */
  sendRaiders() {
    const raid = this.mission.raids[this.raidersSent]
    if (!raid || this.session.state !== 'running') return
    const edge = raid.fromBehind ? this.cameraX : this.cameraX + canvas2d.width
    if (edge < raid.x) return
    const raider = this.raiders[this.raidersSent++]
    if (raider.alive) this.enterRaider(raider, raid)
  }

  /** In an air raid a raider that has left the view comes back from the other side until it is shot down. */
  returnRaiders() {
    if (!this.mission.airRaid || this.session.state !== 'running') return
    for (const raider of this.raiders.slice(0, this.raidersSent))
      if (raider.alive && !raider.visible) this.enterRaider(raider, { fromBehind: !raider.fromBehind })
  }

  /** A fighter comes at the plane's height, a Ju 87 at its own. */
  enterRaider(raider, { fromBehind, distance = raiderMargin }) {
    const x = fromBehind ? this.cameraX - distance : this.cameraX + canvas2d.width + distance
    const y = raider instanceof DiveBomber ? groundLevel - diveBomberAltitude : this.player.y
    raider.enter({ x, y, fromBehind })
  }

  /** Half way to the airfield the enemy sees through the disguise. */
  raiseAlarm() {
    if (this.alarm.raised || this.player.x < this.aerodrom.x / 2) return
    this.soundAlarm()
  }

  /** The air raid siren wails and all the enemy opens fire. */
  soundAlarm() {
    this.alarm.raised = true
    this.siren.sounds[0].play()
    this.openFire(this.armed)
  }

  /** The view moves on at the plane's airspeed and rises with it above `cameraTop`, never sinking under the ground. */
  followPlane(dt) {
    this.cameraX += this.player.airspeed * dt
    this.cameraY = Math.min(0, this.player.y - cameraTop)
  }

  /** The height of what stands under `x`: a runway's top, or the ground line elsewhere. */
  groundAt(x) {
    return this.airfieldAt(x)?.surface ?? groundLevel
  }

  /** The airfield whose runway is under `x`, if any. */
  airfieldAt(x) {
    return this.airfields.find(airfield => airfield.holds(x))
  }

  /** The ruin never comes back over the airfield to land on or its runway. */
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

  returnRuin() {
    if (this.ruina.x + this.ruina.width / 2 > this.cameraX) return
    this.ruina.x = this.clearOfAirfields(this.cameraX + canvas2d.width + randomInRange(ruinReturn.min, ruinReturn.max))
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
   * The plane may touch the ground only on a runway and slowly enough, or it crashes. Flying past the runway to land
   * on loses the mission; stopping on it wins, however many enemies were destroyed on the way, but in an air raid
   * only once no raider is left.
   */
  checkLanding() {
    const { player, aerodrom } = this
    if (player.dead) return
    if (!player.isGrounded) {
      if (player.x > aerodrom.runway.right) this.defeat('You missed the airfield.')
      return
    }
    const { airspeed, sink } = player.touchdown
    this.crashReason = !this.airfieldAt(player.x) ? 'You touched down off the runway.'
      : airspeed > landing.airspeed ? 'You touched down too fast.'
        : sink > landing.crashSink ? 'You landed too hard.' : null
    if (this.crashReason) return player.die()
    if (aerodrom.holds(player.x) && player.airspeed < landing.stopped && this.raidersDown) {
      const kind = sink < landing.hardSink ? 'A soft landing.' : 'A hard landing.'
      this.completeMission(`Mission successfully completed! ${kind}`)
    }
  }

  get raidersDown() {
    return !this.mission.airRaid || this.raiders.every(raider => raider.dead)
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
        ${progresBar(Math.max(0, health) / plane.health * 100)}
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
    this.raiseAlarm()
    this.alertInView()
    for (const sentry of this.sentries) if (!this.alerted.has(sentry.body)) sentry.update(dt)
    for (const gunner of this.gunners) if (this.alerted.has(gunner.body)) gunner.update()
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
