import { exitedRight } from '/core/utils/bounds.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import WoundedSoldier from '/core/actor/derived/WoundedSoldier.js'
import Patrol from '/core/actor/soldiers/Patrol.js'
import Strelica from './Strelica.js'
import Paljba from './Paljba.js'

const RITAM_PALJBE = 1500

export default class RanjenikScene extends Scene2D {
  constructor() {
    super({
      intro: 'You were wounded during the Battle of Sutjeska. Try to crawl out of the encirclement.',
    })
  }

  init() {
    this.sceneAudio.output.preload('explosion.mp3')
    this.scena = 0
    this.background = new Background('armies/shumarak-pozadina.png')
    this.player = new WoundedSoldier(this.width / 4, this.height / 2)
    this.patrola = new Patrol()
    this.patrola.setPosition(this.width * 3 / 4, this.height * 3 / 4)
    this.strelica = new Strelica()
    this.fireElapsed = 0
    this.pocetakPaljbe = 500
    this.add(this.player, this.patrola, this.strelica)
  }

  checkCollisions() {
    if (!this.patrola.collidesWith(this.player)) return

    this.patrola.setState('halt')
    this.defeat('You\'re caught. All hope is lost...')
  }

  proveriPobedu() {
    if (!exitedRight(this.player)) return

    if (this.scena === 0) this.promeniScenu()
    else this.pobedi()
  }

  pobedi() {
    this.patrola.vanish()
    this.background.image.src = '/assets/images/armies/shumarak-pozadina.png'
    this.remove(...this.children.filter(p => p instanceof Paljba))
    this.player.audioRevision = (this.player.audioRevision ?? 0) + 1
    this.player.x = 10
    this.victory('You\'ve made it to safety!')
  }

  promeniScenu() {
    this.background.image.src = '/assets/images/textures/sprzena-zemlja.jpg'
    this.patrola.setFaction('italian')
    this.patrola.setPosition(this.width * 3 / 4, this.height * 3 / 4)
    this.player.audioRevision = (this.player.audioRevision ?? 0) + 1
    this.player.x = 10
    this.scena++
  }

  launch() {
    if (this.fireElapsed * 1000 < RITAM_PALJBE) return

    const krater = new Paljba()
    this.addBehind(krater)
    this.fireElapsed = 0

    if (this.player.collidesWith(krater))
      this.defeat('You fell bravely while trying to escape.')
  }

  update(dt, t) {
    if (this.ui.outro) return
    super.update(dt, t)
    this.fireElapsed += dt
    this.checkCollisions()
    if (this.ui.outro) return
    this.proveriPobedu()
    if (this.scena === 1) this.launch()
  }
}
