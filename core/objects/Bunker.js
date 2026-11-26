import GameObject2D from '/core/actor/GameObject2D.js'

export const houseBunkerPicture = 'game-ready/artiljerija/house-bunker-pixel.webp'
/** The size the house bunker is drawn at in the game Bunker, where its machine gunner keeps his own size. */
export const bunkerScale = .5
/** Where the machine gunner lies at the bunker's window, in pixels from its middle. */
export const gunnerWindow = { x: 60, y: 20 }

export default class Bunker extends GameObject2D {
  constructor({ x, y, scale = bunkerScale, flammable = true, imageFilter, ...rest } = {}) {
    // The prepared art has twice the source resolution, with the same display size.
    super(houseBunkerPicture, { x, y, z: -1, scale: scale / 2, flammable, ...rest })
    this.imageFilter = imageFilter
  }
}
