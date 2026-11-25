import { keyboard } from '/core/io/Keyboard.js'

const targetSrc = '/assets/images/ui/crosshair.png'

const style = `
  background-color: transparent;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  display: block;
`

let time = 0

export default class FPSRenderer extends HTMLCanvasElement {
  constructor({ weaponSrc = '/assets/images/ui/savo.png' } = {}) {
    super()
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.style = style
    document.body.appendChild(this)

    this.weaponSrc = weaponSrc
    this.weaponImg = new Image()
    this.targetImg = new Image()
    this.showTarget = true
  }

  connectedCallback() {
    window.addEventListener('resize', this.handleResize)
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize = () => {
    this.width = window.innerWidth
    this.height = window.innerHeight
  }

  get ctx() {
    return this.getContext('2d')
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }

  drawPain() {
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
  }

  /** A red arc round the crosshair the way a hit came from, at `angle` on the screen, as bright as its `strength`. */
  drawHitFrom(angle, strength) {
    const { ctx } = this
    const radius = Math.min(window.innerWidth, window.innerHeight) * .3
    ctx.strokeStyle = `rgba(220, 0, 0, ${.9 * strength})`
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.arc(window.innerWidth / 2, window.innerHeight / 2, radius, angle - .35, angle + .35)
    ctx.stroke()
  }

  drawWeapon(elapsedTime) {
    this.handleLoad(this.weaponImg, this.weaponSrc, 'drawWeaponOnLoad', elapsedTime)
  }

  drawTarget() {
    if (!this.showTarget) return
    this.handleLoad(this.targetImg, targetSrc, 'drawTargetOnLoad')
  }

  handleLoad(img, src, drawMethod, elapsedTime) {
    if (img.complete && img.naturalWidth) this[drawMethod](elapsedTime)
    else {
      img.onload = () => this[drawMethod](elapsedTime)
      img.src = src
    }
  }

  drawWeaponOnLoad(elapsedTime) {
    this.drawShake(this.weaponImg, elapsedTime, 0.51)
  }

  /** The crosshair stays still in the middle of the screen, where the shots go. */
  drawTargetOnLoad() {
    if (!this.showTarget) return
    const { targetImg: img } = this
    this.ctx.drawImage(img, (window.innerWidth - img.width) / 2, (window.innerHeight - img.height) / 2)
  }

  drawShake(img, elapsedTime = 1, xAlign = 0.5, yAlign = 1) {
    const shaking = keyboard.controlsPressed ? 6 : 1
    const shakeX = Math.cos(elapsedTime * 2) * shaking
    const shakeY = Math.sin(elapsedTime * 4) * shaking

    this.draw(img, xAlign, yAlign, shakeX, shakeY)
  }

  draw(img, xAlign = 0.5, yAlign = 1, shakeX = 0, shakeY = 0) {
    const x = window.innerWidth * xAlign - img.width * 0.5 + shakeX
    const y = window.innerHeight * yAlign - img.height + shakeY + 10 // korekcija
    this.ctx.drawImage(img, x, y)
  }

  render(elapsedTime = time += .016) {
    this.clear()
    if (this.weaponSrc) this.drawWeapon(elapsedTime)
    this.drawTarget()
  }
}

customElements.define('my-first-person', FPSRenderer, { extends: 'canvas' })
