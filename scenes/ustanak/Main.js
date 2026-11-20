import canvas2d from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import Top from './Top.js'
import Strelac from './Strelac.js'
import Zastavnik from './Zastavnik.js'
import Posada from './Posada.js'
import { progresBar } from '/ui/components.js'
import { mainMenuButton } from '/ui/UI.js'
import { keyboard } from '/core/io/Keyboard.js'
import { keys, leftPlayerKeys } from '/core/io/keys.js'
import Turns from './Turns.js'
import CannonAI from './CannonAI.js'
import Bunker from '/core/objects/Bunker.js'
import Battlefield from './Battlefield.js'
import Airplane from '/core/objects/Airplane.js'
import Wind from './Wind.js'
import WindEffects from './WindEffects.js'
import Terrain from './Terrain.js'

const groundLevel = canvas2d.height * .75
const cannonY = groundLevel - 32

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
    <h2>Choose mode</h2>
    <button class="bg-olive" id="jedan-igrac" >
      Player vs computer
    </button>
    <button class="bg-olive" id="dva-igraca">
      2 players
    </button>
  </div>
`

export default class UstanakScene extends Scene2D {
  constructor() {
    super({ controlKeys: { W: 'up', S: 'down', Space: 'shoot ' }, customStartScreen, showControls: true })
  }

  init() {
    this.score = [0, 0]
    this.round = 1
    this.roundWinner = null
    this.turns = new Turns()
    this.vsComputer = true
    this.audioPlayer = () => this.vsComputer || this.turns.active === 0 ? this.top : this.opponent
    this.announcingTurn = false
    this.instructionsShown = false
    this.wind = new Wind()
    this.windEffects = new WindEffects(this.wind)
    // Craters stop 8 px above the bottom of the screen, so the layer never opens to nothing.
    this.terrain = new Terrain({ floorY: Top.floorY(cannonY), width: canvas2d.width, bottom: canvas2d.height - 8 })
    this.battlefield = new Battlefield({ canvas: this.canvas, groundY: groundLevel, wind: this.wind, terrain: this.terrain })
    this.audioChildren = [this.wind, this.battlefield]
    this.bunker = new Bunker({ x: canvas2d.width * .75, alive: false, smoky: true, z: 1 })
    this.bunker.onload = () => this.bunker.placeOnGround(groundLevel + 20)
    const flagTime = () => this.battlefield.time
    const zastavnik = new Zastavnik(40, groundLevel + 1, { flagTime })
    this.top = new Top({ x: 230, y: cannonY, clock: this.session.clock, wind: this.wind, terrain: this.terrain,
      canFire: () => this.canShoot(0), onFire: () => {
        this.turns.fire(0)
        this.shotTargetHealth = this.opponent.energija
        this.posada.fire()
      } })
    this.posada = new Posada(110, groundLevel + 8)
    this.strelac = new Strelac(300, groundLevel + 8)
    this.strelac.setState('fire')
    this.opponent = new Top({
      x: canvas2d.width - 230, y: cannonY, direction: -1,
      clock: this.session.clock, wind: this.wind, terrain: this.terrain,
      canFire: () => this.canShoot(1), onFire: () => {
        this.turns.fire(1)
        this.shotTargetHealth = this.top.energija
        this.enemyCrew.fire()
      },
    })
    this.opponent.targets.push(this.top)
    this.top.targets.push(this.opponent)
    this.ai = new CannonAI({ cannon: this.opponent, target: this.top, clock: this.session.clock })
    this.enemyCrew = new Posada(canvas2d.width - 110, groundLevel + 8, { italian: true, direction: -1 })
    const enemyFlag = new Zastavnik(canvas2d.width - 80, groundLevel - 3, { italian: true, flagTime })
    const avion = new Airplane({ src: 'armies/talijani/avioni/fiat-cr42.png', y: canvas2d.height * .4, scale: .85, speed: -240 })
    const avion2 = new Airplane({ src: 'armies/talijani/avioni/imam-ro57.png', y: canvas2d.height * .2, scale: 0.66, speed: -320 })
    this.add(avion, avion2, this.opponent, this.top, this.strelac, this.posada, zastavnik, this.enemyCrew, enemyFlag)
    this.terrain.support(this.top, this.opponent, this.posada, this.enemyCrew, this.strelac, zastavnik, enemyFlag)
    this.setRoundScenery()
  }

  setRoundScenery() {
    this.battlefield.round = this.round
    this.battlefield.update(0)
    this.remove(this.bunker)
    if (this.round === 1) this.add(this.bunker)
    else this.bunker.flame?.clear()
  }

  handleClick(e) {
    const button = e.target.closest('button')
    if (button?.id === 'next-round') return this.nextRound()
    if (!button || !['jedan-igrac', 'dva-igraca'].includes(button.id)) return

    this.vsComputer = button.id !== 'dva-igraca'
    this.start()
  }

  canShoot(side) {
    return this.session.state === 'running' && !this.ui.outro
      && this.roundWinner === null
      && this.turns.phase === 'aim' && this.turns.active === side
  }

  start() {
    super.start()
    this.turns.waitForRelease = keyboard.isDown(leftPlayerKeys.shoot)
    this.announceTurn()
  }

  announceTurn(result = '') {
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
    if (this.vsComputer && this.turns.active === 1) this.enemyCrew.play('load')
    this.turnNotice.after(showInstructions ? 5 : result ? 2 : 1.2, () => {
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
    const cannon = this.turns.active === 0 ? this.top : this.opponent
    const crew = this.turns.active === 0 ? this.posada : this.enemyCrew
    // the crew loads while the fire key is held, and stands by again when it is let go before the shot
    if (crew.state !== 'fire') crew.setState(keyboard.isDown(leftPlayerKeys.shoot) ? 'load' : 'idle')
    cannon.handleInput(dt)
  }

  clear() {
    this.battlefield?.render(this.round)
  }

  imagesLoaded() {
    return Promise.all([super.imagesLoaded(), this.battlefield.loaded()])
  }

  update(dt, t) {
    this.wind.update(dt)
    this.battlefield.update(dt)
    this.terrain.update(dt)
    super.update(dt, t)
    for (const cannon of [this.top, this.opponent]) cannon.resolveShots()
    this.windEffects.update(this.children, dt)
    if (this.ui.outro || this.roundWinner !== null || this.session.state !== 'running') return
    if (this.top.dead) return this.finishRound(1)
    if (this.opponent.dead) return this.finishRound(0)
    const shooter = this.turns.active
    if (this.turns.settle(this.top.hasActiveShot || this.opponent.hasActiveShot)) {
      const target = shooter === 0 ? this.opponent : this.top
      const hit = target.energija < this.shotTargetHealth
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
    this.roundWinner = winner
    this.score[winner]++
    this.turnNotice?.dispose()
    this.announcingTurn = false
    this.ui.message = ''
    this.ui.messageElement.replaceChildren()
    keyboard.reset()
    for (const cannon of [this.top, this.opponent])
      cannon.projektili.forEach(projectile => projectile.reset())
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
      <div class="central-screen simple-container">
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
    for (const cannon of [this.top, this.opponent]) cannon.resetRound()
    this.posada.resetRound()
    this.enemyCrew.resetRound()
    this.strelac.resetRound()
    this.turnNotice?.dispose()
    keyboard.reset()
    this.round++
    this.wind.nextRound()
    this.terrain.reset()
    this.setRoundScenery()
    this.roundWinner = null
    this.turns = new Turns()
    this.turns.active = (this.round - 1) % 2
    this.ai = new CannonAI({ cannon: this.opponent, target: this.top, clock: this.session.clock })
    this.ui.hideScreen()
    this.focusCanvas()
    this.announceTurn()
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
      ${progresBar(this.top.energija)}
      <progress class="potisak" value="${this.top.sila}" max="${this.top.minSila * 3}"></progress>
    </div>

    <div class='top-right'>
      ${progresBar(this.opponent.energija)}
    </div>
    `
  }

}
