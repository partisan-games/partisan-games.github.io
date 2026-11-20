import { assets } from '/config.js'
import Sound from '/core/io/audio/SoundSource.js'

/** A smoke column over a burning spot, with its look; spots without their own column get this one. */
const defaultColumn = { broj: 26, trajanje: 16, speed: 16, vetar: 3, sirenje: 5, vijuganje: 8, nijansa: 40 }

/**
 * The places a battle can be fought in front of: a picture and where it burns. Fires and smoke columns are in the
 * pixels of the effects layer, half the picture's size; a fire's `velicina` is its strength. The flat strip of ground
 * is at 80 % of every picture's height, where the scenes stand their units.
 */
export const battlefields = {
  city: {
    src: 'background/razrusen-grad-ww2-pixel.png', width: 724, height: 543,
    pozari: [
      { x: 176, y: 365, velicina: 1, faza: 0 },
      { x: 520, y: 241, velicina: .65, faza: 2.7 },
      { x: 604, y: 230, velicina: .4, faza: 5.1 },
    ],
    stuboviDima: [
      { x: 520, y: 241, faza: 2.7, broj: 32, trajanje: 16, speed: 18, vetar: 1.9, sirenje: 4.1, vijuganje: 5, seme: 1.3, nijansa: 36 },
      { x: 604, y: 230, faza: 5.1, broj: 26, trajanje: 17, speed: 16, vetar: 5.4, sirenje: 6.2, vijuganje: 11, seme: 4.7, nijansa: 45 },
    ],
  },
  // from assets/images/sources/pozadine/backgrounds.json, its source pixels halved
  bihac: {
    src: 'background/bihac-ww2-pixel.png', width: 768, height: 512,
    pozari: [{ x: 85, y: 272, velicina: .55, faza: 0 }, { x: 705, y: 284, velicina: .6, faza: 2.7 }],
    stuboviDima: [{ x: 388, y: 249, faza: 1.2, seme: 1.3, ...defaultColumn }],
  },
  drvar: {
    src: 'background/drvar-ww2-pixel.png', width: 768, height: 512,
    pozari: [{ x: 117, y: 276, velicina: .6, faza: 0 }, { x: 697, y: 311, velicina: .4, faza: 3.1 }],
    stuboviDima: [{ x: 279, y: 313, faza: 1.9, seme: 2.2, ...defaultColumn }],
  },
  uzice: {
    src: 'background/uzice-ww2-pixel.png', width: 768, height: 512,
    pozari: [{ x: 670, y: 295, velicina: .6, faza: 0 }, { x: 500, y: 270, velicina: .3, faza: 4.2 }],
    stuboviDima: [{ x: 610, y: 254, faza: 2.4, seme: 3.6, ...defaultColumn }],
  },
}

/** A battlefield picture with its fires and smoke drawn live over it; the fire is heard from where it burns. */
export default class BattleBackground {
  constructor(canvas, place = battlefields.city) {
    const { width, height, pozari } = place
    const xs = pozari.map(fire => fire.x), ys = pozari.map(fire => fire.y)
    const area = () => ({
      min: { x: canvas.width * Math.min(...xs) / width, y: canvas.height * Math.min(...ys) / height },
      max: { x: canvas.width * Math.max(...xs) / width, y: canvas.height * Math.max(...ys) / height },
    })
    this.fireSound = new Sound('fire.mp3', { volume: .6, loop: true, profile: 'fire', ambienceKey: this, spatial: { getArea: area } })
    this.sounds = [this.fireSound]
    this.place = place
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.image = new Image()
    this.image.src = `${assets.images}${place.src}`
    this.efekti = document.createElement('canvas')
    this.efekti.width = width
    this.efekti.height = height
    this.crtez = this.efekti.getContext('2d')
    this.vreme = 0
    /** Whether the battlefield is shown, so its fire is heard. */
    this.active = true
  }

  update(dt) {
    this.vreme += dt
    this.fireSound.setPlaying(this.active)
  }

  gustiDim(t, profil, windSpeed) {
    const ctx = this.crtez
    const { x: izvorX, y: izvorY, faza, broj, trajanje, speed, vetar, sirenje, vijuganje, seme, nijansa } = profil
    for (let i = 0; i < broj; i++) {
      const starost = (t + faza + i * trajanje / broj) % trajanje
      const nestajanje = Math.min(1, starost / .8, (trajanje - starost) / 3)
      const razvitak = Math.min(1, starost / 3)
      const x = izvorX + starost * (windSpeed ?? vetar)
        + Math.sin(starost * .55 + seme) * vijuganje * razvitak
        + Math.sin(i * 2.3 + seme) * 3 * razvitak
      const y = izvorY - 5 - starost * speed
      const poluprecnik = (3 + Math.sqrt(starost) * sirenje)
        * (.85 + .2 * Math.sin(i * 1.7 + seme))
      const ton = nijansa + (i % 3) * 5
      ctx.fillStyle = `rgba(${ton}, ${ton - 1}, ${ton + 3}, ${nestajanje * .65})`
      // Unequal billows keep each column distinct instead of forming matching cones.
      ctx.beginPath()
      for (let deo = 0; deo < 5; deo++) {
        const angle = deo * Math.PI * 2 / 5 + i * 2.1 + seme
        const cx = Math.round(x + Math.cos(angle) * poluprecnik * .45)
        const cy = Math.round(y + Math.sin(angle) * poluprecnik * .35)
        const r = Math.max(1, Math.round(poluprecnik * (.6 + .15 * Math.sin(deo * 2 + i + seme))))
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }

  dim(t, windSpeed) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of this.place.pozari) {
      ctx.save()
      ctx.translate(x, y - 5 * velicina)
      ctx.scale(velicina, velicina)
      // Each puff follows a continuous path and fades before its slot is reused.
      for (let i = 0; i < 24; i++) {
        const trajanje = 6 + (i % 3) * .6
        const starost = (t + faza + i * trajanje / 24) % trajanje
        const napredak = starost / trajanje
        const alpha = Math.sin(Math.PI * napredak) ** 2 * .15
        const centarX = starost * (windSpeed === undefined ? 2 : windSpeed / velicina)
          + Math.sin(starost * .8 + i * 2.4) * starost * 1.1
        const centarY = -starost * 10
        const poluprecnik = 3 + starost * 2.7
        ctx.fillStyle = `rgba(76, 73, 71, ${alpha})`
        // Small overlapping pixel clusters, without a blurred or white halo.
        for (let red = -3; red <= 3; red++) {
          const polaSirine = Math.sqrt(1 - (red / 4) ** 2) * poluprecnik
          ctx.fillRect(
            Math.round(centarX - polaSirine),
            Math.round(centarY + red * poluprecnik / 4),
            Math.ceil(polaSirine * 2), Math.ceil(poluprecnik / 4)
          )
        }
      }
      ctx.restore()
    }
  }

  vatra(t, windSpeed = 0) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of this.place.pozari) {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(velicina, velicina)
      const vreme = t + faza
      // The base stays on the rubble; only the tips bend and change height.
      for (let i = -8; i <= 8; i++) {
        const visinaPlamena = (1 - Math.abs(i) / 12)
          * (13 + 4 * Math.sin(vreme * 5 + i * .7) + 3 * Math.sin(vreme * 8 - i))
        for (let h = 0; h < visinaPlamena; h++) {
          const otklon = Math.sin(vreme * 4 + h * .35 + i) * h * .12 + windSpeed / 60 * h
          ctx.fillStyle = h < visinaPlamena * .3 ? '#f6c768'
            : h < visinaPlamena * .65 ? '#df8739' : '#aa4829'
          ctx.fillRect(i + Math.round(otklon), -h, 1, 1)
        }
      }
      ctx.restore()
    }
  }

  render(t = this.vreme, windSpeed) {
    const { ctx, canvas } = this
    if (!this.image.complete || !this.image.naturalWidth) return
    ctx.save()
    ctx.filter = 'sepia(20%)'
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height)
    ctx.restore()
    this.crtez.clearRect(0, 0, this.efekti.width, this.efekti.height)
    for (const profil of this.place.stuboviDima) this.gustiDim(t, profil, windSpeed)
    this.dim(t, windSpeed)
    this.vatra(t, windSpeed)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.efekti, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  }
}
