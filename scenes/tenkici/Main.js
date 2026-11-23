import { canvas2d } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import BattleBackground, { battlefields } from './BattleBackground.js'
import { progresBar } from '/ui/components.js'
import { mainMenuButton } from '/ui/UI.js'
import Controls, { tankLeftControls, tankRightControls } from '/ui/Controls.js'
import Tank, { tankKinds } from '/core/gameplay/bodies/vehicles/Tank.js'
import TankSprite from '/core/actor/vehicles/TankSprite.js'
import TankKeys from '/core/gameplay/controllers/TankKeys.js'
import TankAI from '/core/gameplay/controllers/TankAI.js'
import { sideProjection } from '/core/actor/projection.js'
import vehicleArt from '/core/actor/vehicleArt.js'
import { germanTank, m15, stug } from '/core/actor/tankLooks.js'
import { modelPerformance } from '/core/gameplay/modelPerformance.js'
import { keyboard } from '/core/io/Keyboard.js'
import { leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'
import { randomInRange } from '/core/utils.js'

const groundLevel = canvas2d.height * 0.8
/** The battlefield is this many metres wide, whatever the screen, so the tanks keep their size to it. */
export const fieldLength = 74.8
/**
 * The battlefields in the order the rounds are fought, going on into the next match and starting over after the last
 * (owner's decision): the Srem front in autumn 1944, Batina, then the Srem breakthrough in 1945.
 */
export const battlefieldOrder = ['sremFront1944', 'batina', 'sremFront1945']
/** The enemy grows stronger from one battlefield to the next, up to the Tiger I (owner's decision). */
const opponents = { sremFront1944: m15, batina: stug, sremFront1945: germanTank }
let nextBattlefield = 0

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}">
    <h2>Choose mode</h2>
    <button class="bg-olive" id="jedan-igrac" data-paid>
      1 player
    </button>
    <button class="bg-olive" id="dva-igraca" data-paid>
      2 players
    </button>
  </div>
`

export default class TenkiciScene extends Scene2D {
  constructor() {
    super({ controlKeys: tankLeftControls, customStartScreen, showControls: true })
  }

  /** A match goes to two won rounds, at most three, as in Ustanak; each round is fought on the next battlefield. */
  init() {
    this.score = [0, 0]
    this.round = 1
    this.roundWinner = null
    this.mode = 'jedan-igrac'
    this.projection = sideProjection({ pxPerMeter: this.canvas.width / fieldLength, groundY: groundLevel })
    this.audioPlayer = () => this.tenkView
    this.setUpRound()
  }

  /** The next battlefield, two whole tanks on it and what drives them. */
  setUpRound() {
    this.battlefield = battlefieldOrder[nextBattlefield++ % battlefieldOrder.length]
    this.background = new BattleBackground(this.canvas, battlefields[this.battlefield], { groundY: groundLevel })
    const { clock } = this.session
    const half = fieldLength / 2
    // its tanks do not break down: the fight is decided by health alone
    const breakdown = { drive: 0, gun: 0 }
    const enemy = opponents[this.battlefield]
    const leftRadius = tankKinds.partisan.size.length / 2, rightRadius = enemy.kind.size.length / 2
    this.tenk = new Tank({ kind: tankKinds.partisan, performance: modelPerformance.partisanTank, x: randomInRange(leftRadius, fieldLength * .3), clock,
      bounds: { min: leftRadius, max: half - leftRadius }, breakdown })
    this.tenk2 = new Tank({ kind: enemy.kind, rearAim: enemy.rearAim, performance: modelPerformance[enemy.id], x: randomInRange(fieldLength * .7, fieldLength - rightRadius),
      yaw: Math.PI, clock, bounds: { min: half + rightRadius, max: fieldLength - rightRadius }, breakdown })
    this.tenk.targets.push(this.tenk2)
    this.tenk2.targets.push(this.tenk)
    const view = (body, art, barrel, facing) => new TankSprite(body, { art, facing, barrel, projection: this.projection })
    this.tenkView = view(this.tenk, vehicleArt.partisanTank, { src: 'armies/game-ready/tenkovi/partizanski-tenk-cev-pixel.png' })
    this.tenk2View = view(this.tenk2, enemy.art, enemy.barrel, enemy.facing)
    this.add(this.tenk, this.tenkView, this.tenk2, this.tenk2View)
    this.controllers.splice(0, this.controllers.length,
      new TankKeys(this.tenk, { keyboard, keys: leftPlayerKeys }),
      this.mode === 'dva-igraca'
        ? new TankKeys(this.tenk2, { keyboard, keys: rightPlayerKeys })
        : new TankAI(this.tenk2, { clock, targets: this.tenk2.targets }),
    )
  }

  handleClick(e) {
    const button = e.target.closest('button')
    if (button?.id === 'next-round') return this.nextRound()
    if (button && ['jedan-igrac', 'dva-igraca'].includes(button.id)) this.play(button.id)
  }

  start() {
    super.start()
    this.announceBattlefield()
  }

  /** The round's place and verified period stay on screen for three seconds of play. */
  announceBattlefield() {
    this.roundNotice?.dispose()
    this.roundNotice = this.session.gameplay.child()
    const { label } = this.background.place
    const screen = document.createElement('div'), title = document.createElement('h3')
    screen.className = 'central-screen'
    title.textContent = label
    screen.append(title)
    this.ui.message = label
    this.ui.messageElement.replaceChildren(screen)
    this.roundNotice.after(3, () => {
      this.ui.message = ''
      this.ui.messageElement.replaceChildren()
    })
  }

  /** With two players the right tank is driven by the right player's keys. */
  prepare(mode) {
    this.mode = mode
    if (mode !== 'dva-igraca') return
    const ai = this.controllers.findIndex(controller => controller.body === this.tenk2)
    this.controllers.splice(ai, 1, new TankKeys(this.tenk2, { keyboard, keys: rightPlayerKeys }))
    this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
  }

  sideName(side) {
    return side === 0 ? 'Partisan tank' : 'German tank'
  }

  /** The round goes to the tank left standing; a match is won with two rounds. Both lost at once count for the left. */
  finishRound(winner) {
    if (this.roundWinner !== null || this.ui.outro) return
    this.roundNotice?.dispose()
    this.ui.message = ''
    this.ui.messageElement.replaceChildren()
    this.roundWinner = winner
    this.score[winner]++
    keyboard.reset()
    const text = `${this.sideName(1 - winner)} destroyed. ${this.score.join(' : ')}`
    if (this.score[winner] === 2) {
      if (winner === 0) this.victory(text)
      else this.defeat(text)
      return
    }
    if (winner === 0) this.ui.victorySound.play()
    else this.ui.defeatSound.play()
    this.showRoundResult()
  }

  showRoundResult() {
    this.ui.showScreen('round', /* html */`
      <div class="central-screen flex-column simple-container">
        <h3>Round ${this.round}: ${this.sideName(this.roundWinner)} wins!</h3>
        <p>${this.score.join(' : ')}</p>
        ${mainMenuButton('bg-olive')}
        <button class="bg-olive" id="next-round">Next round</button>
      </div>
    `)
  }

  nextRound() {
    if (this.roundWinner === null || this.ui.outro || this.session.state !== 'running') return
    this.ui.sounds.forEach(sound => sound.stop())
    this.remove(this.tenk, this.tenkView, this.tenk2, this.tenk2View)
    keyboard.reset()
    this.round++
    this.roundWinner = null
    this.setUpRound()
    this.ui.hideScreen()
    this.focusCanvas()
    this.announceBattlefield()
  }

  unpause() {
    super.unpause()
    if (this.roundWinner !== null && !this.ui.outro) this.showRoundResult()
  }

  update(dt) {
    this.background.update(dt)
    super.update(dt)
    if (this.tenk2.dead) this.finishRound(0)
    else if (this.tenk.dead) this.finishRound(1)
  }

  sceneUI() {
    return /* html*/`
      <div class='top-left'>
        Partisan tank
        ${progresBar(this.tenk.health.current / this.tenk.health.maximum * 100)}
      </div>

      <div class='top-right'>
        German tank
        ${progresBar(this.tenk2.health.current / this.tenk2.health.maximum * 100)}
      </div>

      <div aria-label="Round score" style="position: absolute; top: var(--spacing); left: 50%; transform: translateX(-50%)">
        ${this.score.join(' : ')}
      </div>
    `
  }

  end() {
    super.end()
    this.controls2UI?.end()
  }
}
