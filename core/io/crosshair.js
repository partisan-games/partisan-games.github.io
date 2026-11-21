/** The gun sight the pointer becomes in a game where the player aims with it, and the plain pointer again after. */
export function showCrosshair() {
  document.body.style.cursor = 'url(/assets/images/ui/nisan.png) 50 50, crosshair'
}

export function hideCrosshair() {
  document.body.style.cursor = ''
}
