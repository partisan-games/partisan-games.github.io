import Sound from '/core/io/audio/SoundSource.js'
import mouse from '/core/io/mouse.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import Svabo from './Svabo.js'
import Health from '/core/gameplay/Health.js'

const DALJI_Y = window.innerHeight * 0.25
const BLIZI_Y = window.innerHeight * 0.5

export default class NeretvaScene extends Scene2D {
  constructor() {
    super({ intro: 'Hold the enemy at all costs until the wounded are safe.', showControls: false })
  }

  init() {
    // The stationary gunner's world position is a model point, independent of the aim cursor.
    this.player = { position: { x: this.width * .5, y: this.height * .95 }, sounds: [] }
    this.player.shotSound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.player.shotSound)
    this.pogoci = 0
    this.rekord = 0
    this.health = new Health()
    this.preostaloVreme = 120
    this.ubrzano = false
    this.bliziRovovi = this.praviSvabe(10, BLIZI_Y, { scale: 1, callback: this.nanesiStetu.bind(this) })
    this.daljiRovovi = this.praviSvabe(12, DALJI_Y, { scale: .5, callback: this.nanesiStetu.bind(this) })
    this.sveSvabe = [...this.daljiRovovi, ...this.bliziRovovi]
    /** The chance per second that a hidden soldier of each row rises. */
    this.ucestalost = new Map([[this.daljiRovovi, .02], [this.bliziRovovi, .03]])
    this.add(...this.sveSvabe)
    this.background = new Background('textures/terrain/suva-trava.jpg')
    this.ucitajRekord()
    mouse.showCrosshair(this.player.shotSound)
  }

  praviSvabe(n, y, params) {
    const razmak = this.width / n
    const polaRazmaka = razmak / 2
    return Array.from({ length: n }, (_, i) => {
      const x = i * razmak + polaRazmaka
      const svabo = new Svabo({ ...params, faction: i % 2 ? 'cetnici' : 'nemci', variant: Math.floor(i / 2) % 3 })
      svabo.setPosition(x, y)
      return svabo
    })
  }

  /** Now and then a hidden soldier rises to fire; one who has just fallen waits until he lies in the trench. */
  podizi(dt) {
    for (const [rovovi, ucestalost] of this.ucestalost)
      for (const svabo of rovovi)
        if (svabo.state === 'hidden' && Math.random() < ucestalost * dt) svabo.setState('aim')
  }

  handleClick(event) {
    if (this.session.state !== 'running' || this.ui.screen || this.ui.outro || this.energija <= 0) return
    if (event.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    mouse.x = event.pageX
    mouse.y = event.pageY

    const ciljaniRovovi = (mouse.y <= DALJI_Y) ? this.daljiRovovi : this.bliziRovovi
    this.proveriPogotke(ciljaniRovovi)
  }

  nanesiStetu(damage, dt) {
    this.health.damage(damage * dt)
  }

  get energija() {
    return this.health.current
  }

  proveriPogotke(neretva) {
    for (let i = 0; i < neretva.length; i++)
      if (neretva[i].jePogodjen()) {
        neretva[i].setState('fall')
        this.pogoci++
      }
  }

  smrt() {
    let poruka = 'You fell bravely. '
    if (this.pogoci > this.rekord) {
      poruka += `You killed ${this.pogoci} occupiers. That’s a new record!`
      localStorage.setItem('svabeRekord', this.pogoci)
    }
    this.defeat(poruka)
  }

  ucitajRekord() {
    this.rekord = parseInt(localStorage.getItem('svabeRekord'))
    if (!this.rekord) this.rekord = 0
  }

  end() {
    super.end()
    mouse.hideCrosshair()
  }

  update(dt) {
    if (this.ui.outro || this.energija <= 0) return

    if (Math.ceil(this.preostaloVreme) < 1)
      return this.victory('You defended the position; the wounded have been saved.')

    this.preostaloVreme -= dt

    super.update(dt)
    this.podizi(dt)
    if (!this.ubrzano && this.preostaloVreme < 60) {
      for (const [rovovi, ucestalost] of this.ucestalost) this.ucestalost.set(rovovi, ucestalost * 2)
      this.ubrzano = true
    }
    if (this.energija <= 0) this.smrt()
  }

  sceneUI() {
    const energija = Math.round(this.energija)

    return /* html */`
    ${this.ui.scoreUI('Score', this.pogoci, 'Evacuation in', Math.ceil(this.preostaloVreme))}
    <progress class="progress top-right" value="${energija}" max='100'></progress>
    `
  }
}
