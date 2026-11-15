import Scena2D from '/core/Scena2D.js'
import platno from '/core/io/platno.js'
import Boat from './Boat.js'
import Obala from './Obala.js'
import BoatCombat from './BoatCombat.js'
import SBoatEncounter from './SBoatEncounter.js'

export default class extends Scena2D {
  init() {
    this.cameraX = 0
    this.combat = new BoatCombat(this.session)
    this.player = new Boat(() => this.cameraX, this.session)
    this.player.postavi(platno.width / 3, platno.height / 2)
    this.obala = new Obala(() => this.cameraX)
    this.add(this.obala)
    this.addCombatant(this.player, 'partisan')
    this.encounter = new SBoatEncounter({ session: this.session, viewLeft: () => this.cameraX, target: this.player })
    this.addCombatant(this.encounter.boat, 'axis')
    this.bojaPozadine = '#000066'
  }

  addCombatant(actor, team) {
    this.combat.add(actor, team)
    this.add(actor)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.encounter.update()
    this.combat.beginFrame()
    super.update(dt, t)
    this.cameraX = this.player.x - platno.width / 3
    this.combat.resolve()
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
