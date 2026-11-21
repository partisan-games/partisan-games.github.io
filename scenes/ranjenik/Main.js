import Scene2D from '/core/Scene2D.js'
import Input from '/core/io/Input.js'
import Background from '/core/objects/Background.js'
import { topProjection } from '/core/actor/projection.js'
import WoundedSoldier from '/core/gameplay/bodies/soldiers/WoundedSoldier.js'
import Patrol from '/core/gameplay/bodies/soldiers/Patrol.js'
import LocomotionSprite from '/core/actor/LocomotionSprite.js'
import PatrolSprite from '/core/actor/soldiers/PatrolSprite.js'
import TurnKeys from '/core/gameplay/controllers/TurnKeys.js'
import Wander from '/core/gameplay/controllers/Wander.js'
import art from '/core/actor/ranjenikArt.js'
import Strelica from './Strelica.js'
import Paljba from './Paljba.js'

const RITAM_PALJBE = 1500
/** How many pixels a metre of the wood is drawn. */
const pxPerMeter = 40

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
    this.projection = topProjection({ pxPerMeter })
    this.player = new WoundedSoldier(this.projection.toWorld({ x: this.width / 4, y: this.height / 2 }))
    this.playerView = new LocomotionSprite(this.player, { art: art.wounded, projection: this.projection })
    this.audioPlayer = () => this.playerView
    this.input = new Input()
    this.controllers.push(new TurnKeys(this.player, { input: this.input }))
    this.patrola = new Patrol(this.projection.toWorld({ x: this.width * 3 / 4, y: this.height * 3 / 4 }))
    this.patrolView = new PatrolSprite(this.patrola, { projection: this.projection })
    this.controllers.push(new Wander(this.patrola))
    this.strelica = new Strelica()
    this.fireElapsed = 0
    this.add(this.player, this.playerView, this.patrola, this.patrolView, this.strelica)
  }

  /** The screen box of a view, to tell when two pictures touch. */
  touch(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2
  }

  checkCollisions() {
    if (!this.touch(this.patrolView, this.playerView)) return
    this.patrola.setState('halt')
    this.defeat('You\'re caught. All hope is lost...')
  }

  /** The patrol searching the wood comes back on the other side of the screen. */
  wrapPatrol() {
    const { x, y } = this.projection.point(this.patrola)
    const { width } = this.patrolView
    const wrapped = { x, y }
    if (x < -width / 2) wrapped.x = this.width + width / 2
    if (x > this.width + width / 2) wrapped.x = 0
    if (y < 0) wrapped.y = this.height
    if (y > this.height) wrapped.y = 0
    Object.assign(this.patrola, this.projection.toWorld(wrapped))
  }

  /** He stays on the screen, top to bottom. */
  keepPlayerOnScreen() {
    const half = this.player.size.width / 2
    this.player.z = Math.min(this.height / pxPerMeter - half, Math.max(half, this.player.z))
  }

  /** He has crawled past the right of the screen. */
  get crawledOut() {
    return this.projection.point(this.player).x - this.playerView.width / 2 > this.width
  }

  proveriPobedu() {
    if (!this.crawledOut) return
    if (this.scena === 0) this.promeniScenu()
    else this.pobedi()
  }

  /** He comes back at the left, which the sound follows as a new place. */
  startOver() {
    this.player.x = 10 / pxPerMeter
    this.playerView.audioRevision = (this.playerView.audioRevision ?? 0) + 1
  }

  pobedi() {
    this.patrola.setState('halt')
    this.remove(this.patrolView)
    this.background.image.src = '/assets/images/armies/shumarak-pozadina.png'
    this.remove(...this.children.filter(p => p instanceof Paljba))
    this.startOver()
    this.victory('You\'ve made it to safety!')
  }

  promeniScenu() {
    this.background.image.src = '/assets/images/textures/sprzena-zemlja.jpg'
    this.remove(this.patrolView)
    this.patrolView = new PatrolSprite(this.patrola, { faction: 'italian', projection: this.projection })
    this.add(this.patrolView)
    Object.assign(this.patrola, this.projection.toWorld({ x: this.width * 3 / 4, y: this.height * 3 / 4 }))
    this.startOver()
    this.scena++
  }

  launch() {
    if (this.fireElapsed * 1000 < RITAM_PALJBE) return

    const krater = new Paljba()
    this.addBehind(krater)
    this.fireElapsed = 0

    if (this.touch(krater, this.playerView))
      this.defeat('You fell bravely while trying to escape.')
  }

  update(dt, t) {
    if (this.ui.outro) return
    super.update(dt, t)
    this.keepPlayerOnScreen()
    this.wrapPatrol()
    this.fireElapsed += dt
    this.checkCollisions()
    if (this.ui.outro) return
    this.proveriPobedu()
    if (this.scena === 1) this.launch()
  }

  end() {
    this.input?.end()
    super.end()
  }
}
