import { icons } from '/core/io/icons.js'
import Scene2D from '/core/Scene2D.js'
import canvas2d from '/core/io/canvas2d.js'
import { Avionce, inputOptions } from './Avionce.js'
import { baseControls } from '/ui/Controls.js'
import { keys, attackLabels } from '/core/io/keys.js'
import PokretnaPozadina from './PokretnaPozadina.js'
import Pokretno from './Pokretno.js'
import Cloud2D from './Oblak.js'
import Baza from './Baza.js'
import Waves from './Waves.js'
import PowerUps from './PowerUps.js'
import { levels } from './levels.js'
import { currentStyleClasses } from '/ui/styles.js'
import Sound from '/core/io/audio/SoundSource.js'
import { settings } from './settings.js'
import { aircraft } from './aircraft.js'
import { assets } from '/config.js'

const { scrollSpeed: speed, clouds, landingTime, engineVolume } = settings

const customStartScreen = ({ container }) => /* html */`
  <div class="central-screen flex-column ${container}" id="start-screen">
    <p>Reach the Island of Vis</p>
    <h2>Choose your aircraft</h2>
    <div class="game-screen-select vis-aircraft-select">
      ${aircraft.map(plane => /* html */`
        <label data-paid>
          <input type="image" data-aircraft="${plane.id}" src="${assets.images}${plane.image}" alt="Fly ${plane.name}">
          <span>${plane.name}</span>
        </label>
      `).join('')}
    </div>
  </div>
`

export default class VisScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot', [keys.attack2.label]: 'loop', [keys.special.label]: 'bomb' },
      intro: 'Reach the Island of Vis',
      customStartScreen,
    })
  }

  init() {
    this.audioWorldOffset = { x: 0, y: 0 }
    this.backgroundColor = '#165a8d'
    this.oblaci = Array.from({ length: clouds }, () => new Cloud2D(speed))
    this.ostrvo = new Pokretno('nature/ostrvo.gif', { thrust: speed, scale: 2 })
    this.zdravlje = new Pokretno('items/zdravlje.png', { thrust: speed, scale: .66, faktorY: 10, shadow: true })
    // the plane starts at the bottom middle of the screen
    this.player = new Avionce({ session: this.session, startAt: plane => ({ x: canvas2d.width / 2, y: canvas2d.height - plane.height }) })
    this.player.hide()
    this.powerUps = new PowerUps({ scene: this, player: this.player })
    /** The stage being flown; each has its waves in `levels`. */
    this.stage = 0
    this.waves = this.wavesOf(this.stage)
    this.landing = false
    this.siren = { sounds: [new Sound('air-raid-siren.mp3', { profile: 'ambience' })] }
    this.audioChildren.push(this.siren)
    const okean = new PokretnaPozadina(speed, this.width)
    this.add(okean, this.zdravlje, this.ostrvo, this.player, ...this.oblaci)
    this.engineSound = new Sound('avion-mali.mp3', { volume: engineVolume, loop: true, profile: 'engine', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.engineSound)
  }

  /* the engine hums while the game runs */

  handleClick(e) {
    const id = e.target.dataset?.aircraft
    if (aircraft.some(plane => plane.id === id) && this.ui.screen === 'start') this.play(id)
  }

  prepare(id) {
    return this.player.selectAircraft(id)
  }

  start() {
    this.player.show()
    super.start()
    this.engineSound.setPlaying(true)
  }

  collectHealth() {
    if (!this.player.alive) return

    if (this.player.collidesWith(this.zdravlje)) {
      this.zdravlje.reset()
      this.player.powerUp('life')
    }
  }

  wavesOf(stage) {
    return new Waves({
      scene: this, player: this.player, schedule: levels[stage], onFormationDown: position => this.powerUps.drop(position),
    })
  }

  /** After the last stage the plane lands on Vis and wins; after the others at an airfield on the way. */
  landToBase() {
    this.landing = true
    if (this.baza) this.remove(this.baza)
    this.baza = new Baza({ speed })
    this.remove(this.ostrvo, this.zdravlje)
    this.add(this.baza)
    const last = this.stage === levels.length - 1
    this.session.gameplay.after(landingTime, () => last ? this.victory('You have successfully reached the island of Vis.') : this.takeOff())
  }

  /** The sirens wail as the enemy attacks the airfield, and the next stage begins with the takeoff. */
  takeOff() {
    this.siren.sounds[0].play()
    this.ui.showMessage('Sirens! The enemy is attacking the base!')
    this.stage++
    this.waves = this.wavesOf(this.stage)
    this.landing = false
    this.baza.leave()
    this.add(this.ostrvo, this.zdravlje)
  }

  /** The world keeps moving behind the end screen, but the rules stop: no new waves, power-ups or landing. */
  update(dt, t) {
    if (this.session.state === 'running') this.audioWorldOffset.y -= speed * dt
    super.update(dt, t)
    this.engineSound.setPlaying(this.player.alive)
    if (this.session.state !== 'running') return

    this.waves.update(dt)
    this.powerUps.update()
    this.collectHealth()

    if (this.player.zivoti <= 0) this.defeat()

    if (this.baza?.gone) {
      this.remove(this.baza)
      this.baza = null
    }
    if (this.waves.finished && !this.landing)
      this.landToBase()
  }

  sceneUI() {
    const hearts = icons.life.repeat(Math.max(0, this.player.zivoti))
    const bombs = icons.bomb.repeat(this.player.bombs)
    const loops = icons.loop.repeat(this.player.loopsLeft)
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
