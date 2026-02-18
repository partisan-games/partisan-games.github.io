import platno from '/core/io/platno.js'
import { getRandomCoords, nadjiNajdaljeTacke } from '/core/utils.js'
import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import Vreme from '/core/Vreme.js'
import Bombas from '/core/actor/derived/Bombas.js'
import Bunker from '/core/objects/Bunker.js'
import Mina from './Mina.js'
import Mitraljezac from './Mitraljezac.js'

const ZADATO_VREME = 30
const fieldSize = 100
const BROJ_PREPREKA = (platno.width / fieldSize) * (platno.height / fieldSize) / 4

export default class extends Scena2D {
  constructor() {
    super({ intro: 'Bring Žikica Jovanović Španac to the German bunker!' })
  }

  init() {
    this.vreme = new Vreme()
    this.pozadina = new Pozadina('textures/terrain/beton.gif')
    const pozicije = getRandomCoords({ n: BROJ_PREPREKA, fieldSize, margin: 40 })
    const najdaljeTacke = nadjiNajdaljeTacke(pozicije)

    this.player = new Bombas(najdaljeTacke[0])
    this.bunker = new Bunker(najdaljeTacke[1])
    this.mitraljezac = new Mitraljezac(this.bunker.x + 60, this.bunker.y + 20, this.player)

    this.mine = pozicije
      .filter(p => !najdaljeTacke.some(tacka => tacka.x === p.x && tacka.y === p.y))
      .map(p => new Mina(p))
    this.add(this.bunker, this.mitraljezac, this.player, ...this.mine)
  }

  proveriPobedu() {
    if (this.player.razmakDo(this.bunker) < this.bunker.sirina / 2) {
      this.bunker.umri()
      this.victory('The enemy bunker has been destroyed!')
    }
  }

  update(dt, t) {
    super.update(dt, t)
    this.mine.forEach(mina => mina.proveriSudar(this.player))

    if (this.player.mrtav) this.defeat('You fell gloriously.')
    if (t > ZADATO_VREME) this.defeat('Your time is up.')

    this.proveriPobedu()
  }

  /* UI */

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return this.ui.scoreUI('Time left', preostalo)
  }
}
