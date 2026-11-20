import { canvas2d } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import BattleBackground, { battlefields } from './BattleBackground.js'
import { progresBar } from '/ui/components.js'
import TenkLevo from './TenkLevo.js'
import TenkDesno from './TenkDesno.js'
import Controls, { tankLeftControls, tankRightControls } from '/ui/Controls.js'
import TankKeys from '/core/io/controllers/TankKeys.js'
import TankAI from '/core/gameplay/controllers/TankAI.js'
import { leftPlayerKeys, rightPlayerKeys } from '/core/io/keys.js'

const groundLevel = canvas2d.height * 0.8
/**
 * The battlefields in the order the matches are fought, starting over after the last (owner's decision); the Srem
 * front and Batina come first once their pictures exist.
 */
export const battlefieldOrder = ['city', 'bihac', 'drvar', 'uzice']
let nextBattlefield = 0

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
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

  init() {
    this.battlefield = battlefieldOrder[nextBattlefield++ % battlefieldOrder.length]
    this.background = new BattleBackground(this.canvas, battlefields[this.battlefield])
    const { clock } = this.session
    this.tenk = new TenkLevo({ y: groundLevel, clock })
    this.tenk.controller = new TankKeys(this.tenk, leftPlayerKeys)
    this.audioPlayer = () => this.tenk
    this.tenk2 = new TenkDesno({ y: groundLevel, clock })
    this.tenk2.controller = new TankAI(this.tenk2, { clock })
    this.tenk.targets.push(this.tenk2)
    this.tenk2.targets.push(this.tenk)
    this.add(this.tenk, this.tenk2)
  }

  handleClick(e) {
    const button = e.target.closest('button')
    if (button && ['jedan-igrac', 'dva-igraca'].includes(button.id)) this.play(button.id)
  }

  /** With two players the right tank is driven by the right player's keys. */
  prepare(mode) {
    if (mode !== 'dva-igraca') return
    this.tenk2.controller = new TankKeys(this.tenk2, rightPlayerKeys)
    this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
  }

  update(dt) {
    this.background.update(dt)
    super.update(dt)
    const porazeni = this.tenk2.dead ? 'German' : 'Partisan'
    const poruka = `${porazeni} tank destroyed.`

    if (this.tenk2.dead) this.victory(poruka)
    if (this.tenk.dead) this.defeat(poruka)
  }

  sceneUI() {
    return /* html*/`
      <div class='top-left'>
        Partisan tank
        ${progresBar(this.tenk.energija)}
      </div>

      <div class='top-right'>
        German tank
        ${progresBar(this.tenk2.energija)}
      </div>
    `
  }

  end() {
    super.end()
    this.controls2UI?.end()
  }
}
