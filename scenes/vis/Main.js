import { icons } from '/core/io/icons.js'
import Scene2D from '/core/Scene2D.js'
import canvas2d from '/core/io/canvas2d.js'
import Input from '/core/io/Input.js'
import { baseControls } from '/ui/Controls.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { topProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import FighterBomber from '/core/gameplay/bodies/aircraft/FighterBomber.js'
import FighterBomberSprite from '/core/actor/aircraft/FighterBomberSprite.js'
import TopDownKeys from '/core/gameplay/controllers/TopDownKeys.js'
import RunwayLanding from '/core/gameplay/controllers/RunwayLanding.js'
import Explosion from '/core/actor/effects/Explosion.js'
import PokretnaPozadina from './PokretnaPozadina.js'
import Pokretno from './Pokretno.js'
import Cloud2D from './Oblak.js'
import Baza from './Baza.js'
import Waves from './Waves.js'
import PowerUps from './PowerUps.js'
import { levels } from './levels.js'
import { currentStyleClasses } from '/ui/styles.js'
import Sound from '/core/io/audio/SoundSource.js'
import { settings } from './settings.js'
import { fighterBomberPlane } from '/core/actor/aircraft/fighterBomberPlanes.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import { assets } from '/config.js'

const { scrollSpeed: speed, clouds, restTime, engineVolume } = settings
/** How many pixels a metre of the sky is drawn. */
const pxPerMeter = 14
const distanceScale = 10 / pxPerMeter
/** The plane fires on Space; on a phone, with its buttons. */
export const inputOptions = { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.loop, special: icons.bomb } }
/**
 * The game's rules for the player: the seconds the plane is safe as it takes off into a new stage; the share of its
 * energy a power-up or a health pack gives back; a bomb's blast, as a share of the shorter side of the screen, and the hits it takes off each plane in it; how many bursts it
 * spreads over how many seconds, and their size against their 128 px frame.
 */
export const rules = {
  shieldTime: 2, repair: .5, bombRadius: .5, bombHits: 10, bombBursts: 12, bombSpread: .4, burstScale: 1.8,
}

/** The aircraft the player may fly to Vis. */
const planes = ['spitfire', 'hurricane', 'breguet', 'yak'].map(fighterBomberPlane)

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <p>Reach the Island of Vis</p>
    <h2>Choose your aircraft</h2>
    <div class="game-screen-select vis-aircraft-select">
      ${planes.map(plane => /* html */`
        <label data-paid>
          <input type="image" data-aircraft="${plane.id}" src="${assets.images}${plane.image}" alt="Fly ${plane.name}">
          <span>${plane.name}</span>
        </label>
      `).join('')}
    </div>
  </div>
`

export default class VisScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot', [keys.attack2.label]: 'loop', [keys.special.label]: 'bomb' },
      intro: 'Reach the Island of Vis',
      reportText: 'Adriatic Sea, autumn 1944\n\nThe partisan squadron moves to Vis. Your task is to deliver a new Allied fighter from Italy.',
      customStartScreen,
    })
  }

  init() {
    this.audioWorldOffset = { x: 0, y: 0 }
    this.backgroundColor = '#165a8d'
    this.projection = topProjection({ pxPerMeter })
    /** What the screen shows, where rounds leave play. */
    this.screenView = screenView(this.projection, this)
    this.oblaci = Array.from({ length: clouds }, () => new Cloud2D(speed))
    this.ostrvo = new Pokretno('nature/ostrvo.gif', { thrust: speed, scale: 2 })
    this.zdravlje = new Pokretno('items/zdravlje.png', { thrust: speed, scale: .66, faktorY: 10, shadow: true })
    this.score = 0
    /** The enemy planes in play, which the player's guns hit and the player can crash into. */
    this.targets = []
    this.player = this.createPlayer('spitfire')
    this.input = new Input(inputOptions)
    this.keys = new TopDownKeys(this.player, { input: this.input })
    this.controllers.push(this.keys)
    this.audioPlayer = () => this.playerView
    this.bursts = []
    this.powerUps = new PowerUps({ scene: this, player: this.player })
    /** The stage being flown; each has its waves in `levels`. */
    this.stage = 0
    this.waves = this.wavesOf(this.stage)
    this.landing = false
    this.siren = { sounds: [new Sound('air-raid-siren.mp3', { profile: 'ambience' })] }
    this.audioChildren.push(this.siren)
    const okean = new PokretnaPozadina(speed, this.width)
    this.add(okean, this.zdravlje, this.ostrvo, this.player, this.playerView, ...this.oblaci)
    this.engineSound = new Sound('avion-mali.mp3', { volume: engineVolume, loop: true, profile: 'engine', spatial: { getPosition: () => this.playerView.position } })
    this.playerView.sounds.push(this.engineSound)
    this.seen = { bombs: 0 }
  }

  /** The player plane of `aircraftId` at the bottom middle of the screen, kept within it. */
  createPlayer(aircraftId) {
    const { size, image } = fighterBomberPlane(aircraftId)
    const body = new FighterBomber({ size: { ...size }, distanceScale, clock: this.session.clock, targets: this.targets, solids: this.targets,
      canFire: () => this.session.state === 'running', view: this.screenView,
      bounds: { minX: 0, maxX: canvas2d.width / pxPerMeter, minZ: 0, maxZ: canvas2d.height / pxPerMeter } })
    this.placeAtStart(body)
    this.playerView = new FighterBomberSprite(body, { src: image, projection: this.projection })
    // it flies above the clouds, drawn after them
    this.playerView.position.z = -1
    this.playerView.hide()
    return body
  }

  /** The plane starts, and comes back after a lost life, at the bottom middle of the screen. */
  placeAtStart(body) {
    body.x = canvas2d.width / 2 / pxPerMeter
    body.z = (canvas2d.height - 127.5) / pxPerMeter
  }

  /** Whether an enemy plane is over the screen, from where it may fire. */
  onScreen(body) {
    const { x, y } = this.projection.point(body)
    return this.session.state === 'running' && x >= 0 && x <= canvas2d.width && y >= 0 && y <= canvas2d.height
  }

  /* the engine hums while the game runs */

  handleClick(e) {
    const id = e.target.dataset?.aircraft
    if (planes.some(plane => plane.id === id) && this.ui.screen === 'start') this.play(id)
  }

  /** The chosen aircraft: its picture, its size and how it flies and fights. */
  prepare(id) {
    const plane = fighterBomberPlane(id)
    Object.assign(this.player.size, plane.size)
    this.player.equip(modelPerformance[id])
    this.placeAtStart(this.player)
    return this.playerView.setAircraft(plane.image)
  }

  start() {
    this.playerView.show()
    super.start()
    this.engineSound.setPlaying(true)
  }

  /** Whether the player plane touches `item`, a picture on the screen. */
  touches(item) {
    const { x, y } = this.projection.point(this.player)
    const halfX = this.projection.length(this.player.size.width) / 2, halfY = this.projection.length(this.player.size.length) / 2
    return item.visible && Math.abs(item.x - x) < halfX + item.width / 2 && Math.abs(item.y - y) < halfY + item.height / 2
  }

  /** A power-up: more guns, a bomb or a life. */
  powerUp(kind) {
    if (kind === 'fire') this.player.fireLevel = Math.min(this.player.fireLevel + 1, 2)
    if (kind === 'bomb') this.player.bombs++
    if (kind === 'life') this.player.repair(rules.repair)
  }

  collectHealth() {
    if (!this.player.alive || !this.touches(this.zdravlje)) return
    this.zdravlje.reset()
    this.powerUp('life')
  }

  wavesOf(stage) {
    return new Waves({
      scene: this, player: this.player, schedule: levels[stage], projection: this.projection,
      canFire: body => this.onScreen(body), onFormationDown: position => this.powerUps.drop(position),
    })
  }

  /** A burst on the screen, above the planes. */
  explode(x, y) {
    let burst = this.bursts.find(free => !free.visible)
    if (!burst) {
      burst = new Explosion(null, { scale: rules.burstScale, z: -1 })
      this.bursts.push(burst)
      this.add(burst)
    }
    burst.start(x, y)
  }

  /**
   * A bomb is a heavy blow all around the player: the planes in its fire lose its hits and burst, the enemy rounds in it
   * are gone, and bursts spread over it a little apart in time.
   */
  burstBomb() {
    const centre = this.projection.point(this.player)
    const radius = rules.bombRadius * Math.min(canvas2d.width, canvas2d.height)
    const reach = radius + 128 * rules.burstScale / 2
    const inBlast = body => {
      const { x, y } = this.projection.point(body)
      return Math.hypot(x - centre.x, y - centre.y) < reach
    }
    for (const plane of this.targets.filter(body => body.alive && inBlast(body))) {
      plane.takeHit(rules.bombHits)
      const { x, y } = this.projection.point(plane)
      this.explode(x, y)
    }
    for (const round of this.targets.flatMap(plane => plane.bullets.projectiles))
      if (round.active && inBlast(round)) round.setState('idle')
    for (let i = 0; i < rules.bombBursts; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = radius * Math.sqrt(Math.random()) // evenly over the circle, not crowded in the middle
      const x = centre.x + Math.cos(angle) * distance
      const below = Math.sin(angle) * distance
      const y = centre.y + (centre.y + below > canvas2d.height ? -below : below) // a burst under the screen shows above
      this.session.presentation.after(Math.random() * rules.bombSpread, () => this.explode(x, y))
    }
  }

  /** Each enemy plane shot down while the game runs scores its points. */
  countKills() {
    for (const plane of this.waves.enemies) {
      if (plane.scored || plane.body.alive) continue
      plane.scored = true
      if (this.session.state === 'running') this.score += settings.enemies[plane.type].points
    }
  }

  /** A bomb the plane drops bursts. */
  watchPlayer() {
    const { player, seen } = this
    if (player.bombsDropped > seen.bombs) this.burstBomb()
    seen.bombs = player.bombsDropped
  }

  /** After each stage the base scrolls in, where the plane lands: on Vis after the last, at an airfield on the way after the others. */
  landToBase() {
    this.landing = true
    if (this.baza) this.remove(this.baza)
    this.baza = new Baza({ speed })
    this.remove(this.ostrvo, this.zdravlje)
    this.add(this.baza)
  }

  /**
   * The plane, out of the player's hands, lands on the runway of the base that has scrolled in: on Vis it wins; at an
   * airfield on the way it is serviced while it rests, then it takes off on its own into the next stage.
   */
  landOnRunway() {
    const last = this.stage === levels.length - 1
    const { start, stop } = this.baza.runway
    this.controllers.splice(this.controllers.indexOf(this.keys), 1)
    this.player.setState('move')
    this.runwayLanding = new RunwayLanding(this.player, {
      runway: { start: this.projection.toWorld(start), stop: this.projection.toWorld(stop) },
      rest: last ? Infinity : restTime, distanceScale,
      onLanded: () => last ? this.victory('You have successfully reached the island of Vis.') : this.service(),
      onRested: () => this.soundSirens(),
      onAirborne: () => this.nextStage(),
    })
    this.controllers.push(this.runwayLanding)
  }

  /** On an airfield the plane is repaired and its bombs are filled up to a full load; more than that it keeps. */
  service() {
    this.player.rearm()
    this.player.repair(1)
  }

  /** The sirens wail as the enemy attacks the airfield, and the plane takes off. */
  soundSirens() {
    this.siren.sounds[0].play()
    this.ui.showMessage('Sirens! The enemy is attacking the base!')
  }

  /** In the air again, the plane is the player's, safe for a while, and the next stage begins. */
  nextStage() {
    this.controllers.splice(this.controllers.indexOf(this.runwayLanding), 1, this.keys)
    this.runwayLanding = null
    this.player.shield = rules.shieldTime
    this.stage++
    this.waves = this.wavesOf(this.stage)
    this.landing = false
    this.baza.leave()
    this.add(this.ostrvo, this.zdravlje)
  }

  /** The world keeps moving behind the end screen, but the rules stop: no new waves, power-ups or landing. */
  update(dt, t) {
    if (this.session.state === 'running') this.audioWorldOffset.y -= speed * dt
    super.update(dt, t)
    this.engineSound.setPlaying(this.player.alive)
    this.countKills()
    if (this.session.state !== 'running') return

    this.watchPlayer()
    this.waves.update(dt)
    this.powerUps.update()
    this.collectHealth()

    if (this.player.dead) this.defeat()

    if (this.baza?.gone) {
      this.remove(this.baza)
      this.baza = null
    }
    if (this.waves.finished && !this.landing)
      this.landToBase()
    if (this.landing && !this.runwayLanding && this.baza.arrived && this.player.alive) this.landOnRunway()
  }

  sceneUI() {
    const { health } = this.player
    const bombs = icons.bomb.repeat(this.player.bombs)
    const loops = icons.loop.repeat(this.player.loopsLeft)
    return /* html */`
      <div class="top-left">
        <div>
          Score: ${this.score}
          <br>${this.healthBar(health.current / health.maximum)}
          <br>${bombs}
          <br>${loops}
        </div>
      </div>
      ${this.bossBar()}
      `
  }

  bossBar() {
    const boss = this.waves.boss?.body
    if (!boss?.alive) return ''
    return this.healthBar(boss.health.current / boss.kind.hits, 'top-right')
  }

  /** A bar of the `left` share of a health: top right for the boss, under the score for the plane. */
  healthBar(left, place = '') {
    return `<progress class="progress ${place} ${currentStyleClasses().healthBar}" value="${left * 100}" max="100"></progress>`
  }

  end() {
    this.input?.end()
    super.end()
  }
}
