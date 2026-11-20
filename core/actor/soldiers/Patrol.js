import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import LocomotionSprite from '/core/actor/LocomotionSprite.js'
import art from '/core/actor/ranjenikArt.js'
import Renderer2D from '/core/Renderer2D.js'

const zvuciTraganje = ['eatdirtpig.mp3', 'killthepig.mp3', 'QuicklyQuickly.mp3', 'schnell.mp3', 'UpThere.mp3', 'whereishe.mp3']
const zvuciNadjen = ['Stop.mp3', 'StopStayWhereYouAre.mp3', 'thereheis.mp3']

/**
 * A patrol's search: its pace in pixels per second, the seconds before it may turn again, and the seconds before it
 * calls out again.
 */
export const search = { speed: 90, turnTime: .3, talkTime: 8 }

/** The patrol searches, wandering and calling out, or halts and calls that it has found someone, until set to another. */
const states = {
  search: {
    enter: patrol => {
      patrol.speed = search.speed
    },
    update: patrol => {
      patrol.skreci()
      patrol.pricaj()
    },
  },
  halt: {
    enter: patrol => {
      patrol.stop()
      patrol.bodySprite?.idle()
      patrol.pustiNadjen()
    },
  },
}

/** A patrol seen from above, which wanders across the screen and comes back on the other side. */
export default class Patrol extends GameObject2D {
  constructor(src = 'armies/nemci-patrola.gif') {
    const sprite = src === 'armies/nemci-patrola.gif' ? art['german-patrol'] : src === 'armies/talijani-patrola.gif' ? art['italian-patrol'] : null
    super(sprite?.src || src, { width: sprite?.frame.width, height: sprite?.frame.height })
    this.bodySprite = sprite ? new LocomotionSprite(sprite) : null
    this.talkElapsed = 0
    this.turnElapsed = 0
    this.ended = false
    const speech = files => new Sound(`patrola/${files[0]}`, { variants: files.slice(1).map(file => `patrola/${file}`), profile: 'speech', follow: true, spatial: { getPosition: () => this.position } })
    this.searchVoice = speech(zvuciTraganje)
    this.foundVoice = speech(zvuciNadjen)
    this.sounds.push(this.searchVoice, this.foundVoice)
    this.zvuk = null
    this.machine = new StateMachine(this, states, 'search')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** Switch the complete view together when the route reaches another army's patrol. */
  setFaction(faction) {
    const sprite = art[`${faction}-patrol`]
    if (!sprite) throw new RangeError(`Unknown patrol faction: ${faction}`)
    this.bodySprite = new LocomotionSprite(sprite)
    this.width = sprite.frame.width
    this.height = sprite.frame.height
    this.setImage(sprite.src)
  }

  checkBounds() {
    this.wrapAround()
  }

  skreci() {
    if (this.turnElapsed < search.turnTime) return

    const nasumicno = Math.random() * Math.PI / 2 - Math.PI / 4
    this.turn(nasumicno)
    this.turnElapsed = 0
  }

  pustiNasumicno(zvuci) {
    if (this.ended) return
    if (this.zvuk?.playing) return

    this.zvuk = zvuci === zvuciTraganje ? this.searchVoice : this.foundVoice
    this.zvuk.play()
  }

  pricaj() {
    if (this.talkElapsed < search.talkTime) return
    this.pustiNasumicno(zvuciTraganje)
    this.talkElapsed = 0
  }

  pustiNadjen() {
    this.pustiNasumicno(zvuciNadjen)
  }

  update(dt) {
    super.update(dt)
    this.talkElapsed += dt
    this.turnElapsed += dt
    this.machine.update(dt)
    this.bodySprite?.update(dt, this.alive && this.state === 'search' && this.speed > .01)
  }

  render() {
    if (this.bodySprite) this.bodySprite.render(this)
    else Renderer2D.instance.drawObject(this)
  }

  end() {
    this.ended = true
    this.sounds.forEach(sound => sound.stop())
  }
}
