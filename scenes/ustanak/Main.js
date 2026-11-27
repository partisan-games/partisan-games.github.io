import canvas2d from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { sideProjection } from '/core/actor/projection.js'
import Mortar, { mortar } from '/core/gameplay/bodies/artillery/Mortar.js'
import CannonCrew from '/core/gameplay/bodies/soldiers/CannonCrew.js'
import Skirmisher from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import FlagBearer, { bearerKinds } from '/core/gameplay/bodies/soldiers/FlagBearer.js'
import MortarSprite from '/core/actor/artillery/MortarSprite.js'
import { wreckFor } from '/core/actor/wreckView.js'
import imageReady from '/core/io/imageReady.js'
import MortarCrewSprite from '/core/actor/soldiers/MortarCrewSprite.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'
import FlagBearerSprite from '/core/actor/soldiers/FlagBearerSprite.js'
import { healthBar } from '/ui/components.js'
import { mainMenuButton } from '/ui/UI.js'
import { keyboard } from '/core/io/Keyboard.js'
import { keys, leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'
import Controls from '/ui/Controls.js'
import Turns from './Turns.js'
import CannonAI from '/core/gameplay/controllers/CannonAI.js'
import CannonKeys from '/core/gameplay/controllers/CannonKeys.js'
import Bunker from '/core/objects/Bunker.js'
import Battlefield, { landscapeFilter } from './Battlefield.js'
import Airplane, { italianAirplanePictures } from '/core/objects/Airplane.js'
import Wind from './Wind.js'
import WindEffects from './WindEffects.js'
import Terrain, { crater } from './Terrain.js'
import customStartScreen from './startScreen.js'
import airTarget from './airTarget.js'
import { randomInRange } from '/core/utils.js'
import GameObject2D from '/core/actor/GameObject2D.js'

const groundLevel = canvas2d.height * .75
const italianRiflemanSource = 'armies/talijani/vojnici/vojnik-05.png'
/** The line the wheels and the feet stand on, in pixels: a little under the far edge of the field. */
const floorY = groundLevel + 34.875
/**
 * The chance each second that a plane waiting past the left edge flies over: rarely, yet they still come, each about
 * once in two and a half minutes, so one of the two a little more than once a minute (owner, 2026-11-27). The second waits there from the start; the first
 * comes in once in the first half minute, `firstPass` seconds into the game.
 */
const airplaneChance = 1 / 150
const waiting = -10000
const firstPass = [10, 25]
/** Metres above the ground from which a burst is in the air. */
const airBurst = 3
/** How many pixels a metre of the battle is drawn: the bodies are in metres, the field and its craters in pixels. */
const pxPerMeter = 40
/**
 * Where each side stands, in metres from its own edge of the field: its mortar, the loader behind it, the partisan one
 * a little farther back (owner, 2026-11-27), its flag bearer, and the skirmishers in front of the mortar.
 */
const places = { gun: 3.75, crew: [3.15, 3.45], bearer: { partisan: 1, italian: 2 }, skirmisher: 5.5 }
/**
 * The two sides duel with mortars only (owner, 2026-11-27), over a hill `height` metres high and a `width` share of
 * the screen wide in the middle of the field.
 */
const hill = { height: 2.5, width: .3 }
const howToPlay = 'Destroy the enemy mortar. Hold Space to charge, release to fire.'

/** The history before the match; the messages in play keep to the turns and how to play. */
const report = 'Montenegro, 13 July 1941\n\nThe people of Montenegro rise against the Italian occupiers. You are ordered to destroy the Italian garrison at Grahovo.'

/** The second player's keys in real time, beside the first one's. */
const secondPlayerControls = {
  [rightPlayerKeys.up.label]: 'up', [rightPlayerKeys.down.label]: 'down', [rightPlayerKeys.shoot.label]: 'shoot',
}

export default class UstanakScene extends Scene2D {
  constructor() {
    super({ controlKeys: { W: 'up', S: 'down', Space: 'shoot' }, customStartScreen, reportText: report, showControls: true })
  }

  init() {
    this.score = [0, 0]
    this.round = 1
    this.roundWinner = null
    this.turns = new Turns()
    this.vsComputer = true
    /** In real time both pieces aim and fire at once, each again once its last shot is over (owner, 2026-11-27). */
    this.realTime = false
    this.audioPlayer = () => this.gunViews[this.vsComputer || this.realTime ? 0 : this.turns.active]
    this.announcingTurn = false
    this.instructionsShown = false
    this.wind = new Wind()
    this.windEffects = new WindEffects(this.wind)
    // Craters stop 8 px above the bottom of the screen, so the layer never opens to nothing.
    this.terrain = new Terrain({ floorY, width: canvas2d.width, bottom: canvas2d.height - 8, hill: {
      middle: canvas2d.width / 2, width: canvas2d.width * hill.width, height: hill.height * pxPerMeter } })
    this.projection = sideProjection({ pxPerMeter, groundY: floorY })
    this.battlefield = new Battlefield({ canvas: this.canvas, groundY: groundLevel, wind: this.wind, terrain: this.terrain })
    this.audioChildren = [this.wind, this.battlefield]
    this.bunker = new Bunker({ x: canvas2d.width * .75, smoky: true, z: 1, imageFilter: landscapeFilter })
    this.bunker.onload = () => this.bunker.placeOnGround(groundLevel + 20)
    const avion = new Airplane({ src: italianAirplanePictures.fiat, y: canvas2d.height * .4, scale: .85, speed: -240,
      x: canvas2d.width + 240 * randomInRange(...firstPass), probability: airplaneChance })
    const avion2 = new Airplane({ src: italianAirplanePictures.imam, y: canvas2d.height * .2, scale: 0.66, speed: -320,
      x: waiting, probability: airplaneChance })
    this.add(avion, avion2)
    this.airplanes = [avion, avion2]
    this.setUpRound()
    this.setRoundScenery()
  }

  /** The height of the field in metres under `x` metres: a crater lowers it. */
  groundAt(x) {
    return (floorY - this.terrain.heightAt(x * pxPerMeter)) / pxPerMeter
  }

  /** `metres` from the left edge of the field for the partisans (side 0), from the right for the Italians. */
  placeOf(side, metres) {
    return side === 0 ? metres : canvas2d.width / pxPerMeter - metres
  }

  /**
   * Both sides of a round: each mortar with its crew and flag bearer, and the partisan skirmisher. The mortars fire at
   * each other, in turns or at once, with the round's wind; their shots dig craters.
   */
  setUpRound() {
    const groundAt = x => this.groundAt(x)
    const views = { projection: this.projection, camera: this }
    const flagTime = () => this.battlefield.time
    this.guns = [0, 1].map(side => new Mortar({ x: this.placeOf(side, places.gun), yaw: side * Math.PI, groundAt,
      wind: this.wind, bounds: { min: 0, max: canvas2d.width / pxPerMeter }, onBlast: (x, y) => this.blast(x, y),
      canFire: () => this.canShoot(side) }))
    // a bomb bursts on an airplane it meets in flight (owner, 2026-11-27)
    const aircraft = this.airplanes.map(plane => airTarget(plane, this.projection))
    this.guns[0].targets.push(this.guns[1], ...aircraft)
    this.guns[1].targets.push(this.guns[0], ...aircraft)
    this.crews = [0, 1].map(side => new CannonCrew({ x: this.placeOf(side, places.crew[side]), yaw: side * Math.PI, groundAt }))
    const bearers = ['partisan', 'italian'].map((kind, side) => new FlagBearer({ kind: bearerKinds[kind],
      x: this.placeOf(side, places.bearer[kind]), yaw: side * Math.PI, groundAt }))
    this.skirmisher = new Skirmisher({ x: places.skirmisher, groundAt })
    this.skirmisher.setState('attack')
    this.gunViews = this.guns.map(gun => new MortarSprite(gun, views))
    const guns = [this.guns[1], this.gunViews[1], this.guns[0], this.gunViews[0]]
    const crews = this.crews.flatMap((crew, side) => [crew, new MortarCrewSprite(crew, { italian: side === 1, ...views })])
    const skirmisher = [this.skirmisher, new SkirmisherSprite(this.skirmisher, views)]
    // an Italian rifleman across from the skirmisher, so both sides are as many: his old source picture, kneeling and
    // aiming as the skirmisher does, at its own size and turned to face left, stands in until he is drawn (owner,
    // 2026-11-27; IG-37)
    const italian = new GameObject2D(italianRiflemanSource, { x: this.placeOf(1, places.skirmisher) * pxPerMeter,
      flipY: -1 })
    italian.onload = () => italian.placeOnGround(floorY)
    const opposite = [italian]
    this.roundObjects = [
      // the loader stands behind the mortar
      ...crews, ...guns, ...skirmisher, ...opposite,
      ...bearers.flatMap((bearer, side) => [bearer, new FlagBearerSprite(bearer, { italian: side === 1, flagTime, ...views })]),
    ]
    this.add(...this.roundObjects)
    this.shotsSeen = [0, 0]
    this.bindKeys()
    this.ai = new CannonAI({ cannon: this.guns[1], target: this.guns[0], clock: this.session.clock })
  }

  /** In turns both players aim with the same keys; in real time the second one has the arrows and Enter. */
  keysOf(side) {
    return this.realTime && side === 1 ? rightPlayerKeys : leftPlayerKeys
  }

  bindKeys() {
    this.cannonKeys = this.guns.map((gun, side) => new CannonKeys(gun, { keyboard, keys: this.keysOf(side) }))
  }

  /** The house is scenery, never a shell target; only a nearby explosion ruins it. A burst in the air digs nothing. */
  blast(x, y) {
    if (y > this.groundAt(x) + airBurst) return
    const screenX = x * pxPerMeter
    this.terrain.blast(screenX)
    if (this.round === 1 && this.bunker.alive
      && Math.abs(screenX - this.bunker.x) <= this.bunker.width / 2 + crater.halfWidth)
      this.bunker.die()
  }

  setRoundScenery() {
    this.battlefield.nextRound()
    this.remove(this.bunker)
    if (this.round === 1) this.add(this.bunker)
    else this.bunker.flame?.clear()
  }

  handleClick(e) {
    const button = e.target.closest('button')
    if (button?.id === 'next-round') return this.nextRound()
    if (button && ['jedan-igrac', 'dva-igraca'].includes(button.id)) this.play(button.id)
  }

  /** The players and the tempo chosen on the start screen. */
  prepare(mode) {
    this.vsComputer = mode !== 'dva-igraca'
    this.realTime = document.querySelector('#start-screen input[name="tempo"]:checked')?.value === 'real-time'
    this.bindKeys()
    if (this.realTime && !this.vsComputer) this.controls2UI = new Controls({ positionClass: 'bottom-right',
      controlKeys: secondPlayerControls, canToggle: () => this.ui.canToggleControls() })
  }

  canShoot(side) {
    return this.session.state === 'running' && !this.ui.outro
      && this.roundWinner === null
      && (this.realTime || (this.turns.phase === 'aim' && this.turns.active === side))
  }

  start() {
    super.start()
    this.turns.waitForRelease = keyboard.isDown(leftPlayerKeys.shoot)
    // the report has told where the match begins, so the opening message is only the turn and how to play
    this.announceTurn()
  }

  announceTurn(result = '', newRound = false) {
    if (this.ui.outro || this.roundWinner !== null || this.session.state !== 'running') return
    this.turnNotice?.dispose()
    this.turnNotice = this.session.gameplay.child()
    this.announcingTurn = true
    // real time has no turns to name, only the place of a new round and how to play
    const text = this.realTime ? '' : this.vsComputer
      ? (this.turns.active === 0 ? 'Your turn' : 'Computer\'s turn')
      : `Player ${this.turns.active + 1}'s turn`
    const screen = document.createElement('div')
    screen.className = 'central-screen'
    if (text) {
      const title = document.createElement('h3')
      title.textContent = text
      screen.append(title)
    }
    if (newRound) {
      const location = document.createElement('p')
      location.textContent = this.battlefield.place.place.label
      screen.prepend(location)
    }
    if (result) {
      const status = document.createElement('p')
      status.textContent = result
      screen.prepend(status)
    }
    const showInstructions = !this.instructionsShown && (!this.vsComputer || this.realTime || this.turns.active === 0)
    if (showInstructions) {
      const instructions = document.createElement('p')
      instructions.textContent = howToPlay
      if (this.realTime && !this.vsComputer) instructions.textContent += ' Player 2: ↑ ↓ to aim, hold Enter to charge.'
      screen.append(instructions)
      this.instructionsShown = true
    }
    this.ui.message = text
    this.ui.turnSound.play()
    this.ui.messageElement.replaceChildren(screen)
    this.ai.beginTurn()
    if (this.vsComputer && !this.realTime && this.turns.active === 1) this.crews[1].setState('load')
    this.turnNotice.after(showInstructions ? 5 : newRound ? 3 : result ? 2 : 1.2, () => {
      this.ui.message = ''
      this.ui.messageElement.replaceChildren()
      this.announcingTurn = false
    })
  }

  handleInput(dt) {
    if (this.ui.outro || this.session.state !== 'running') return
    if (keyboard.isDown(keys.pause)) {
      this.pause()
      return
    }
    if (this.roundWinner !== null) return
    if (this.realTime) {
      for (const side of this.vsComputer ? [0] : [0, 1]) this.aim(side, dt)
      return
    }
    if (this.turns.waitForRelease && !keyboard.isDown(leftPlayerKeys.shoot))
      this.turns.waitForRelease = false
    if (this.turns.phase !== 'aim' || (this.vsComputer && this.turns.active === 1)) return
    if (this.turns.waitForRelease) return
    this.aim(this.turns.active, dt)
  }

  /** A player aims and fires the piece of `side`; its crew loads while fire is held and stands by when it is let go. */
  aim(side, dt) {
    const crew = this.crews[side]
    if (crew.state !== 'attack') crew.setState(keyboard.isDown(this.keysOf(side).shoot) ? 'load' : 'idle')
    this.cannonKeys[side].handleInput(dt)
  }

  /** A shot of a gun ends its side's aim: the turn waits for the shot, and the crew fires it. */
  watchShots() {
    this.guns.forEach((gun, side) => {
      if (gun.shotsFired === this.shotsSeen[side]) return
      this.shotsSeen[side] = gun.shotsFired
      if (!this.realTime) this.turns.fire(side)
      this.shotTargetHealth = this.guns[1 - side].health.current
      this.crews[side].setState('attack')
    })
  }

  clear() {
    this.battlefield?.render()
  }

  imagesLoaded() {
    return Promise.all([super.imagesLoaded(), this.battlefield.loaded(), imageReady(wreckFor(this.bunker.image.src))])
  }

  update(dt, t) {
    this.wind.update(dt)
    this.battlefield.update(dt)
    super.update(dt, t)
    this.watchShots()
    this.windEffects.update(this.children, dt)
    if (this.ui.outro || this.roundWinner !== null || this.session.state !== 'running') return
    const [own, enemy] = this.guns
    if (own.dead) return this.finishRound(1)
    if (enemy.dead) return this.finishRound(0)
    const shooter = this.turns.active
    if (this.realTime) {
      // the computer looks where its shot fell before it aims the next
      if (this.vsComputer && this.ai.lastShot && !enemy.hasActiveShot) this.ai.beginTurn()
    } else if (this.turns.settle(own.hasActiveShot || enemy.hasActiveShot)) {
      const target = this.guns[1 - shooter]
      const hit = target.health.current < this.shotTargetHealth
      const subject = this.vsComputer ? (shooter === 0 ? 'You' : 'Enemy') : `Player ${shooter + 1}`
      const targetName = this.vsComputer ? (shooter === 0 ? 'the enemy mortar' : 'your mortar') : `Player ${2 - shooter}'s mortar`
      this.announceTurn(hit ? `${subject} hit ${targetName}!` : `${subject} missed!`)
    }
    if (this.vsComputer && this.canShoot(1)) this.ai.update()
  }

  sideName(side) {
    return this.vsComputer ? (side === 0 ? 'You' : 'Computer') : `Player ${side + 1}`
  }

  finishRound(winner) {
    if (this.roundWinner !== null || this.ui.outro) return
    if (this.guns[1 - winner].dead) this.crews[1 - winner].setState('dead')
    this.roundWinner = winner
    this.score[winner]++
    this.turnNotice?.dispose()
    this.announcingTurn = false
    this.ui.message = ''
    this.ui.messageElement.replaceChildren()
    keyboard.reset()
    for (const gun of this.guns)
      gun.shells.projectiles.forEach(shell => shell.setState('idle'))
    if (this.score[winner] === 2) {
      const text = `${this.sideName(winner)} ${this.vsComputer && winner === 0 ? 'win' : 'wins'} the match! ${this.score.join(' : ')}`
      if (this.vsComputer && winner === 1) this.defeat(text)
      else this.victory(text)
      return
    }
    if (this.vsComputer && winner === 1) this.ui.defeatSound.play()
    else this.ui.victorySound.play()
    this.showRoundResult()
  }

  showRoundResult() {
    this.ui.showScreen('round', /* html */`
      <div class="central-screen flex-column simple-container">
        <h3>Round ${this.round}: ${this.sideName(this.roundWinner)} ${this.vsComputer && this.roundWinner === 0 ? 'win' : 'wins'}!</h3>
        <p>${this.score.join(' : ')}</p>
        ${mainMenuButton('bg-olive')}
        <button class="bg-olive" id="next-round">Next round</button>
      </div>
    `)
  }

  nextRound() {
    if (this.roundWinner === null || this.ui.outro || this.session.state !== 'running') return
    this.ui.sounds.forEach(sound => sound.stop())
    this.remove(...this.roundObjects)
    this.turnNotice?.dispose()
    keyboard.reset()
    this.round++
    this.wind.nextRound()
    this.terrain.reset()
    this.setUpRound()
    this.setRoundScenery()
    this.roundWinner = null
    this.turns = new Turns()
    this.turns.active = (this.round - 1) % 2
    this.ui.hideScreen()
    this.focusCanvas()
    this.announceTurn('', true)
  }

  unpause() {
    super.unpause()
    if (this.roundWinner !== null && !this.ui.outro) this.showRoundResult()
  }

  end() {
    super.end()
    this.controls2UI?.end()
    this.battlefield?.ground.dispose()
  }

  sceneUI() {
    return /* html */`
    <div aria-label="Round score" style="position: absolute; top: var(--spacing); left: 50%; transform: translateX(-50%)">${this.score.join(' : ')}</div>
    <div class='top-left'>
      ${healthBar(this.guns[0].health.current / this.guns[0].health.maximum)}
      <progress class="potisak" value="${this.guns[0].force}" max="${mortar.maxForce}"></progress>
    </div>

    <div class='top-right'>
      ${healthBar(this.guns[1].health.current / this.guns[1].health.maximum)}
      ${this.vsComputer ? '' : `<progress class="potisak" value="${this.guns[1].force}" max="${mortar.maxForce}"></progress>`}
    </div>
    `
  }

}
