import canvas2d, { ctx } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import { progresBar } from '/ui/components.js'
import TenkLevo from '../tenkici/TenkLevo.js'
import Bunker from './Bunker.js'
import createGroundEnemies from './GroundEnemies.js'
import prepareCombatAssets from './prepareCombatAssets.js'
import CombatLayers from './CombatLayers.js'
import AttachedFlame from './AttachedFlame.js'
import Battlefield from './Battlefield.js'
import BattleFeedback from './BattleFeedback.js'
import spaceBunkers from './spaceBunkers.js'
import AirRaids from './AirRaids.js'
import { tankLeftControls } from '/ui/Controls.js'

const PARALAX_1 = -160
const LEVEL_LENGTH = Math.abs(PARALAX_1) * 180

export default class ToTriesteScene extends Scene2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Probij se kroz neprijateljske položaje, obori avione i stigni do kraja puta.' })
  }

  async init() {
    this.groundY = canvas2d.height * .8
    const groundLevel = this.groundY
    this.score = 0
    this.distance = 0
    this.levelLength = LEVEL_LENGTH
    this.battlefield = new Battlefield({ groundY: groundLevel, distance: () => this.distance })
    this.zgrade = this.battlefield.buildings
    this.tenk = new TenkLevo({ y: groundLevel, groundY: groundLevel, scale: .4, xLimit: canvas2d.width * .9, clock: this.session.clock })

    const bunkerCallback = () => this.score++
    const bunkerOptions = { clock: this.session.clock, target: this.tenk, groundY: groundLevel, callback: bunkerCallback, flammable: true, speed: PARALAX_1 }
    this.bunkeri = [
      new Bunker({ ...bunkerOptions, src: 'buildings/kuca-bunker.png', scale: .33 }),
      new Bunker({ ...bunkerOptions, src: 'buildings/bunker-02.png', scale: .5 }),
    ]
    this.enemies = createGroundEnemies({ clock: this.session.clock, target: this.tenk, groundY: groundLevel, scrollSpeed: PARALAX_1, callback: bunkerCallback })
    this.airRaids = new AirRaids({ clock: this.session.clock, target: this.tenk, groundY: groundLevel,
      scrollSpeed: PARALAX_1,
      crashY: plane => this.battlefield.roadTop + this.battlefield.roadHeight + plane.height * .6 + 6,
      callback: bunkerCallback })
    const hostiles = [...this.bunkeri, ...this.enemies, ...this.airRaids.planes]
    this.add(this.battlefield, ...hostiles, this.tenk)
    this.tenk.targets.push(...hostiles)
    const pools = [this.tenk.granate, ...hostiles
      .filter(shooter => shooter.fire).map(shooter => shooter.fire.projectiles)]
    const combatReady = prepareCombatAssets(pools)
    await Promise.all([combatReady, this.imagesLoaded()])
    if (!this.session.active) return
    spaceBunkers(this.bunkeri, canvas2d.width)
    this.battlefield.alignRoad(this.tenk.y + this.tenk.height * .46)
    for (const bunker of this.bunkeri) bunker.placeOnGround(this.battlefield.roadTop)
    this.battlefield.prepare()
    const units = [this.tenk, ...hostiles]
    for (const unit of units) unit.flame = new AttachedFlame(unit.x, unit.y)
    this.combatLayers = new CombatLayers(units)
    this.feedback = new BattleFeedback({ units, clock: this.session.presentationClock, scrollSpeed: PARALAX_1 })
    this.add(this.feedback.ground, this.feedback.front)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.distance = Math.min(this.levelLength, this.distance + Math.abs(PARALAX_1) * dt)
    this.airRaids.update()
    super.update(dt, t)
    this.bunkeri.forEach(bunker => bunker.checkHits())
    this.enemies.forEach(enemy => enemy.checkHits())
    this.airRaids.planes.forEach(plane => plane.checkHits())
    this.feedback.update()
    this.combatLayers.update()
    if (this.tenk.dead) this.defeat('Tvoj tenk je uništen.')
    else if (this.distance >= this.levelLength) this.victory('Proboj je uspeo. Stigao si do kraja puta.')
  }

  clear() {
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height)
  }

  sceneUI() {
    return /* html */`
      <main class="top-left">
        Score: ${this.score}
        ${progresBar(this.tenk.energija)}
      </main>
    `
  }
}
