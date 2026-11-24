import canvas2d from '/core/io/canvas2d.js'
import { getRandomCoords, findFarthestPoints } from '/core/utils.js'
import Scene2D from '/core/Scene2D.js'
import Input from '/core/io/Input.js'
import { attackLabels } from '/core/io/keys.js'
import { icons } from '/core/io/icons.js'
import { baseControls } from '/ui/Controls.js'
import Background from '/core/objects/Background.js'
import Bunker, { gunnerWindow } from '/core/objects/Bunker.js'
import { topProjection } from '/core/actor/projection.js'
import { screenView } from '/core/actor/worldView.js'
import Grenadier from '/core/gameplay/bodies/soldiers/Grenadier.js'
import { grenade } from '/core/gameplay/bodies/projectiles/Grenade.js'
import MachineGunner from '/core/gameplay/bodies/soldiers/MachineGunner.js'
import GrenadierSprite from '/core/actor/soldiers/GrenadierSprite.js'
import MachineGunnerSprite from '/core/actor/soldiers/MachineGunnerSprite.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'
import TopDownKeys from '/core/gameplay/controllers/TopDownKeys.js'
import Mina from './Mina.js'

const ZADATO_VREME = 30
const fieldSize = 100
const BROJ_PREPREKA = (canvas2d.width / fieldSize) * (canvas2d.height / fieldSize) / 4
/** How many pixels a metre of the field is drawn. */
const pxPerMeter = 40

export default class BunkerScene extends Scene2D {
  constructor() {
    super({ intro: 'Bring Žikica Jovanović Španac to the German bunker!',
      reportText: 'Krupanj, September 1941\n\nInsurgents besiege the German garrison in Krupanj. Young bombers led by Žikica Jovanović Španac attack it at night.',
      controlKeys: { ...baseControls, [attackLabels.Space]: 'throw grenade' } })
  }

  init() {
    this.background = new Background('textures/terrain/beton.gif')
    this.projection = topProjection({ pxPerMeter })
    /** What the screen shows, where rounds leave play. */
    this.screenView = screenView(this.projection, this)
    const pozicije = getRandomCoords({ n: BROJ_PREPREKA, fieldSize, margin: 40 })
    const najdaljeTacke = findFarthestPoints(pozicije)

    this.player = new Grenadier({ ...this.projection.toWorld(najdaljeTacke[0]), onBurst: point => this.blast(point) })
    this.playerView = new GrenadierSprite(this.player, { projection: this.projection })
    this.audioPlayer = () => this.playerView
    this.input = new Input({ attackKey: 'Space', buttonDict: { attack: icons.bomb } })
    this.controllers.push(new TopDownKeys(this.player, { input: this.input }))
    this.bunker = new Bunker(najdaljeTacke[1])
    // he sets out facing the bunker, to throw that way
    this.player.facing = Math.sign(najdaljeTacke[1].x - najdaljeTacke[0].x) || -1
    // the gunner lies at the bunker's window, his rounds flying at the grenadier
    this.mitraljezac = new MachineGunner({ ...this.projection.toWorld({ x: this.bunker.x + gunnerWindow.x, y: this.bunker.y + gunnerWindow.y }),
      clock: this.session.clock, targets: [this.player], canFire: () => this.session.state === 'running', view: this.screenView })
    this.gunnerView = new MachineGunnerSprite(this.mitraljezac, { projection: this.projection })
    this.controllers.push(new Gunner(this.mitraljezac, this.player))

    this.mine = pozicije
      .filter(p => !najdaljeTacke.some(tacka => tacka.x === p.x && tacka.y === p.y))
      .map(p => new Mina(p))
    this.add(this.bunker, this.mitraljezac, this.gunnerView, this.player, this.playerView, ...this.mine)
  }

  proveriPobedu() {
    const { x, y } = this.projection.point(this.player)
    if (Math.hypot(x - this.bunker.x, y - this.bunker.y) < this.bunker.width / 2) this.destroyBunker()
  }

  /** A grenade destroys the mines and the bunker its burst reaches. */
  blast(point) {
    if (this.session.state !== 'running') return
    const { x, y } = this.projection.point(point)
    const reaches = item => Math.hypot(x - item.x, y - item.y) <= item.width / 2 + this.projection.length(grenade.radius)
    for (const mina of this.mine) if (mina.alive && reaches(mina)) mina.die()
    if (this.bunker.alive && reaches(this.bunker)) this.destroyBunker()
  }

  destroyBunker() {
    this.bunker.die()
    this.mitraljezac.setState('dead')
    this.victory('The enemy bunker has been destroyed!')
  }

  /** A mine the grenadier steps on goes off under him. */
  checkMines() {
    for (const mina of this.mine) if (mina.alive && mina.visible && this.touches(mina)) {
      mina.die()
      this.player.setState('dead')
    }
  }

  /** Whether the grenadier touches `item`, a picture on the screen. */
  touches(item) {
    const { x, y } = this.projection.point(this.player)
    const halfX = this.projection.length(this.player.size.length) / 2, halfY = this.projection.length(this.player.size.width) / 2
    return Math.abs(item.x - x) < halfX + item.width / 2 && Math.abs(item.y - y) < halfY + item.height / 2
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.ui.outro) return
    this.checkMines()

    if (this.player.dead) this.defeat('You fell gloriously.')
    if (t > ZADATO_VREME) this.defeat('Your time is up.')

    this.proveriPobedu()
  }

  sceneUI(t) {
    const preostalo = ZADATO_VREME - Math.floor(t)
    return this.ui.scoreUI('Time left', preostalo)
  }

  end() {
    this.input?.end()
    super.end()
  }
}
