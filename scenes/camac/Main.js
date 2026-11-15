import Scena2D from '/core/Scena2D.js'
import platno from '/core/io/platno.js'
import Boat from './Boat.js'
import Obala from './Obala.js'
import BoatCombat from './BoatCombat.js'
import SBoatEncounter from './SBoatEncounter.js'
import collideWithWreck from './wreckCollision.js'
import BoatCamera from './BoatCamera.js'
import ShoreDefenses from './ShoreDefenses.js'

export default class extends Scena2D {
  init() {
    this.cameraX = 0
    this.camera = new BoatCamera()
    this.combat = new BoatCombat(this.session)
    const startX = this.camera.screenX(platno.width, 0)
    this.player = new Boat(() => this.cameraX, this.session, startX)
    this.player.postavi(startX, platno.height / 2)
    this.obala = new Obala(() => this.cameraX)
    this.add(this.obala)
    this.addCombatant(this.player, 'partisan')
    this.encounter = new SBoatEncounter({ session: this.session, viewLeft: () => this.cameraX, target: this.player })
    this.addCombatant(this.encounter.boat, 'axis')
    this.shoreDefenses = new ShoreDefenses({ coast: this.obala, session: this.session,
      viewLeft: () => this.cameraX, target: this.player })
    for (const post of this.shoreDefenses.positions) this.addCombatant(post, 'axis')
    this.bojaPozadine = '#000066'
  }

  addCombatant(actor, team) {
    this.combat.add(actor, team)
    this.add(actor)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.encounter.update()
    this.shoreDefenses.update()
    const previousPlayer = { x: this.player.x, y: this.player.y }
    const previousWreck = { x: this.encounter.boat.x, y: this.encounter.boat.y }
    this.combat.beginFrame()
    super.update(dt, t)
    this.camera.update(dt, this.player.alive && this.player.input.up, this.player.x > this.player.startX)
    this.cameraX = this.camera.left(this.player.x, platno.width, this.player.sirina || 0)
    this.combat.resolve()
    collideWithWreck(this.player, this.encounter.boat, previousPlayer, previousWreck)
    this.cameraX = this.camera.left(this.player.x, platno.width, this.player.sirina || 0)
    if (this.player.dead) this.defeat()
  }

  render() {
    const { kameraX, kameraY } = this.renderer
    this.renderer.kameraX = this.cameraX
    this.renderer.kameraY = 0
    try {
      super.render()
    } finally {
      // The renderer is shared with other scenes; camera ownership remains local.
      this.renderer.kameraX = kameraX
      this.renderer.kameraY = kameraY
    }
  }
}
