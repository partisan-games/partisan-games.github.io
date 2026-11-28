import BattleBackground, { battlefields } from '/scenes/tenkici/BattleBackground.js'
import imageReady from '/core/io/imageReady.js'
import GroundLayer from './GroundLayer.js'

export const landscapeFilter = 'sepia(12%) saturate(76%) brightness(92%)'

/** The places of the 1941 uprising on Sava Kovačević's path, one for each round (owner's decision). */
export const placeOrder = ['grahovo', 'vilusi', 'niksic']
/** The places go on in one sequence: the next round, and the next match, are fought on the next one. */
let nextPlace = 0

/** The background of each round, with the front layer of earth that shells cut into. */
export default class Battlefield {
  constructor({ canvas, groundY, wind, terrain }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.wind = wind
    this.time = 0
    this.places = placeOrder.map(id => new BattleBackground(canvas, battlefields[id], { groundY, pictureFilter: landscapeFilter }))
    this.audioChildren = this.places
    this.ground = new GroundLayer({ width: canvas.width, height: canvas.height, floorY: terrain.floorY, surface: terrain.surface })
    terrain.view = this.ground
    this.picture = document.createElement('canvas')
    this.showNextPlace()
  }

  /** The start screen previews the next place without advancing the sequence. */
  showNextPlace() {
    const next = this.places[nextPlace]
    if (this.place === next) return
    this.place = next
    this.pictureReady = false
    for (const place of this.places) place.active = place === this.place
    this.update(0)
  }

  /** Only a round that actually starts takes its place in the sequence. */
  startRound() {
    this.showNextPlace()
    nextPlace = (nextPlace + 1) % this.places.length
  }

  loaded() {
    return Promise.all([...this.places.map(place => imageReady(place.image, place.imageLoaded)), this.ground.loaded()])
  }

  update(dt) {
    this.time += dt
    for (const place of this.places) place.update(dt)
  }

  preparePicture() {
    const { place, picture, canvas } = this
    this.pictureReady = false
    if (place.scenery && [...place.scenery.images.values()].some(image => !image.complete || !image.naturalWidth)) return
    picture.width = canvas.width
    picture.height = canvas.height
    const ctx = picture.getContext('2d')
    ctx.imageSmoothingEnabled = false
    if (!place.renderPicture(this.time, ctx)) return
    // The far edge of the field meets the cutaway through a narrow band of earth and grass.
    const edge = place.groundY - 5
    const depth = this.ground.top + 3 - edge
    const contact = ctx.createLinearGradient(0, edge, 0, edge + depth)
    contact.addColorStop(0, 'rgba(105, 92, 57, 0)')
    contact.addColorStop(.28, 'rgba(105, 92, 57, .19)')
    contact.addColorStop(1, 'rgba(91, 78, 51, .62)')
    ctx.fillStyle = contact
    ctx.fillRect(0, edge, picture.width, depth)
    if (place.propCanvas) {
      place.propCanvas.width = place.propCanvas.height = 0
      place.propCanvas = null
    }
    this.pictureReady = true
  }

  render() {
    const { place, ctx, canvas, picture, wind } = this
    if (!this.pictureReady || picture.width !== canvas.width || picture.height !== canvas.height) this.preparePicture()
    ctx.save()
    ctx.imageSmoothingEnabled = false
    if (this.pictureReady) {
      ctx.drawImage(picture, 0, 0)
      place.renderEffects(this.time, wind ? wind.drift * place.efekti.width / canvas.width : undefined)
    }
    this.ground.render(ctx)
    ctx.restore()
  }

  dispose() {
    this.picture.width = this.picture.height = 0
    this.pictureReady = false
    this.ground.dispose()
  }
}
