import { canvas2d } from '../io/canvas2d.js'
import { overlaps } from '../collision/rectangles.js'
import { anyOverlap } from '../collision/overlap.js'
import { shapesOf } from '../collision/shapes.js'
import {
  exitedBottom, exitedTop, exitedRight, exitedLeft, exitedLeftFully, exitedRightFully, offScreen
} from '/core/utils/bounds.js'
import Vector from '../Vector.js'
import { origins, FPS, frames } from '../constants.js'
import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'

export default class GameObject2D {
  #angle = 0

  constructor(src, {
    width, height, x = 200, y = 200, z = 0, scale = 1, speed = 0, flammable = false, origin = origins.center,
    flipY = 1, flipX = 1, scaleX = 1, scaleY = 1, shadow = false, debug = false, alive = true, smoky = false, visible = true,
    tunedFps = FPS,
  } = {}) {
    this.tunedFps = tunedFps // the frame rate its per-frame values, such as friction, were tuned at
    this.position = new Vector(x, y, z)
    if (src) this.loadImage(src, width, height, scale)
    else {
      this.width = width || 10
      this.height = height || 10
    }
    this.speed = speed
    this.sounds = []
    this.flammable = flammable
    this.origin = origin
    this.flipY = flipY
    this.flipX = flipX
    this.scaleX = scaleX
    this.scaleY = scaleY
    this.shadow = shadow
    this.debug = debug
    this.alive = alive
    this.smoky = smoky
    this.visible = visible
    this.tags = new Set()
    this.children = []
  }

  loadImage(src, width, height, scale) {
    this.width = width
    this.height = height
    this.image = new Image()
    this.imageLoaded = new Promise(resolve => {
      this.image.onload = () => {
        this.setSize(width, height, scale)
        this.onload()
        resolve(this.image)
      }
    })
    this.setImage(src)
  }

  onload() {} // for subclasses

  setImage(src) {
    this.image.src = assets.images + src
  }

  setSize = (width, height, scale) => {
    if (!width && !height) {
      this.width = this.image.naturalWidth * scale
      this.height = this.image.naturalHeight * scale
    } else if (width && !height)
      this.height = (width / this.image.naturalWidth) * this.image.naturalHeight
    else if (!width && height)
      this.width = (height / this.image.naturalHeight) * this.image.naturalWidth
  }

  get diagonal() {
    return Math.hypot(this.width, this.height)
  }

  get x() {
    return this.position.x
  }

  set x(val) {
    this.position.x = val
  }

  get y() {
    return this.position.y
  }

  set y(val) {
    this.position.y = val
  }

  setPosition(x, y, z) {
    this.position.set({ x, y, z })
  }

  placeOnGround(y) {
    this.y = y - this.height / 2
  }

  get angle() {
    return this.#angle
  }

  set angle(noviUgao) {
    this.#angle = (noviUgao + Math.PI * 2) % (Math.PI * 2)
  }

  turn(noviUgao) {
    this.angle = noviUgao
    this.speed = this.speed // points the movement along the new angle
  }

  angleTo(cilj) {
    return Math.atan2(cilj.y - this.y, cilj.x - this.x)
  }

  get speed() {
    return Math.hypot(this.dx, this.dy)
  }

  set speed(velicina) {
    this.dx = velicina * Math.cos(this.angle)
    this.dy = velicina * Math.sin(this.angle)
  }

  addForce(velicina, angle = this.angle) {
    this.dx += velicina * Math.cos(angle)
    this.dy += velicina * Math.sin(angle)
  }

  /** faktorTrenja is the share of speed lost per frame at tunedFps */
  applyFriction(frictionFactor = 0.1, dt = 1 / this.tunedFps) {
    const modifikator = (1 - frictionFactor) ** frames(dt, this.tunedFps)
    this.dx *= modifikator
    this.dy *= modifikator
  }

  stop() {
    this.speed = 0
  }

  get shown() {
    return this.visible && !this.offScreen
  }

  get dead() {
    return !this.alive
  }

  show() {
    this.visible = true
  }

  hide() {
    this.visible = false
  }

  vanish() {
    this.hide()
    this.stop()
  }

  die() {
    this.stop()
    this.alive = false
  }

  /** Objects without a collider keep the unturned rectangle; with one, its precise shapes count. */
  collidesWith(other) {
    if (!this.visible || !other.visible) return false
    if (!this.collider && !other.collider) return overlaps(this, other)
    return anyOverlap(shapesOf(this), shapesOf(other))
  }

  distanceTo(predmet) {
    return this.position.distanceTo(predmet.position)
  }

  get offScreen() {
    return offScreen(this)
  }

  checkBounds() {}

  wrapAround() {
    if (exitedLeftFully(this)) this.x = canvas2d.width + this.width / 2
    if (exitedRightFully(this)) this.x = 0
    if (exitedBottom(this)) this.y = 0
    if (exitedTop(this)) this.y = canvas2d.height
  }

  reenterFromRight(callback) {
    if (!exitedLeftFully(this)) return

    this.x = canvas2d.width + this.width / 2
    this.audioRevision = (this.audioRevision ?? 0) + 1
    if (callback) callback()
  }

  bounce() {
    if (exitedTop(this) || exitedBottom(this))
      this.turn(2 * Math.PI - this.angle)
    if (exitedLeft(this) || exitedRight(this))
      this.turn(Math.PI - this.angle)
  }

  keepOnScreen() {
    this.keepOnScreenHorizontally()
    this.keepOnScreenVertically()
  }

  keepOnScreenHorizontally() {
    const marginaLevo = this.width / 4
    const marginaDesno = canvas2d.width - marginaLevo
    if (this.x <= marginaLevo) this.x = marginaLevo
    if (this.x >= marginaDesno) this.x = marginaDesno
  }

  keepOnScreenVertically() {
    const marginaGore = this.height / 2
    const marginaDole = canvas2d.height - marginaGore
    if (this.y <= marginaGore) this.y = marginaGore
    if (this.y >= marginaDole) this.y = marginaDole
  }

  set flammable(bul) {
    if (bul) {
      if (!this.burnSound) {
        this.burnSound = new Sound('fire.mp3', { volume: .3, loop: true, profile: 'fire', spatial: { getPosition: () => this.position } })
        this.sounds.push(this.burnSound)
      }
      import('./Flame.js')
        .then(module => {
          this.flame = new module.default()
        })
    }
  }

  get flammable() {
    return Boolean(this.flame)
  }

  get burning() {
    return this.flammable && this.dead
  }

  log(name) {
    if (name && this.constructor.name !== name) return

    const x = this.x.toFixed()
    const y = this.y.toFixed()
    const width = this.width?.toFixed()
    const height = this.height?.toFixed()
    const dx = this.dx.toFixed()
    const dy = this.dy.toFixed()
    const speed = this.speed.toFixed()
    const angle = this.angle.toFixed(2)
    console.log(`${this.constructor.name} x: ${x}, y: ${y}, width: ${width}, height: ${height}, dx: ${dx}, dy: ${dy}, speed: ${speed}, angle: ${angle}, visible: ${this.visible}, alive: ${this.alive}`)
  }

  updateMovement(dt) {
    if (!this.dx && !this.dy) return

    this.x += this.dx * dt
    this.y += this.dy * dt
  }

  updateFlame(dt) {
    this.burnSound?.setPlaying(Boolean(this.burning && this.visible))
    if (!this.burning) return

    this.flame.x = this.x
    this.flame.y = this.y

    this.flame.update(dt)
  }

  update(dt) {
    if (dt === undefined) console.error(this.constructor.name, 'does not pass delta time.', dt)

    this.updateMovement(dt)
    this.checkBounds()
    this.updateFlame(dt)
  }
}
