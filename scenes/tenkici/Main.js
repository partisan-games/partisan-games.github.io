import { platno } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import PozadinaGrada from './PozadinaGrada.js'
import { progresBar } from '/ui/components.js'
import TenkLevo from './TenkLevo.js'
import TenkDesno from './TenkDesno.js'
import Controls, { tankLeftControls, tankRightControls } from '/ui/Controls.js'

const nivoTla = platno.height * 0.8

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

export default class extends Scena2D {
  constructor() {
    super({ controlKeys: tankLeftControls, customStartScreen, showControls: true, showFullScreen: false })
  }

  init() {
    this.pozadina = new PozadinaGrada(this.canvas)
    const { clock } = this.session
    this.tenk = new TenkLevo({ y: nivoTla, clock })
    this.tenk2 = new TenkDesno({ y: nivoTla, ai: true, clock })
    this.tenk.ciljevi.push(this.tenk2)
    this.tenk2.ciljevi.push(this.tenk)
    this.predmeti = [this.tenk, this.tenk2]
  }

  handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button')
    if (!button || !['jedan-igrac', 'dva-igraca'].includes(button.id)) return

    if (button.id == 'dva-igraca') {
      this.tenk2.ai = !this.tenk2.ai
      this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
    }

    this.start()
  }

  update(dt) {
    this.pozadina.update(dt)
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
