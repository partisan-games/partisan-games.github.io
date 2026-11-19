import { isInside } from '/core/collision/rectangles.js'

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
    if (event?.target?.closest?.('button')) return
    mouse.shotSound?.play()
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
