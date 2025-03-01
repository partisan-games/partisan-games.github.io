import { getRandomCoords, nadjiNajdaljeTacke } from '/core/utils.js'
import Scena2D from '/core/Scena2D.js'
import Pozadina from '/core/objects/Pozadina.js'
import Vreme from '/core/Vreme.js'
import Bombas from './Bombas.js'
import Bunker from './Bunker.js'
import Mina from './Mina.js'
import Mitraljezac from './Mitraljezac.js'

const ZADATO_VREME = 30
const BROJ_PREPREKA = 20

export default class KrupanjScena extends Scena2D {
  init() {
    this.vreme = new Vreme()
    this.pozadina = new Pozadina('textures/terrain/beton.gif')
    const pozicije = getRandomCoords({ n: BROJ_PREPREKA + 2, fieldSize: 100 })
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
      this.victory('Neprijateljski bunker je uništen!')
    }
  }

  update(dt, t) {
    super.update(dt, t)
    this.mine.forEach(mina => mina.proveriSudar(this.player))

    if (this.player.mrtav) this.defeat('Slavno si pao.')
    if (t > ZADATO_VREME) this.defeat('Tvoje vreme je isteklo.')

    this.proveriPobedu()
  }

  /* UI */

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return /* html */`
      <main class='absolute full'>
        <h3 class="centar">Dovedi Žikicu Jovanovića Španca do nemačkog bunkera!</h3>
        <div class='top-left'>
          Vreme: ${preostalo} <br>
        </div>
      </main>
    `
  }
}
