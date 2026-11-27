import { createTexturedBuilding, ruinFacadeFile } from '/core3d/city.js'

/** The fronts a town house can have, pictures on a box; the other sides show `back`. */
export const facades = {
  white: { name: 'Bela', file: 'buildings/kraljevo-pixel/building-front.webp' },
  green: { name: 'Zelena', file: 'buildings/kraljevo-pixel/building-green-front.webp' },
  blue: { name: 'Plava', file: 'buildings/kraljevo-pixel/building-blue-front.webp' },
  ruin: { name: 'Ruševina', file: ruinFacadeFile },
}
const back = 'buildings/kraljevo-pixel/building-back.webp'

/**
 * A box house with the `facade` picture on its front, `width` metres along it: standing on the ground at its middle,
 * its front toward +z.
 */
export default class FacadeHouse {
  constructor({ facade, width = 16, height = 12, depth = 10 } = {}) {
    // the pictures go +x, -x, top, +z
    const files = [null, null, null, facades[facade].file]
    this.mesh = createTexturedBuilding({ width, height, depth, y: 0, defaultFile: back, files, pixelArt: true })
    this.mesh.position.y = height / 2
  }
}
