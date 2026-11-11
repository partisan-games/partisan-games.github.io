import { unutar } from '/core/utils/sudari.js'
import { createSound } from '/core/io/sound.js'

const mish = {
  stisnut: false,

  iznad(predmet) {
    return unutar(mish, predmet)
  },

  stisnutIznad(predmet) {
    return mish.stisnut && mish.iznad(predmet)
  },

  dodajNishan() {
    mish.pucanj = createSound('pucanj.wav')
    document.body.addEventListener('click', mish.pucaj)
    document.body.setAttribute('style', 'cursor:url(/assets/images/ui/nisan.png) 50 50, crosshair')
  },

  ukloniNishan() {
    mish.pucanj = null
    document.body.removeEventListener('click', mish.pucaj)
    document.body.setAttribute('style', 'cursor:auto')
  },

  pucaj() {
    if (mish.pucanj.currentTime !== 0) mish.pucanj.currentTime = 0
    mish.pucanj.play()
  }
}

document.onmousemove = e => {
  mish.x = e.pageX
  mish.y = e.pageY
}
document.onmousedown = () => {
  mish.stisnut = true
}
document.onmouseup = () => {
  mish.stisnut = false
}

export default mish
