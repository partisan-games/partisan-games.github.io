import SeaMine, { seaMine } from '/core/gameplay/bodies/boats/SeaMine.js'
import SeaMineSprite from '/core/actor/boats/SeaMineSprite.js'

/** A few contact mines on open water; the same mine is targetable by the boat's gun. */
export default class Minefield {
  constructor({ scene, stage }) {
    this.scene = scene
    const { projection } = scene
    this.mines = []
    this.pending = [.32, .55, .76].map((part, index) => {
      const x = scene.startX + stage.length * part
      const z = (scene.canvas.height * (index % 2 ? .64 : .37)) / projection.pxPerMeter
      return { x: x / projection.pxPerMeter, z }
    })
  }

  update() {
    const { scene } = this
    const { player, projection } = scene
    if (player.dead) return
    const right = (scene.cameraX + scene.canvas.width + 200) / projection.pxPerMeter
    while (this.pending.length && this.pending[0].x <= right) {
      const body = new SeaMine(this.pending.shift())
      const view = new SeaMineSprite(body, { projection, camera: scene })
      const entry = { body, view }
      scene.enlist(entry, [])
      this.mines.push(entry)
    }
    for (const { body } of this.mines) {
      if (body.dead) continue
      const dx = body.x - player.x, dz = body.z - player.z
      const along = dx * Math.cos(player.yaw) - dz * Math.sin(player.yaw)
      const across = dx * Math.sin(player.yaw) + dz * Math.cos(player.yaw)
      if (Math.abs(along) < player.size.length / 2 + seaMine.radius && Math.abs(across) < player.size.width / 2 + seaMine.radius) {
        body.takeHit(body.health.current)
        player.takeHit(seaMine.damage)
      }
    }
  }

  clear() {
    for (const entry of this.mines)
      if (this.scene.enlisted.includes(entry)) this.scene.discharge(entry)
    this.mines = []
    this.pending = []
  }
}
