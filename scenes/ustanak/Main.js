import canvas2d from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { sideProjection } from '/core/actor/projection.js'
import FieldGun, { fieldGun } from '/core/gameplay/bodies/artillery/FieldGun.js'
import CannonCrew from '/core/gameplay/bodies/soldiers/CannonCrew.js'
import Skirmisher from '/core/gameplay/bodies/soldiers/Skirmisher.js'
import FlagBearer, { bearerKinds } from '/core/gameplay/bodies/soldiers/FlagBearer.js'
import FieldGunSprite from '/core/actor/artillery/FieldGunSprite.js'
import { wreckFor } from '/core/actor/wreckView.js'
import imageReady from '/core/io/imageReady.js'
import CannonCrewSprite from '/core/actor/soldiers/CannonCrewSprite.js'
import SkirmisherSprite from '/core/actor/soldiers/SkirmisherSprite.js'
import FlagBearerSprite from '/core/actor/soldiers/FlagBearerSprite.js'
import { progresBar } from '/ui/components.js'
import { mainMenuButton } from '/ui/UI.js'
import { keyboard } from '/core/io/Keyboard.js'
import { keys, leftPlayerKeys } from '/core/io/keys.js'
import Turns from './Turns.js'
import CannonAI from '/core/gameplay/controllers/CannonAI.js'
import CannonKeys from '/core/gameplay/controllers/CannonKeys.js'
import Bunker from '/core/objects/Bunker.js'
import Battlefield, { landscapeFilter } from './Battlefield.js'
import Airplane from '/core/objects/Airplane.js'
import Wind from './Wind.js'
import WindEffects from './WindEffects.js'
import Terrain, { crater } from './Terrain.js'

const groundLevel = canvas2d.height * .75
/** The line the wheels and the feet stand on, in pixels: a little under the far edge of the field. */
const floorY = groundLevel + 34.875
/** How many pixels a metre of the battle is drawn: the bodies are in metres, the field and its craters in pixels. */
const pxPerMeter = 40
/**
 * Where each side stands, in metres from its own edge of the field: its gun, its crew, its flag bearer, and the
 * partisan skirmisher in front of the gun.
 */
const places = { gun: 5.75, crew: 2.75, bearer: { partisan: 1, italian: 2 }, skirmisher: 7.5 }

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}">
    <h2>Choose mode</h2>
    <button class="bg-olive" id="jedan-igrac" data-paid>
      Player vs computer
    </button>
    <button class="bg-olive" id="dva-igraca" data-paid>
      2 players
    </button>
  </div>
`

export default class UstanakScene extends Scene2D {
  constructor() {
    super({ controlKeys: { W: 'up', S: 'down', Space: 'shoot' }, customStartScreen, showControls: true })
  }

  init() {
    this.score = [0, 0]
    this.round = 1
    this.roundWinner = null
    this.turns = new Turns()
    this.vsComputer = true
    this.audioPlayer = () => this.gunViews[this.vsComputer ? 0 : this.turns.active]
    this.announcingTurn = false
    this.instructionsShown = false
    this.wind = new Wind()
    this.windEffects = new WindEffects(this.wind)
    // Craters stop 8 px above the bottom of the screen, so the layer never opens to nothing.
    this.terrain = new Terrain({ floorY, width: canvas2d.width, bottom: canvas2d.height - 8 })
    this.projection = sideProjection({ pxPerMeter, groundY: floorY })
    this.battlefield = new Battlefield({ canvas: this.canvas, groundY: groundLevel, wind: this.wind, terrain: this.terrain })
    this.audioChildren = [this.wind, this.battlefield]
    this.bunker = new Bunker({ x: canvas2d.width * .75, smoky: true, z: 1, imageFilter: landscapeFilter })
    this.bunker.onload = () => this.bunker.placeOnGround(groundLevel + 20)
    const avion = new Airplane({ src: 'armies/talijani/avioni/fiat-cr42.png', y: canvas2d.height * .4, scale: .85, speed: -240 })
    const avion2 = new Airplane({ src: 'armies/talijani/avioni/imam-ro57.png', y: canvas2d.height * .2, scale: 0.66, speed: -320 })
    this.add(avion, avion2)
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
   * Both sides of a round: each gun with its crew and flag bearer, and the partisan skirmisher. The guns fire only in
   * their turn, at each other, with the round's wind; their shots dig craters.
   */
  setUpRound() {
    const groundAt = x => this.groundAt(x)
    const views = { projection: this.projection, camera: this }
    const flagTime = () => this.battlefield.time
    this.guns = [0, 1].map(side => new FieldGun({ x: this.placeOf(side, places.gun), yaw: side * Math.PI, groundAt,
      wind: this.wind, bounds: { min: 0, max: canvas2d.width / pxPerMeter }, onBlast: x => this.blast(x),
      canFire: () => this.canShoot(side) }))
    this.guns[0].targets.push(this.guns[1])
    this.guns[1].targets.push(this.guns[0])
    this.crews = [0, 1].map(side => new CannonCrew({ x: this.placeOf(side, places.crew), yaw: side * Math.PI, groundAt }))
    const bearers = ['partisan', 'italian'].map((kind, side) => new FlagBearer({ kind: bearerKinds[kind],
      x: this.placeOf(side, places.bearer[kind]), yaw: side * Math.PI, groundAt }))
    this.skirmisher = new Skirmisher({ x: places.skirmisher, groundAt })
    this.skirmisher.setState('attack')
    this.gunViews = this.guns.map(gun => new FieldGunSprite(gun, views))
    this.roundObjects = [
      this.guns[1], this.gunViews[1], this.guns[0], this.gunViews[0], this.skirmisher, new SkirmisherSprite(this.skirmisher, views),
      ...this.crews.flatMap((crew, side) => [crew, new CannonCrewSprite(crew, { italian: side === 1, ...views })]),
      ...bearers.flatMap((bearer, side) => [bearer, new FlagBearerSprite(bearer, { italian: side === 1, flagTime, ...views })]),
    ]
    this.add(...this.roundObjects)
    this.shotsSeen = [0, 0]
    /** Both players aim with the same keys, each in their turn. */
    this.cannonKeys = this.guns.map(gun => new CannonKeys(gun, { keyboard, keys: leftPlayerKeys }))
    this.ai = new CannonAI({ cannon: this.guns[1], target: this.guns[0], clock: this.session.clock })
  }

  /** The house is scenery, never a shell target; only a nearby explosion ruins it. */
  blast(x) {
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

  prepare(mode) {
    this.vsComputer = mode !== 'dva-igraca'
  }

  canShoot(side) {
    return this.session.state === 'running' && !this.ui.outro
      && this.roundWinner === null
      && this.turns.phase === 'aim' && this.turns.active === side
  }

  start() {
    super.start()
    this.turns.waitForRelease = keyboard.isDown(leftPlayerKeys.shoot)
    this.announceTurn('', true)
  }

  announceTurn(result = '', newRound = false) {
    if (this.ui.outro || this.roundWinner !== null || this.session.state !== 'running') return
    this.turnNotice?.dispose()
    this.turnNotice = this.session.gameplay.child()
    this.announcingTurn = true
    const text = this.vsComputer
      ? (this.turns.active === 0 ? 'Your turn' : 'Computer\'s turn')
      : `Player ${this.turns.active + 1}'s turn`
    const screen = document.createElement('div')
    screen.className = 'central-screen'
    const title = document.createElement('h3')
    title.textContent = text
    screen.append(title)
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
    const showInstructions = !this.instructionsShown && (!this.vsComputer || this.turns.active === 0)
    if (showInstructions) {
      const instructions = document.createElement('p')
      instructions.textContent = 'Aim at the enemy cannon. Hold Space to build power, then release to fire.'
      screen.append(instructions)
      this.instructionsShown = true
    }
    this.ui.message = text
    this.ui.turnSound.play()
    this.ui.messageElement.replaceChildren(screen)
    this.ai.beginTurn()
    if (this.vsComputer && this.turns.active === 1) this.crews[1].setState('load')
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
    if (this.turns.waitForRelease && !keyboard.isDown(leftPlayerKeys.shoot))
      this.turns.waitForRelease = false
    if (this.turns.phase !== 'aim' || (this.vsComputer && this.turns.active === 1)) return
    if (this.turns.waitForRelease) return
    const crew = this.crews[this.turns.active]
    // the crew loads while the fire key is held, and stands by again when it is let go before the shot
    if (crew.state !== 'attack') crew.setState(keyboard.isDown(leftPlayerKeys.shoot) ? 'load' : 'idle')
    this.cannonKeys[this.turns.active].handleInput(dt)
  }

  /** A shot of a gun ends its side's aim: the turn waits for the shot, and the crew fires it. */
  watchShots() {
    this.guns.forEach((gun, side) => {
      if (gun.shotsFired === this.shotsSeen[side]) return
      this.shotsSeen[side] = gun.shotsFired
      this.turns.fire(side)
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
    if (this.turns.settle(own.hasActiveShot || enemy.hasActiveShot)) {
      const target = this.guns[1 - shooter]
      const hit = target.health.current < this.shotTargetHealth
      const subject = this.vsComputer ? (shooter === 0 ? 'You' : 'Enemy') : `Player ${shooter + 1}`
      const targetName = this.vsComputer ? (shooter === 0 ? 'the enemy cannon' : 'your cannon') : `Player ${2 - shooter}'s cannon`
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
    this.battlefield?.ground.dispose()
  }

  sceneUI() {
    return /* html */`
    <div aria-label="Round score" style="position: absolute; top: var(--spacing); left: 50%; transform: translateX(-50%)">${this.score.join(' : ')}</div>
    <div class='top-left'>
      ${progresBar(this.guns[0].health.current)}
      <progress class="potisak" value="${this.guns[0].force}" max="${fieldGun.maxForce}"></progress>
    </div>

    <div class='top-right'>
      ${progresBar(this.guns[1].health.current)}
      ${this.vsComputer ? '' : `<progress class="potisak" value="${this.guns[1].force}" max="${fieldGun.maxForce}"></progress>`}
    </div>
    `
  }

}
