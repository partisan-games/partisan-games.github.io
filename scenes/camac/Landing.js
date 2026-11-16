import canvas2d, { ctx } from '/core/io/canvas2d.js'
import GameObject2D from '/core/actor/GameObject2D.js'

/** A fictional landing site within the historical operation, not a mapped wartime pier. */
export default class Landing {
  constructor({ coast, session, player, viewLeft }) {
    this.coast = coast
    this.session = session
    this.player = player
    this.viewLeft = viewLeft
    this.x = player.startX + 6500
    this.position = { z: .5 }
    this.startedAt = null
    this.progress = 0
    this.complete = false
    this.passengerLayer = new GameObject2D('armies/game-ready/vojnici/partizan-odozgo.png', { z: -3, width: 24, height: 27 })
    this.passengerLayer.render = () => this.renderPassengers()
    this.uniforms = []
    this.passengerLayer.onload = () => {
      // Prepare uniform colors once; the cap and other sprite details stay intact.
      this.uniforms = [[101, 115, 73], [123, 128, 119], [119, 99, 75], [94, 110, 108]].map(color => {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 36
        const context = canvas.getContext('2d')
        context.drawImage(this.passengerLayer.image, 0, 0, 32, 36, 0, 0, 32, 36)
        const pixels = context.getImageData(0, 0, 32, 36)
        for (let offset = 0; offset < pixels.data.length; offset += 4) {
          if (pixels.data[offset] !== 101 || pixels.data[offset + 1] !== 115 || pixels.data[offset + 2] !== 73) continue
          pixels.data[offset] = color[0]
          pixels.data[offset + 1] = color[1]
          pixels.data[offset + 2] = color[2]
        }
        context.putImageData(pixels, 0, 0)
        return canvas
      })
    }
    this.passengers = Array.from({ length: 4 }, (_, index) => ({
      scale: .9 + Math.random() * .2,
      angle: (Math.random() - .5) * .35,
      seatedAngle: [-.8, .65, -1.65, 1.5][index] + (Math.random() - .5) * .4,
      offsetX: (Math.random() - .5) * 3,
      offsetY: (Math.random() - .5) * 3,
      stride: Math.random() * Math.PI * 2,
    }))
  }

  get shoreY() { return this.coast.edgeAt(this.x, -1) }
  get pierY() { return Math.min(canvas2d.height * .45, Math.max(115, this.shoreY + 85)) }
  get active() { return this.startedAt !== null }

  update() {
    if (this.session.state !== 'running' || this.complete) return
    const boat = this.player
    if (boat.dead) return
    if (!this.active) {
      if (boat.x < this.x - 85) return
      this.startedAt = this.session.clock.now
      this.approach = { x: boat.x, y: boat.y, angle: boat.angle }
      this.arrivalTime = Math.max(.8, Math.hypot(this.x - boat.x,
        this.pierY + boat.height / 2 + 8 - boat.y) / 200)
      boat.controlsLocked = true
      boat.stop()
    }
    const elapsed = this.session.clock.now - this.startedAt
    const arrival = Math.min(1, elapsed / this.arrivalTime)
    const eased = arrival * arrival * (3 - 2 * arrival)
    boat.x = this.approach.x + (this.x - this.approach.x) * eased
    boat.y = this.approach.y + (this.pierY + boat.height / 2 + 8 - this.approach.y) * eased
    const turn = Math.atan2(Math.sin(-this.approach.angle), Math.cos(-this.approach.angle))
    boat.angle = this.approach.angle + turn * eased
    this.progress = Math.min(1, Math.max(0, (elapsed - this.arrivalTime) / 3.6))
    this.complete = this.progress === 1
  }

  render() {
    if (this.x + 110 < this.viewLeft() || this.x - 110 > this.viewLeft() + canvas2d.width) return
    const shore = this.shoreY, end = this.pierY
    ctx.save()
    ctx.fillStyle = '#66513b'
    ctx.fillRect(this.x - 15, shore - 10, 30, end - shore + 10)
    ctx.fillRect(this.x - 100, end - 12, 200, 16)
    ctx.strokeStyle = '#ac9470'
    ctx.lineWidth = 2
    for (let y = shore; y < end - 12; y += 9) {
      ctx.beginPath()
      ctx.moveTo(this.x - 14, y)
      ctx.lineTo(this.x + 14, y)
      ctx.stroke()
    }
    ctx.fillStyle = '#302d27'
    for (const offset of [-90, -45, 45, 90]) ctx.fillRect(this.x + offset - 3, end - 15, 6, 22)
    ctx.restore()
  }

  renderPassengers() {
    if (!this.uniforms.length || !this.player.visible) return
    ctx.save()
    for (let i = 0; i < 4; i++) {
      const passenger = this.passengers[i]
      const progress = Math.min(1, Math.max(0, this.progress * 1.5 - i / 6))
      const boat = this.player
      const seatX = (i % 2 ? .075 : -.075) * boat.width + passenger.offsetX
      const seatY = (i < 2 ? -.17 : .17) * boat.height + passenger.offsetY
      const aboardX = boat.x + Math.cos(boat.angle) * seatX - Math.sin(boat.angle) * seatY
      const aboardY = boat.y + Math.sin(boat.angle) * seatX + Math.cos(boat.angle) * seatY
      const spread = Math.max(0, (progress - .85) / .15)
      const x = aboardX + (this.x - aboardX) * Math.min(1, progress * 3) + (i - 1.5) * 16 * spread
      const y = aboardY + (this.shoreY - 13 - aboardY) * progress
      const stride = Math.sin(progress * Math.PI * 18 + passenger.stride) * (progress > 0 && progress < 1 ? .6 : 0)
      ctx.save()
      ctx.translate(x + stride, y)
      // The source faces northwest; passengers face the bow aboard, then the shore.
      const aboardAngle = boat.angle + Math.PI * .75 + passenger.seatedAngle
      const turn = Math.atan2(Math.sin(Math.PI / 4 - aboardAngle), Math.cos(Math.PI / 4 - aboardAngle))
      ctx.rotate(aboardAngle + turn * Math.min(1, progress * 5) + passenger.angle)
      ctx.scale(passenger.scale, passenger.scale)
      ctx.drawImage(this.uniforms[i], -12, -13.5, 24, 27)
      ctx.restore()
    }
    ctx.restore()
  }
}
