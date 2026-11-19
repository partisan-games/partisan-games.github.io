import Scene2D from '/core/Scene2D.js'
import canvas2d from '/core/io/canvas2d.js'
import Boat from './Boat.js'
import Obala from './Obala.js'
import BoatCombat from './BoatCombat.js'
import SBoatEncounter from './SBoatEncounter.js'
import collideWithWreck from './wreckCollision.js'
import BoatCamera from './BoatCamera.js'
import ShoreDefenses from './ShoreDefenses.js'
import Landing from './Landing.js'
import WaterEffects from './WaterEffects.js'

export default class CamacScene extends Scene2D {
  constructor(options = {}) {
    super(options)
  }

  init() {
    this.cameraX = 0
    this.camera = new BoatCamera()
    this.combat = new BoatCombat(this.session, (x, y, target) =>
      this.waterEffects.hit(x, y, target === this.player || target === this.encounter.boat))
    const startX = this.camera.screenX(canvas2d.width, 0)
    this.player = new Boat(() => this.cameraX, this.session, startX)
    this.player.setPosition(startX, canvas2d.height / 2)
    this.obala = new Obala(() => this.cameraX)
    this.add(this.obala)
    this.waterEffects = new WaterEffects({ session: this.session, viewLeft: () => this.cameraX })
    this.audioChildren.push(this.waterEffects)
    this.add(...this.waterEffects.drawables)
    this.addCombatant(this.player, 'partisan')
    this.encounter = new SBoatEncounter({ session: this.session, viewLeft: () => this.cameraX, target: this.player })
    this.addCombatant(this.encounter.boat, 'axis')
    this.shoreDefenses = new ShoreDefenses({ coast: this.obala, session: this.session,
      viewLeft: () => this.cameraX, target: this.player })
    for (const post of this.shoreDefenses.positions) this.addCombatant(post, 'axis')
    this.landing = new Landing({ coast: this.obala, session: this.session,
      player: this.player, viewLeft: () => this.cameraX })
    this.add({ position: this.landing.position, render: () => this.landing.render() })
    this.add(this.landing.passengerLayer)
    this.backgroundColor = '#173f5a'
  }

  addCombatant(actor, team) {
    this.combat.add(actor, team)
    this.add(actor)
  }

  update(dt, t) {
    if (this.session.state !== 'running') return
    this.waterEffects.update(dt)
    if (this.landing.active) {
      this.landing.update()
      if (this.landing.complete) this.victory('Your troops have landed on Šolta.')
      return
    }
    this.shoreDefenses.update()
    const underShoreFire = this.shoreDefenses.positions.some(post =>
      post.alive && post.shown && (this.player.y - post.y) * post.side < 0)
    this.encounter.update({ allowSpawn: !underShoreFire && this.landing.x - this.player.x > 800 })
    const previousPlayer = { x: this.player.x, y: this.player.y }
    const previousWreck = { x: this.encounter.boat.x, y: this.encounter.boat.y }
    this.combat.beginFrame()
    super.update(dt, t)
    this.camera.update(dt, this.player.alive && this.player.input.up, this.player.x > this.player.startX)
    this.cameraX = this.camera.left(this.player.x, canvas2d.width, this.player.width || 0)
    this.combat.resolve()
    collideWithWreck(this.player, this.encounter.boat, previousPlayer, previousWreck)
    this.waterEffects.trail(this.player, previousPlayer, dt)
    this.waterEffects.trail(this.encounter.boat, previousWreck, dt)
    this.landing.update()
    this.cameraX = this.camera.left(this.player.x, canvas2d.width, this.player.width || 0)
    if (this.player.dead) this.defeat()
  }

  render() {
    const { cameraX, cameraY } = this.renderer
    this.renderer.cameraX = this.cameraX
    this.renderer.cameraY = 0
    try {
      super.render()
    } finally {
      // The renderer is shared with other scenes; camera ownership remains local.
      this.renderer.cameraX = cameraX
      this.renderer.cameraY = cameraY
    }
  }
}
