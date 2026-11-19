import canvas2d, { drawSky } from '/core/io/canvas2d.js'
import Scene2D from '/core/Scene2D.js'
import PlayerPlane from '/core/actor/derived/PlayerPlane.js'
import SideVehicle from '/core/actor/SideVehicle.js'
import Cloud2D from '/core/objects/Cloud2D.js'
import Bush from '/core/objects/Bush.js'
import Forest from '/core/objects/Forest.js'
import Recurring from '/core/objects/Recurring.js'
import { baseControls } from '/ui/Controls.js'
import { frames } from '/core/constants.js'

const groundLevel = canvas2d.height

const BROJ_OBLAKA = 3
const BROJ_ZBUNOVA = 10
const BROJ_SHUME = 10

const PARALAX_1 = -312
const PARALAX_2 = -187
const PARALAX_3 = -62
const PARALAX_4 = -32

const POTISAK = 5
const MIN_BRZINA = 200
const MAX_BRZINA = 600

const DIZAJ = 10
const MAX_DIGNUTOST = 5555

export default class FranjoKluzScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { ...baseControls, Enter: 'Shoot', V: 'Homing missile' },
    })
  }

  init() {
    this.brzinaScene = 0
    this.dignutostScene = 0
    this.audioWorldOffset = { x: 0, y: 0 }

    this.aerodrom = new Recurring({ src: 'buildings/aerodrom.png', groundY: groundLevel, probability: .25 })
    this.ruina = new Recurring({ src: 'buildings/ruina.png', groundY: groundLevel, x: -400 })
    this.player = new PlayerPlane(groundLevel, undefined, { session: this.session })
    this.vozilo = new SideVehicle('armies/hummel.png', { x: 150, y: groundLevel, scale: .75, session: this.session })

    this.player.solidBodies.push(this.vozilo, this.ruina)
    this.player.targets.push(this.vozilo)
    this.vozilo.targets.push(this.player)

    this.oblaci = Array.from({ length: BROJ_OBLAKA }, () => new Cloud2D())
    this.zbunovi = Array.from({ length: BROJ_ZBUNOVA }, () => new Bush())
    this.shume = Array.from({ length: BROJ_SHUME }, () => new Forest())

    this.add(this.aerodrom, this.player, this.ruina, this.vozilo, ...this.oblaci, ...this.zbunovi, ...this.shume)
    this.pocniParalax()
    this.ui.intro = 'Destroy the German tank and land safely!'
  }

  get ostaliPredmeti() {
    return this.children.filter(predmet => !predmet.tags.has('igrac') && !predmet.tags.has('raketa'))
  }

  pocniParalax() {
    this.zbunovi.forEach(zbun => {
      zbun.dx = PARALAX_1
    })
    this.ruina.dx = PARALAX_2
    this.aerodrom.dx = PARALAX_3
    this.shume.forEach(shuma => {
      shuma.dx = PARALAX_3
    })
    this.oblaci.forEach(oblak => {
      oblak.dx = PARALAX_4
    })
  }

  zaustaviParalax(dt) {
    const kocenje = 0.9 ** frames(dt)
    this.ostaliPredmeti
      .filter(predmet => !predmet.tags.has('neprijatelj'))
      .forEach(predmet => {
        predmet.dx *= kocenje
      })
    this.brzinaScene = 0
  }

  ubrzavaOstale(angle, pomak) {
    this.ostaliPredmeti.forEach(predmet => predmet.addForce(pomak, angle))
    this.brzinaScene += pomak
  }

  dizePredmete(pomak) {
    this.audioWorldOffset.y -= pomak
    this.ostaliPredmeti.forEach(predmet => {
      predmet.y += pomak
    })
    this.dignutostScene += pomak
  }

  proveriSmrt(dt) {
    if (this.vozilo.dead) this.vozilo.dx = PARALAX_1 - this.brzinaScene
    if (!this.player.dead) return

    if (this.dignutostScene > 0)
      this.dizePredmete(-DIZAJ * .5 * frames(dt))

    this.zaustaviParalax(dt)
    this.defeat('You fell gloriously.')
  }

  checkGround(dt) {
    if (this.player.isGrounded && this.dignutostScene <= 0) {
      this.zaustaviParalax(dt)
      if (this.player.alive && this.vozilo.dead) this.victory('Mission successfully completed!')
    }
  }

  clear() {
    drawSky(groundLevel + this.dignutostScene, 'blue', 'lightblue', this.dignutostScene)
  }

  handleInput(dt) {
    super.handleInput(dt)
    if (this.ui.outro || !this.player.alive) return

    const thrust = POTISAK * frames(dt)
    const dizanje = DIZAJ * frames(dt)

    if (this.player.input.right && this.brzinaScene < MAX_BRZINA)
      this.ubrzavaOstale(Math.PI, thrust)

    if (this.player.input.left && this.brzinaScene >= MIN_BRZINA)
      this.ubrzavaOstale(Math.PI, -thrust)

    if (this.player.input.up && this.dignutostScene - dizanje < MAX_DIGNUTOST) {
      if (this.player.y < this.height * 0.5)
        this.dizePredmete(dizanje)
      if (this.brzinaScene === 0) this.pocniParalax() // kada avion ponovo uzlece
    }

    if (this.player.input.down && this.dignutostScene - dizanje >= 0)
      this.dizePredmete(-dizanje * 2)
  }

  update(dt, t) {
    this.audioWorldOffset.x += this.brzinaScene * dt
    super.update(dt, t)
    this.vozilo.patrol()
    this.checkGround(dt)
    this.proveriSmrt(dt)
  }
}
