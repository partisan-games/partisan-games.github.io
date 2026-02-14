import { platno } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import { progresBar } from '/ui/components.js'
import TenkLevo from './TenkLevo.js'
import TenkDesno from './TenkDesno.js'
import Controls, { tankLeftControls, tankRightControls } from '/ui/Controls.js'

const nivoTla = platno.height * 0.8

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
    super({ controlKeys: tankLeftControls, customStartScreen })
  }

  init() {
    this.pozadina = new Pozadina('background/razrusen-grad-savremen.jpg')
    this.controls2UI = new Controls({ positionClass: 'bottom-right', controlKeys: tankRightControls })
    this.tenk = new TenkLevo({ y: nivoTla })
    this.tenk2 = new TenkDesno({ y: nivoTla, ai: true })
    this.tenk.ciljevi.push(this.tenk2)
    this.tenk2.ciljevi.push(this.tenk)
    this.predmeti = [this.tenk, this.tenk2]
  }

  handleClick(e) {
    super.handleClick(e)
    const button = e.target.closest('button')
    if (!['jedan-igrac', 'dva-igraca'].includes(button.id)) return

    if (button.id == 'dva-igraca')
      this.tenk2.ai = !this.tenk2.ai
    this.start()
  }

  update(dt) {
    super.update(dt)
    const porazeni = this.tenk2.mrtav ? 'German' : 'Partisan'
    const poruka = `${porazeni} tank destroyed.`

    if (this.tenk2.mrtav) this.victory(poruka)
    if (this.tenk.mrtav) this.defeat(poruka)
  }

  sceneUI() {
    return /* html*/`
      <div class='top-left'>
        Partisan tank
        ${progresBar(this.tenk.energija, 'rpg')}
      </div>

      <div class='top-right'>
        German tank
        ${progresBar(this.tenk2.energija, 'rpg')}
      </div>
    `
  }
}
