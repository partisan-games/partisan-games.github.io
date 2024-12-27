// srediti boju pozadine
// beskonačan ekran nadesno
// mozda ubaciti obale da promiču
// nailazi na prepreke, stenje, brodolomnike, čamce, krstarice, brodove....

import Scena from '/game-engine/core/Scena.js'
import CamacIgracOdozgo from '../2d-odozgo/CamacIgracOdozgo.js'

export default class CamacScena extends Scena {
  constructor(...args) {
    super(...args)
    this.bojaPozadine = '#000066'
    const camac = new CamacIgracOdozgo()
    this.dodaj(camac)
  }
}
