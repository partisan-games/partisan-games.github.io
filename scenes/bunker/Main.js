import canvas2d from '/core/io/canvas2d.js'
import { getRandomCoords, findFarthestPoints } from '/core/utils.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import Grenadier from '/core/actor/derived/Grenadier.js'
import Bunker from '/core/objects/Bunker.js'
import Mina from './Mina.js'
import MachineGunner from '/core/actor/soldiers/MachineGunner.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'

const ZADATO_VREME = 30
const fieldSize = 100
const BROJ_PREPREKA = (canvas2d.width / fieldSize) * (canvas2d.height / fieldSize) / 4

export default class BunkerScene extends Scene2D {
  constructor() {
    super({ intro: 'Bring Žikica Jovanović Španac to the German bunker!' })
  }

  init() {
    this.background = new Background('textures/terrain/beton.gif')
    const pozicije = getRandomCoords({ n: BROJ_PREPREKA, fieldSize, margin: 40 })
    const najdaljeTacke = findFarthestPoints(pozicije)

    this.player = new Grenadier(najdaljeTacke[0])
    this.bunker = new Bunker(najdaljeTacke[1])
    this.mitraljezac = new MachineGunner({ x: this.bunker.x + 60, y: this.bunker.y + 20, targets: [this.player], session: this.session })
    this.gunner = new Gunner(this.mitraljezac, this.player)

    this.mine = pozicije
      .filter(p => !najdaljeTacke.some(tacka => tacka.x === p.x && tacka.y === p.y))
      .map(p => new Mina(p))
    this.add(this.bunker, this.mitraljezac, this.player, ...this.mine)
  }

  proveriPobedu() {
    if (this.player.distanceTo(this.bunker) < this.bunker.width / 2) {
      this.bunker.die()
      this.victory('The enemy bunker has been destroyed!')
    }
  }

  update(dt, t) {
    // the gunner aims where the player was in the last frame, as he did when he aimed himself before the player moved
    if (this.session.state === 'running') this.gunner.update()
    super.update(dt, t)
    if (this.ui.outro) return
    this.mine.forEach(mina => mina.proveriSudar(this.player))

    if (this.player.dead) this.defeat('You fell gloriously.')
    if (t > ZADATO_VREME) this.defeat('Your time is up.')

    this.proveriPobedu()
  }

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return this.ui.scoreUI('Time left', preostalo)
  }
}
