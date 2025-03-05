import platno, { crtaNeboZemlju } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import Top from './Top.js'
import Strelac from './Strelac.js'
import Zastavnik from './Zastavnik.js'
import Posada from './Posada.js'
import TenkDesno from '../tenkici/TenkDesno.js'
import { progresBar } from '/ui/components.js'
import Controls, { tankRightControls } from '/ui/Controls.js'

const tlo = platno.height * .75
let aiPlayer = true

export default class DurmitorScena extends Scena2D {
  constructor(manager) {
    super(manager, { controlKeys: { W: 'up', S: 'down', Space: 'shoot ' } })
  }

  init() {
    const zastavnik = new Zastavnik(40, tlo + 1)
    this.top = new Top({ x: 230, y: tlo - 32 })
    const posada = new Posada(110, tlo + 8)
    const strelac = new Strelac(300, tlo + 8)
    this.tenk = new TenkDesno({ y: tlo, skalar: .6, vremePunjenjaAI: 3000, ai: aiPlayer })
    this.tenk.ciljevi.push(this.top)
    this.top.ciljevi.push(this.tenk)
    this.add(this.tenk, this.top, strelac, posada, zastavnik)
    this.controls2UI = new Controls({ containerClass: 'bottom-right', controlKeys: tankRightControls })
  }

  handleClick(e) {
    super.handleClick(e)
    if (e.target.id == 'dva-igraca')
      this.tenk.ai = aiPlayer = !aiPlayer
  }

  clear() {
    crtaNeboZemlju(tlo, { linija: true })
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.top.mrtav) this.defeat('Partizanski top je uništen.')
    if (this.tenk.mrtav) this.victory('Nemački tenk je uništen!')
  }

  sceneUI() {
    return /* html */`
    <div class='top-left'>
      ${progresBar(this.top.energija)}
      <progress class="potisak" value="${this.top.sila}" max="${this.top.minSila * 3}"></progress>
    </div>

    <div class='top-right'>
      ${progresBar(this.tenk.energija)}
      <button id="dva-igraca" class="bg-olive full">
        ${this.tenk.ai ? 'Dodaj igrača' : 'Uključi<br> neprijatelja'}
      </button>
    </div>
    `
  }
}
