import platno, { ctx } from '/core/io/platno.js'
import Scena2D from '/core/Scena2D.js'
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
import { tankLeftControls } from '/ui/Controls.js'

const PARALAX_1 = -160
const LEVEL_LENGTH = null // Scroll pixels; choose the length when the level content is ready.

export default class extends Scena2D {
  constructor() {
    super({ controlKeys: tankLeftControls, intro: 'Uništi osovinska uporišta i vozila.' })
  }

  async init() {
    this.groundY = platno.height * .8
    const nivoTla = this.groundY
    this.score = 0
    this.distance = 0
    this.levelLength = LEVEL_LENGTH
    this.battlefield = new Battlefield({ groundY: nivoTla, distance: () => this.distance })
    this.zgrade = this.battlefield.buildings
    this.tenk = new TenkLevo({ y: nivoTla, groundY: nivoTla, skalar: .4, xLimit: platno.width * .9, clock: this.session.clock })

    const bunkerCallback = () => this.score++
    const bunkerOptions = { clock: this.session.clock, target: this.tenk, groundY: nivoTla, callback: bunkerCallback, zapaljiv: true, brzina: PARALAX_1 }
    this.bunkeri = [
      new Bunker({ ...bunkerOptions, src: 'buildings/kuca-bunker.png', tlo: nivoTla + 15, skalar: .33 }),
      new Bunker({ ...bunkerOptions, src: 'buildings/bunker-02.png', tlo: nivoTla + 5, skalar: .5 }),
    ]
    this.enemies = createGroundEnemies({ clock: this.session.clock, target: this.tenk, groundY: nivoTla, scrollSpeed: PARALAX_1, callback: bunkerCallback })
    this.add(this.battlefield, ...this.bunkeri, ...this.enemies, this.tenk)
    this.tenk.ciljevi.push(...this.bunkeri, ...this.enemies)
    const pools = [this.tenk.granate, ...[...this.bunkeri, ...this.enemies]
      .filter(shooter => shooter.fire).map(shooter => shooter.fire.projectiles)]
    const combatReady = prepareCombatAssets(pools)
    await Promise.all([combatReady, this.slikeUcitane()])
    if (!this.session.active) return
    spaceBunkers(this.bunkeri, platno.width)
    this.battlefield.alignRoad(this.tenk.y + this.tenk.visina * .46)
    this.battlefield.prepare()
    const units = [this.tenk, ...this.bunkeri, ...this.enemies]
    for (const unit of units) unit.plamen = new AttachedFlame(unit.x, unit.y)
    this.combatLayers = new CombatLayers(units)
    this.feedback = new BattleFeedback({ units, clock: this.session.presentationClock, scrollSpeed: PARALAX_1 })
    this.add(this.feedback.ground, this.feedback.front)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.distance += Math.abs(PARALAX_1) * dt
    super.update(dt, t)
    this.bunkeri.forEach(bunker => bunker.checkHits())
    this.enemies.forEach(enemy => enemy.checkHits())
    this.feedback.update()
    this.combatLayers.update()
    if (this.tenk.dead) this.defeat('Tvoj tenk je uništen.')
  }

  clear() {
    ctx.clearRect(0, 0, platno.width, platno.height)
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
