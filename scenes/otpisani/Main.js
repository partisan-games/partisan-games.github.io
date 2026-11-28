import { attackLabels } from '/core/io/keys.js'
import Sound from '/core/io/audio/SoundSource.js'
import Scene2D from '/core/Scene2D.js'
import Occupier from '/core/gameplay/bodies/soldiers/Occupier.js'
import FrontEnemySprite from '/core/actor/soldiers/FrontEnemySprite.js'
import { coveredMachineGunner } from '/core/actor/soldiers/frontEnemyArt.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'
import { sideProjection } from '/core/actor/projection.js'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import { healthBar } from '/ui/components.js'
import Health from '/core/gameplay/Health.js'
import Explosion from '/core/actor/effects/Explosion.js'
import { gameplayInputAllowed } from '/core/io/inputContext.js'
import { randomInRange } from '/core/utils.js'
import { icons } from '/core/io/icons.js'
import streets from './streets.js'
import Panorama from './Panorama.js'
import AmbushView from './AmbushView.js'
import CrossingTank from './CrossingTank.js'
import CrossingArmoredCar from './CrossingArmoredCar.js'
import SupplyCrate from '/core/objects/SupplyCrate.js'
import standingArt from '/core/actor/soldiers/frontStandingArt.js'
import ThrownGrenade from './ThrownGrenade.js'
import ReliefTank from './ReliefTank.js'
import { texts } from '/scenes/texts.js'

const text = texts.otpisani

/** The Germans come in turn: the rifleman, the sentry and the full figure shared with Neretva. */
const lineup = ['rifleman', 'sentry', 'nemac']
const coverLineup = ['rifleman', 'machineGunner', 'submachineGunner', 'nemac']
const doorLineup = ['rifleman', 'submachineGunner', 'sentry', 'nemac']
/**
 * How fast the street slides by, in screen heights a second; how long, in seconds, a German in hiding waits before he
 * fires and how long he fires before he hides again; and what share of the Germans step out of hiding.
 */
const pace = { slide: .03, aim: [.6, 1.4], exposed: [2.5, 4], ambushShare: .7 }
const tankArrival = 9
/**
 * The Red Army's help (owner, 2026-11-27): once a street, `arrival` seconds into it and once no German vehicle is on
 * it, a T-34 drives across the other way and fells a few of the Germans in sight.
 */
const relief = { arrival: 24 }
const supplies = { magazine: 24, roundsPerCrate: 12, grenades: 3, reloadTime: 1.6 }
/** How far, in metres at each German's own distance, a hand grenade fells the men round where it bursts. */
const grenadeReach = 2
const canShoot = ({ session, ui }) => session.state === 'running' && !ui.screen && !ui.ended && !ui.outro

export default class OtpisaniScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { [attackLabels.pointer]: 'shoot', [attackLabels.rightPointer]: 'grenade' },
      intro: text.intro,
      reportText: text.report,
    })
    document.addEventListener('auxclick', this.handleAuxClick)
  }

  init() {
    // The stationary gunner stands in the middle of what the camera shows, independent of the aim cursor.
    this.player = { position: { x: this.width * .5, y: this.height * .95 }, sounds: [] }
    this.player.shotSound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.player.shotSound)
    this.health = new Health()
    this.audio = new Sound('otpisani.mp3', { stream: true, profile: 'music', loop: true })
    this.player.sounds.push(this.audio)
    this.grenadeSound = new Sound('explosion.mp3')
    this.player.sounds.push(this.grenadeSound)
    this.blast = new Explosion(this, { scale: .65 })
    this.add(this.blast)
    this.spawned = 0
    this.ambushesSpawned = { cover: 0, door: 0 }
    this.poeni = 0
    /** The occupiers, `{ body, view, spot }`; a German in hiding has the spot he hides at. */
    this.occupiers = []
    this.crates = []
    /** The grenades in flight, which burst once they land. */
    this.thrown = new Set()
    /** How long each occupier still walking has walked, and how long he walks before he fires, in seconds. */
    this.walks = new Map()
    /** How long each German out of hiding has been out, when he fires and when he hides again. */
    this.ambushes = new Map()
    // every street loads at the start, so the next one is there the moment it begins
    this.panoramas = streets.map(({ image }) => new Panorama(image, this))
    this.startStage(0)
    showCrosshair()
  }

  /** The street of `index` slides in from its start, with no Germans yet and its own count of the fallen. */
  startStage(index) {
    for (const { body, view } of this.occupiers) this.remove(body, view)
    this.remove(...this.crates, ...this.thrown)
    this.thrown.clear()
    this.occupiers = []
    this.walks.clear()
    this.ambushes.clear()
    if (this.tank) this.remove(this.tank)
    this.tank = null
    this.tankTimer = 0
    this.tankSpawned = false
    if (this.relief) this.remove(this.relief)
    this.relief = null
    this.reliefTimer = 0
    this.reliefSent = false
    this.grenades = supplies.grenades
    this.ammunition = supplies.magazine
    this.reloadTime = 0
    this.grenadeArmed = false
    this.blast.hide()
    this.stage = streets[index]
    this.stageIndex = index
    this.fallen = 0
    this.background = this.panoramas[index]
    this.cameraX = 0
    this.crates = this.stage.supplies.map(([x, feet]) => new SupplyCrate({ x, feet, scale: () => this.scale }))
    this.add(...this.crates)
    this.spawnElapsed = 0
    this.intervalIzlaska = 3000
    this.dodajNeprijatelja()
  }

  /** Screen pixels to a pixel of the panorama. */
  get scale() {
    return this.background.scale
  }

  /** The panorama's pixels the camera shows now, with a margin so no one appears at the very edge. */
  get shown() {
    const margin = 60
    return { from: (this.cameraX + margin) / this.scale, to: (this.cameraX + this.width - margin) / this.scale }
  }

  /** The projection of a place where a man 1.8 m is `man` panorama pixels tall, his feet on `feet`. */
  projectionAt({ feet, man }) {
    return sideProjection({ pxPerMeter: man / 1.8 * this.scale, groundY: feet * this.scale })
  }

  /** A German at `x` panorama pixels, with what draws him there. */
  occupierAt(place, x, kind, options = {}) {
    const projection = this.projectionAt(place)
    // the full figure stands with its feet on its point, the others with their middle
    const body = new Occupier({ x: x * this.scale / projection.length(1), y: kind === 'nemac' ? 0 : .9,
      shotInterval: enemyKinds[kind]?.shotInterval, ...options })
    // the full figure is drawn at its art's own scale unless told how many of its pixels make a metre here
    const view = kind === 'nemac'
      ? new TrenchSoldierSprite(body, { faction: 'nemci', projection, camera: this,
        scale: projection.length(1) / standingArt.pixelsPerMetre })
      : new FrontEnemySprite(body, { kind, projection, camera: this })
    return { body, view }
  }

  /** Most Germans step out of a door or rise behind cover in sight; the others cross a street from an edge. */
  dodajNeprijatelja() {
    const { from, to } = this.shown
    const taken = new Set(this.occupiers.map(({ spot }) => spot))
    const spots = this.stage.spots.filter(spot => !taken.has(spot) && spot.to > from && spot.from < to)
    if (spots.length && Math.random() < pace.ambushShare) return this.ambush(spots[Math.floor(Math.random() * spots.length)])
    const fromLeft = Math.random() > .5
    const edge = fromLeft ? from : to
    const street = this.stage.streets.find(street => street.from <= edge && edge <= street.to)
    if (!street) return
    const kind = lineup[this.spawned++ % lineup.length]
    const { body, view } = this.occupierAt(street, edge, kind, { yaw: fromLeft ? 0 : Math.PI, initial: 'move' })
    this.occupiers.push({ body, view })
    this.walks.set(body, { walked: 0, walkTime: randomInRange(.7, 3.2) })
    this.add(body, view)
  }

  /**
   * A German appears at `spot`, somewhere along it: in a doorway, or rising behind cover or in a window. He aims a
   * while, fires, and hides again unless he falls.
   */
  ambush(spot) {
    const x = randomInRange(Math.max(spot.from, this.shown.from), Math.min(spot.to, this.shown.to))
    // a window shows him from the hips up, so he stands there as in a doorway; cover hides a crouching one
    const covered = spot.opening !== undefined && spot.opening.top === undefined
    const kinds = covered ? coverLineup : doorLineup
    let kind = kinds[this.ambushesSpawned[covered ? 'cover' : 'door']++ % kinds.length]
    if (kind === 'machineGunner') {
      const { anchor, muzzle, standingPixels } = coveredMachineGunner
      const muzzleHeight = spot.man * (anchor.y - muzzle[1]) / standingPixels
      if (spot.feet - spot.opening.bottom >= muzzleHeight) kind = 'rifleman'
    }
    const { body, view } = this.occupierAt(spot, x, kind)
    const opening = spot.opening && Object.fromEntries(Object.entries(spot.opening).map(([side, at]) => [side, at * this.scale]))
    const shown = new AmbushView(view, { opening })
    this.occupiers.push({ body, view: shown, spot })
    this.ambushes.set(body, { out: 0, aim: randomInRange(...pace.aim), exposed: randomInRange(...pace.exposed) })
    this.add(body, shown)
  }

  /** Sets each occupier who has walked his while to fire; a fallen one walks no more. */
  attack(dt) {
    for (const [occupier, walk] of this.walks)
      if (occupier.dead) this.walks.delete(occupier)
      else if ((walk.walked += dt) > walk.walkTime) {
        occupier.setState('attack')
        this.walks.delete(occupier)
      }
  }

  /** A German out of hiding fires once he has aimed, and hides again once he has been out his while. */
  lieInWait(dt) {
    for (const [body, wait] of this.ambushes) {
      if (body.dead) {
        const { view: { view } } = this.occupiers.find(occupier => occupier.body === body)
        if (view.leavesBody === false) this.removeAmbush(body)
        else this.ambushes.delete(body)
        continue
      }
      wait.out += dt
      if (wait.out > wait.aim && body.state !== 'attack') body.setState('attack')
      if (wait.out < wait.aim + wait.exposed) continue
      this.removeAmbush(body)
    }
  }

  removeAmbush(body) {
    this.ambushes.delete(body)
    const index = this.occupiers.findIndex(occupier => occupier.body === body)
    this.remove(body, this.occupiers[index].view)
    this.occupiers.splice(index, 1)
  }

  get energija() {
    return this.health.current
  }

  updateTank(dt) {
    if (this.tank) {
      const { x, width, direction, destroyed } = this.tank
      const passed = direction > 0 ? x - width / 2 > this.cameraX + this.width : x + width / 2 < this.cameraX
      if (passed || (destroyed && x + width / 2 < this.cameraX)) {
        this.remove(this.tank)
        this.tank = null
      }
      return
    }
    if (this.tankSpawned) return
    this.tankTimer += dt
    if (this.tankTimer < tankArrival) return
    const place = this.crossingFrom(this.germanDirection)
    if (!place) return
    const { vehicle } = this.stage
    const tank = vehicle === 'tank' ? new CrossingTank({ ...place, onShot: damage => this.health.damage(damage) })
      : new CrossingArmoredCar({ kind: vehicle, ...place, onShot: damage => this.health.damage(damage) })
    tank.x -= place.direction * tank.width / 2
    this.tank = tank
    this.tankSpawned = true
    this.add(tank)
  }

  /** The way the German vehicle of this street drives; the Red Army comes the other way. */
  get germanDirection() {
    return this.stageIndex % 2 === 0 ? 1 : -1
  }

  /** Where a vehicle driving the way of `direction` comes into the view, on a street that crosses all of it. */
  crossingFrom(direction) {
    const edge = direction > 0 ? this.cameraX : this.cameraX + this.width
    const farEdge = edge + direction * this.width
    const lane = this.stage.streets.find(({ from, to }) =>
      from * this.scale <= Math.min(edge, farEdge) && to * this.scale >= Math.max(edge, farEdge))
    if (!lane) return null
    return { x: edge, feet: lane.feet * this.scale, pixelsPerMeter: this.projectionAt(lane).length(1), direction, camera: this }
  }

  /** The T-34 comes once a street, when no German vehicle is on it, and goes once it has passed. */
  updateRelief(dt) {
    if (this.relief) {
      if (!this.relief.passed) return
      this.remove(this.relief)
      this.relief = null
      return
    }
    if (this.reliefSent) return
    this.reliefTimer += dt
    if (this.reliefTimer < relief.arrival || this.tank) return
    const place = this.crossingFrom(-this.germanDirection)
    if (!place) return
    const tank = new ReliefTank({ ...place, onShot: () => this.reliefShot() })
    tank.x -= place.direction * tank.width / 2
    this.relief = tank
    this.reliefSent = true
    this.add(tank)
  }

  /** The T-34's shell fells a living German in sight, the nearest one to it; it has none to hit otherwise. */
  reliefShot() {
    const { from, to } = this.shown
    const inSight = this.occupiers.filter(({ body, view: shown }) => {
      const x = (shown.view ?? shown).x / this.scale
      return body.alive && x > from && x < to
    })
    if (!inSight.length) return false
    const distance = ({ view: shown }) => Math.abs((shown.view ?? shown).x - this.relief.x)
    const target = inSight.reduce((nearest, occupier) => distance(occupier) < distance(nearest) ? occupier : nearest)
    const view = target.view.view ?? target.view
    this.blast.start(view.x, this.middleOf(target.view))
    this.fell(target.body, { scored: false })
    return true
  }

  handleAuxClick = e => {
    if (e.button !== 2 || !canShoot(this) || !gameplayInputAllowed(e.target)) return
    e.preventDefault()
    this.audio.setPlaying(true)
    this.throwGrenade(e.pageX + this.cameraX, e.pageY + this.cameraY)
  }

  /** The player throws a grenade from the bottom of the screen at `x`, `y`; it bursts once it lands. */
  throwGrenade(x, y) {
    if (this.grenades === 0) return
    this.grenades--
    this.grenadeArmed = false
    const grenade = new ThrownGrenade({ from: { x: this.cameraX + this.width / 2, y: this.cameraY + this.height },
      to: { x, y }, onLand: point => {
        this.remove(grenade)
        this.thrown.delete(grenade)
        this.burstGrenade(point)
      } })
    this.thrown.add(grenade)
    this.add(grenade)
  }

  /** A grenade bursts at `x`, `y`: it fells every German near it, behind cover too, and damages the tank it hits. */
  burstGrenade({ x, y }) {
    this.blast.start(x, y)
    this.grenadeSound.play()
    if (this.tank?.blast(x, y) && this.tank.destroyed) this.poeni += 3
    for (const { body, view: shown } of this.occupiers) {
      const view = shown.view ?? shown
      const metre = view.height / body.size.height
      if (body.alive && Math.hypot(x - view.x, y - this.middleOf(shown)) <= grenadeReach * metre) this.fell(body)
    }
  }

  /** Where the middle of what can be hit of a German is now, rising as he rises from hiding. */
  middleOf(shown) {
    const view = shown.view ?? shown
    const sunk = (shown.sunk ?? 0) * view.height
    const height = view.targetHeight ?? view.height
    return (view.inTrench === false ? view.y - view.height / 2 : view.y + (view.height - height) / 2) + sunk
  }

  fell(body, options) {
    body.setState('dead')
    this.count(options)
  }

  /** A German down counts towards the street's end, and towards the score if the player `scored` him. */
  count({ scored = true } = {}) {
    if (scored) this.poeni++
    this.fallen++
  }

  /** A shot hits a living German where he is seen: one in hiding only above his cover or inside his window. */
  handleClick(e) {
    if (!canShoot(this)) return
    if (e.target.closest('[data-grenade]')) {
      this.audio.setPlaying(true)
      if (this.grenades) this.grenadeArmed = !this.grenadeArmed
      return
    }
    if (e.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    this.audio.setPlaying(true)
    const x = e.pageX + (this.cameraX ?? 0), y = e.pageY + (this.cameraY ?? 0)
    if (this.grenadeArmed) return this.throwGrenade(x, y)
    if (this.ammunition === 0) return
    this.ammunition--
    if (this.ammunition === 0) this.reloadTime = supplies.reloadTime
    this.player.shotSound.play()
    if (this.tank?.shootCommander?.(x, y)) return this.count()
    if (this.tank?.contains(x, y)) return
    if (this.crates.some(crate => crate.openAt(x, y))) {
      this.ammunition = Math.min(supplies.magazine, this.ammunition + supplies.roundsPerCrate)
      this.grenades = Math.min(supplies.grenades, this.grenades + 1)
      this.reloadTime = 0
      return
    }
    for (const { body, view: shown } of this.occupiers) {
      const view = shown.view ?? shown
      const height = view.targetHeight ?? view.height
      if (body.alive && (shown.seen?.(x, y) ?? true) && Math.abs(x - view.x) < view.width / 2
        && Math.abs(y - this.middleOf(shown)) < height / 2) this.fell(body)
    }
  }

  /** Each occupier firing wears the defender down. */
  takeFire(dt) {
    for (const { body } of this.occupiers) if (body.state === 'attack') this.health.damage(dt * 5)
  }

  end() {
    document.removeEventListener('auxclick', this.handleAuxClick)
    super.end()
    hideCrosshair()
    this.audio.stop()
  }

  /** The street slides on to its end; once enough Germans have fallen the next street begins, after the last the win. */
  update(dt, t) {
    if (this.ui.outro) return
    this.cameraX = Math.min(this.background.length, this.cameraX + pace.slide * this.height * dt)
    this.player.position.x = this.cameraX + this.width * .5
    super.update(dt, t)
    if (this.reloadTime > 0) {
      this.reloadTime = Math.max(0, this.reloadTime - dt)
      if (this.reloadTime === 0) this.ammunition = supplies.magazine
    }
    this.updateTank(dt)
    this.updateRelief(dt)
    this.takeFire(dt)
    this.attack(dt)
    this.lieInWait(dt)

    this.spawnElapsed += dt
    if (this.spawnElapsed * 1000 > Math.max(this.intervalIzlaska, 500)) {
      this.dodajNeprijatelja()
      this.spawnElapsed = 0
    }
    this.intervalIzlaska -= dt * 100

    if (this.energija === 0) return this.defeat()
    if (this.fallen < this.stage.quota) return
    if (this.stageIndex + 1 < streets.length) this.startStage(this.stageIndex + 1)
    else this.victory()
  }

  sceneUI() {
    return /* html */`
      <div class="top-left">
        Score: ${this.poeni} <br>
      </div>
      <div class="top-right">
        ${healthBar(this.health.current / this.health.maximum)}
        <div>${this.reloadTime > 0 ? 'Reloading…' : `Ammo: ${this.ammunition}`}</div>
        <button class="hud-button" data-grenade aria-label="Grenades" aria-pressed="${this.grenadeArmed}" ${this.grenades ? '' : 'disabled'}>${icons.bomb} ${this.grenades}</button>
      </div>
    `
  }
}
