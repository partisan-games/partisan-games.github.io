import BattleBackground, { battlefields } from '/scenes/tenkici/BattleBackground.js'
import imageReady from '/core/io/imageReady.js'
import GroundLayer from './GroundLayer.js'

export const landscapeFilter = 'sepia(75%) saturate(65%)'

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
  }

  /** Moves the battle on to the next place; only the shown place burns and is heard. */
  nextRound() {
    this.place = this.places[nextPlace++ % this.places.length]
    for (const place of this.places) place.active = place === this.place
    this.update(0)
  }

  loaded() {
    return Promise.all([...this.places.map(place => imageReady(place.image, place.imageLoaded)), this.ground.loaded()])
  }

  update(dt) {
    this.time += dt
    for (const place of this.places) place.update(dt)
  }

  render() {
    const { place, ctx, canvas, wind } = this
    ctx.save()
    ctx.imageSmoothingEnabled = false
    place.render(this.time, wind ? wind.drift * place.efekti.width / canvas.width : undefined)
    ctx.filter = landscapeFilter
    this.ground.render(ctx)
    ctx.restore()
  }
}
