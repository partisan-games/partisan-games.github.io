import platno, { crtaNeboZemlju } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import Top from './Top.js'
import Strelac from './Strelac.js'
import Zastavnik from './Zastavnik.js'
import Posada from './Posada.js'
import TenkDesno from '../tenkici/TenkDesno.js'
import { progresBar } from '/ui/components.js'
import Controls, { tankRightControls } from '/ui/Controls.js'
import Bunker from '/core/objects/Bunker.js'
import Planina from '/core/objects/Planina.js'
import Vracanje from '/core/objects/Vracanje.js'

const nivoTla = platno.height * .75
let aiPlayer = true

export default class GrahovoScena extends Scena2D {
  constructor(manager) {
    super(manager, { controlKeys: { W: 'up', S: 'down', Space: 'shoot ' } })
  }

  init() {
    this.bunker = new Bunker({ x: platno.width * .75, ziv: false, zadimljen: true, z: 1 })
    this.bunker.onload = () => this.bunker.tlo(nivoTla + 20)
    const zastavnik = new Zastavnik(40, nivoTla + 1)
    this.top = new Top({ x: 230, y: nivoTla - 32 })
    const posada = new Posada(110, nivoTla + 8)
    const strelac = new Strelac(300, nivoTla + 8)
    this.tenk = new TenkDesno({
      src: 'armies/game-ready/m42-02.png',
      cevSlika: 'armies/game-ready/m42-02-cev.png',
      y: nivoTla,
      skalar: 1,
      vremePunjenjaAI: 3000,
      ai: aiPlayer
    })
    this.tenk.ciljevi.push(this.top)
    this.top.ciljevi.push(this.tenk)
    const planine = new Array(3).fill().map(() => new Planina({ nivoTla, z: 2, skalar: 2 }))
    const avion = new Vracanje({ src: 'armies/talijani/avioni/fiat-cr42.png', y: platno.height * .4, skalar: 1, zapaljiv: true, brzina: -240 })
    const avion2 = new Vracanje({ src: 'armies/talijani/avioni/imam-ro57.png', y: platno.height * .2, skalar: 0.66, zapaljiv: true, brzina: -320 })
    this.add(...planine, avion, avion2, this.bunker, this.tenk, this.top, strelac, posada, zastavnik)
    this.controls2UI = new Controls({ containerClass: 'bottom-right', controlKeys: tankRightControls })
  }

  handleClick(e) {
    super.handleClick(e)
    if (e.target.id == 'dva-igraca')
      this.tenk.ai = aiPlayer = !aiPlayer
  }

  clear() {
    crtaNeboZemlju(nivoTla, { linija: true })
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.top.mrtav) this.defeat('Partizanski top je uništen.')
    if (this.tenk.mrtav) this.victory('Talijanski tenk je uništen!')
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
