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
import { after } from '/core/timers.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { settings } from './settings.js'

const { scrollSpeed: brzina, clouds, landingTime } = settings

export default class extends Scena2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot', [keys.attack2.label]: 'loop', [keys.special.label]: 'bomb' },
      intro: 'Reach the island of Vis.'
    })
  }

  init() {
    this.bojaPozadine = '#165a8d'
    this.oblaci = Array.from({ length: clouds }, () => new Oblak(brzina))
    this.ostrvo = new Pokretno('nature/ostrvo.gif', { potisak: brzina, skalar: 2 })
    this.zdravlje = new Pokretno('items/zdravlje.png', { potisak: brzina, skalar: .66, faktorY: 10, senka: true })
    this.player = new Avionce()
    this.powerUps = new PowerUps({ scene: this, player: this.player })
    this.waves = new Waves({
      scene: this, player: this.player, schedule: levels[0], onFormationDown: position => this.powerUps.drop(position),
    })
    const okean = new PokretnaPozadina(brzina, this.sirina)
    this.add(okean, this.zdravlje, this.ostrvo, this.player, ...this.oblaci)
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
    after(landingTime, () => this.victory('You have successfully reached the island of Vis.'))
  }

  update(dt, t) {
    super.update(dt, t)
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
