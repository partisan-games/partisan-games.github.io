import { assets } from '/config.js'
import { iconImages } from './icons.js'

/** Half the sight's 48 px, where it points. */
const centre = 24

/** The gun sight the pointer becomes in a game where the player aims with it, and the plain pointer again after. */
export function showCrosshair() {
  document.body.style.cursor = `url(${assets.images}${iconImages.sight}) ${centre} ${centre}, crosshair`
}

export function hideCrosshair() {
  document.body.style.cursor = ''
}
