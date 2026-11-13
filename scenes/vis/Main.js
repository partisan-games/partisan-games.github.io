import Scena2D from '/core/Scena2D.js'
import { Avionce, inputOptions } from './Avionce.js'
import PokretnaPozadina from './PokretnaPozadina.js'
import Pokretno from './Pokretno.js'
import Oblak from './Oblak.js'
import Baza from './Baza.js'
import Waves from './Waves.js'
import PowerUps from './PowerUps.js'
import { levels } from './levels.js'
import { baseControls } from '/ui/Controls.js'
import { currentStyleClasses } from '/ui/styles.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { createSound } from '/core/io/sound.js'
import { settings } from './settings.js'
import { aircraft } from './aircraft.js'
import { assets } from '/config.js'

const { scrollSpeed: brzina, clouds, landingTime, engineVolume } = settings

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <p>Reach the island of Vis.</p>
    <h2>Choose your aircraft</h2>
    <div class="game-screen-select vis-aircraft-select">
      ${aircraft.map(plane => /* html */`
        <label>
          <input type="image" data-aircraft="${plane.id}" src="${assets.images}${plane.image}" alt="Fly ${plane.name}">
          <span>${plane.name}</span>
        </label>
      `).join('')}
    </div>
  </div>
`

export default class extends Scena2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot', [keys.attack2.label]: 'loop', [keys.special.label]: 'bomb' },
      intro: 'Reach the island of Vis.',
      customStartScreen,
    })
  }

  init() {
    this.bojaPozadine = '#165a8d'
    this.oblaci = Array.from({ length: clouds }, () => new Oblak(brzina))
    this.ostrvo = new Pokretno('nature/ostrvo.gif', { potisak: brzina, skalar: 2 })
    this.zdravlje = new Pokretno('items/zdravlje.png', { potisak: brzina, skalar: .66, faktorY: 10, senka: true })
    this.player = new Avionce({ session: this.session })
    this.player.sakrij()
    this.powerUps = new PowerUps({ scene: this, player: this.player })
    this.waves = new Waves({
      scene: this, player: this.player, schedule: levels[0], onFormationDown: position => this.powerUps.drop(position),
    })
    const okean = new PokretnaPozadina(brzina, this.sirina)
    this.add(okean, this.zdravlje, this.ostrvo, this.player, ...this.oblaci)
    this.engineSound = createSound('avion-mali.mp3', { volume: engineVolume })
    this.engineSound.loop = true
  }

  /* the engine hums while the game runs */

  async handleClick(e) {
    super.handleClick(e)
    const id = e.target.dataset?.aircraft
    if (!aircraft.some(plane => plane.id === id) || this.ui.screen !== 'start' || this.choosingPlane) return
    this.choosingPlane = true
    await this.player.selectAircraft(id)
    if (this.session.state === 'ready') this.start()
  }

  start() {
    this.player.pokazi()
    super.start()
    this.engineSound.play()
  }

  unpause() {
    super.unpause()
    this.engineSound.play()
  }

  pause() {
    super.pause()
    this.engineSound.pause()
  }

  finish() {
    super.finish()
    this.engineSound.pause()
  }

  end() {
    super.end()
    this.engineSound.pause()
  }

  collectHealth() {
    if (!this.player.alive) return

    if (this.player.sudara(this.zdravlje)) {
      this.zdravlje.reset()
      this.player.powerUp('life')
    }
  }

  landToBase() {
    this.baza = new Baza({ brzina })
    this.remove(this.ostrvo, this.zdravlje)
    this.add(this.baza)
    this.session.gameplay.after(landingTime, () => this.victory('You have successfully reached the island of Vis.'))
  }

  /** The world keeps moving behind the end screen, but the rules stop: no new waves, power-ups or landing. */
  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running') return

    this.waves.update(dt)
    this.powerUps.update()
    this.collectHealth()

    if (this.player.zivoti <= 0) this.defeat()

    if (this.waves.finished && !this.baza)
      this.landToBase()
  }

  sceneUI() {
    const hearts = '❤️'.repeat(Math.max(0, this.player.zivoti))
    const bombs = '💣'.repeat(this.player.bombs)
    const loops = '➰'.repeat(this.player.loopsLeft)
    return /* html */`
      <div class="top-left">
        <div>
          Score: ${this.player.poeni}
          <br>${hearts}
          <br>${bombs}
          <br>${loops}
        </div>
      </div>
      ${this.bossBar()}
      `
  }

  bossBar() {
    const { boss } = this.waves
    if (!boss?.alive) return ''
    return `<progress class="progress top-right ${currentStyleClasses().healthBar}" value="${boss.hitsLeft * 100}" max="100"></progress>`
  }
}
