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
import Avion from '/core/objects/Avion.js'

const nivoTla = platno.height * .75

const customStartScreen = /* html */`
  <div class="central-screen simple-container">
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
    super({ controlKeys: { W: 'up', S: 'down', Space: 'shoot ' }, customStartScreen })
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
      ai: true
    })
    this.tenk.ciljevi.push(this.top)
    const planine = new Array(3).fill().map(() => new Planina({ nivoTla, z: 2, skalar: 2 }))
    const avion = new Avion({ src: 'armies/talijani/avioni/fiat-cr42.png', y: platno.height * .4, skalar: .85, brzina: -240 })
    const avion2 = new Avion({ src: 'armies/talijani/avioni/imam-ro57.png', y: platno.height * .2, skalar: 0.66, brzina: -320 })
    this.top.ciljevi.push(this.tenk, avion, avion2)
    this.add(...planine, avion, avion2, this.bunker, this.tenk, this.top, strelac, posada, zastavnik)
    this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
  }

  handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button')
    if (!['jedan-igrac', 'dva-igraca'].includes(button.id)) return

    if (button.id == 'dva-igraca')
      this.tenk.ai = !this.tenk.ai
    this.start()
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
    </div>
    `
  }
}
