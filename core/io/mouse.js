import { isInside } from '/core/collision/rectangles.js'
import { gameplayInputAllowed } from './inputContext.js'

const mouse = {
  pressed: false,

  isOver(predmet) {
    return isInside(mouse, predmet)
  },

  pressedOver(predmet) {
    return mouse.pressed && mouse.isOver(predmet)
  },

  showCrosshair(shotSound) {
    mouse.shotSound = shotSound
    document.body.addEventListener('click', mouse.fire)
    document.body.setAttribute('style', 'cursor:url(/assets/images/ui/nisan.png) 50 50, crosshair')
  },

  hideCrosshair() {
    mouse.shotSound = null
    document.body.removeEventListener('click', mouse.fire)
    document.body.setAttribute('style', 'cursor:auto')
  },

  fire(event) {
    if (!gameplayInputAllowed(event?.target)) return
    mouse.shotSound?.play()
  }
}

document.onmousemove = e => {
  mouse.x = e.pageX
  mouse.y = e.pageY
}
document.onmousedown = event => {
  mouse.pressed = gameplayInputAllowed(event.target)
}
document.onmouseup = () => {
  mouse.pressed = false
}

document.addEventListener('game-input-reset', () => { mouse.pressed = false })
document.addEventListener('pointercancel', () => { mouse.pressed = false })
document.addEventListener('visibilitychange', () => { mouse.pressed = false })
window.addEventListener('blur', () => { mouse.pressed = false })

export default mouse
