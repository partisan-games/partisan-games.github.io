import { canvas2d } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import PozadinaGrada from './PozadinaGrada.js'
import { progresBar } from '/ui/components.js'
import TenkLevo from './TenkLevo.js'
import TenkDesno from './TenkDesno.js'
import Controls, { tankLeftControls, tankRightControls } from '/ui/Controls.js'

const groundLevel = canvas2d.height * 0.8

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen ${container}">
    <h2>Choose mode</h2>
    <button class="bg-olive" id="jedan-igrac" >
      1 player
    </button>
    <button class="bg-olive" id="dva-igraca">
      2 players
    </button>
  </div>
`

export default class TenkiciScene extends Scene2D {
  constructor() {
    super({ controlKeys: tankLeftControls, customStartScreen, showControls: true })
  }

  init() {
    this.background = new PozadinaGrada(this.canvas)
    const { clock } = this.session
    this.tenk = new TenkLevo({ y: groundLevel, clock })
    this.audioPlayer = () => this.tenk
    this.tenk2 = new TenkDesno({ y: groundLevel, ai: true, clock })
    this.tenk.targets.push(this.tenk2)
    this.tenk2.targets.push(this.tenk)
    this.add(this.tenk, this.tenk2)
  }

  handleClick(e) {
    const button = e.target.closest('button')
    if (!button || !['jedan-igrac', 'dva-igraca'].includes(button.id)) return

    if (button.id === 'dva-igraca') {
      this.tenk2.ai = !this.tenk2.ai
      this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
    }

    this.start()
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
