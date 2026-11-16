import { isInside } from '/core/collision/rectangles.js'
import { createSound } from '/core/io/sound.js'

const mouse = {
  pressed: false,

  isOver(predmet) {
    return isInside(mouse, predmet)
  },

  pressedOver(predmet) {
    return mouse.pressed && mouse.isOver(predmet)
  },

  showCrosshair() {
    mouse.shotSound = createSound('pucanj.wav')
    document.body.addEventListener('click', mouse.fire)
    document.body.setAttribute('style', 'cursor:url(/assets/images/ui/nisan.png) 50 50, crosshair')
  },

  hideCrosshair() {
    mouse.shotSound = null
    document.body.removeEventListener('click', mouse.fire)
    document.body.setAttribute('style', 'cursor:auto')
  },

  fire() {
    if (mouse.shotSound.currentTime !== 0) mouse.shotSound.currentTime = 0
    mouse.shotSound.play()
  }
}

document.onmousemove = e => {
  mouse.x = e.pageX
  mouse.y = e.pageY
}
document.onmousedown = () => {
  mouse.pressed = true
}
document.onmouseup = () => {
  mouse.pressed = false
}

export default mouse
