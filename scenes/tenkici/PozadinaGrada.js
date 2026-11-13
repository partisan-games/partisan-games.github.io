import { assets } from '/config.js'

const sirina = 724
const visina = 543
const pozari = [
  { x: 176, y: 365, velicina: 1, faza: 0 },
  { x: 520, y: 241, velicina: .65, faza: 2.7 },
  { x: 604, y: 230, velicina: .4, faza: 5.1 },
]
const stuboviDima = [
  { izvor: 1, broj: 32, trajanje: 16, brzina: 18, vetar: 1.9, sirenje: 4.1, vijuganje: 5, seme: 1.3, nijansa: 36 },
  { izvor: 2, broj: 26, trajanje: 17, brzina: 16, vetar: 5.4, sirenje: 6.2, vijuganje: 11, seme: 4.7, nijansa: 45 },
]

export default class PozadinaGrada {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.slika = new Image()
    this.slika.src = `${assets.images}background/razrusen-grad-ww2-pixel.png`
    this.efekti = document.createElement('canvas')
    this.efekti.width = sirina
    this.efekti.height = visina
    this.crtez = this.efekti.getContext('2d')
    this.vreme = 0
  }

  update(dt) {
    this.vreme += dt
  }

  gustiDim(t, profil) {
    const ctx = this.crtez
    const izvor = pozari[profil.izvor]
    const { broj, trajanje, brzina, vetar, sirenje, vijuganje, seme, nijansa } = profil
    for (let i = 0; i < broj; i++) {
      const starost = (t + izvor.faza + i * trajanje / broj) % trajanje
      const nestajanje = Math.min(1, starost / .8, (trajanje - starost) / 3)
      const razvitak = Math.min(1, starost / 3)
      const x = izvor.x + starost * vetar
        + Math.sin(starost * .55 + seme) * vijuganje * razvitak
        + Math.sin(i * 2.3 + seme) * 3 * razvitak
      const y = izvor.y - 5 - starost * brzina
      const poluprecnik = (3 + Math.sqrt(starost) * sirenje)
        * (.85 + .2 * Math.sin(i * 1.7 + seme))
      const ton = nijansa + (i % 3) * 5
      ctx.fillStyle = `rgba(${ton}, ${ton - 1}, ${ton + 3}, ${nestajanje * .65})`
      // Unequal billows keep each column distinct instead of forming matching cones.
      ctx.beginPath()
      for (let deo = 0; deo < 5; deo++) {
        const ugao = deo * Math.PI * 2 / 5 + i * 2.1 + seme
        const cx = Math.round(x + Math.cos(ugao) * poluprecnik * .45)
        const cy = Math.round(y + Math.sin(ugao) * poluprecnik * .35)
        const r = Math.max(1, Math.round(poluprecnik * (.6 + .15 * Math.sin(deo * 2 + i + seme))))
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }

  dim(t) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of pozari) {
      ctx.save()
      ctx.translate(x, y - 5 * velicina)
      ctx.scale(velicina, velicina)
      // Each puff follows a continuous path and fades before its slot is reused.
      for (let i = 0; i < 24; i++) {
        const trajanje = 6 + (i % 3) * .6
        const starost = (t + faza + i * trajanje / 24) % trajanje
        const napredak = starost / trajanje
        const alpha = Math.sin(Math.PI * napredak) ** 2 * .15
        const centarX = starost * 2 + Math.sin(starost * .8 + i * 2.4) * starost * 1.1
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

  vatra(t) {
    const ctx = this.crtez
    for (const { x, y, velicina, faza } of pozari) {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(velicina, velicina)
      const vreme = t + faza
      // The base stays on the rubble; only the tips bend and change height.
      for (let i = -8; i <= 8; i++) {
        const visinaPlamena = (1 - Math.abs(i) / 12)
          * (13 + 4 * Math.sin(vreme * 5 + i * .7) + 3 * Math.sin(vreme * 8 - i))
        for (let h = 0; h < visinaPlamena; h++) {
          const otklon = Math.sin(vreme * 4 + h * .35 + i) * h * .12
          ctx.fillStyle = h < visinaPlamena * .3 ? '#f6c768'
            : h < visinaPlamena * .65 ? '#df8739' : '#aa4829'
          ctx.fillRect(i + Math.round(otklon), -h, 1, 1)
        }
      }
      ctx.restore()
    }
  }

  render(t = this.vreme) {
    const { ctx, canvas } = this
    if (!this.slika.complete || !this.slika.naturalWidth) return
    ctx.drawImage(this.slika, 0, 0, canvas.width, canvas.height)
    this.crtez.clearRect(0, 0, sirina, visina)
    for (const profil of stuboviDima) this.gustiDim(t, profil)
    this.dim(t)
    this.vatra(t)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.efekti, 0, 0, canvas.width, canvas.height)
    ctx.restore()
  }
}
