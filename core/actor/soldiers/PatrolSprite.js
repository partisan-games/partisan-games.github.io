import LocomotionSprite from '/core/actor/LocomotionSprite.js'
import Sound from '/core/io/audio/SoundSource.js'
import art from '/core/actor/ranjenikArt.js'

const searchCalls = ['eatdirtpig.mp3', 'killthepig.mp3', 'QuicklyQuickly.mp3', 'schnell.mp3', 'UpThere.mp3', 'whereishe.mp3']
const foundCalls = ['Stop.mp3', 'StopStayWhereYouAre.mp3', 'thereheis.mp3']
/** Seconds between two calls of a searching patrol. */
export const calls = { every: 8 }

/**
 * How a patrol of the `faction` army ('german' or 'italian') looks and sounds from above: walking as it searches and
 * calling out every while, and calling that it has found someone when it halts. It only reads the body.
 */
export default class PatrolSprite extends LocomotionSprite {
  constructor(body, { faction = 'german', projection, camera }) {
    super(body, { art: art[`${faction}-patrol`], projection, camera })
    const speech = files => new Sound(`patrola/${files[0]}`, { variants: files.slice(1).map(file => `patrola/${file}`),
      profile: 'speech', follow: true, spatial: { getPosition: () => this.position } })
    this.searchVoice = speech(searchCalls)
    this.foundVoice = speech(foundCalls)
    this.sounds.push(this.searchVoice, this.foundVoice)
    this.sinceCall = 0
    this.seenState = body.state
  }

  /** One voice at a time. */
  call(voice) {
    if (!this.searchVoice.playing && !this.foundVoice.playing) voice.play()
  }

  update(dt) {
    super.update(dt)
    const { body } = this
    this.sinceCall += dt
    if (body.state === 'search' && this.sinceCall >= calls.every) {
      this.call(this.searchVoice)
      this.sinceCall = 0
    }
    if (body.state === 'halt' && this.seenState !== 'halt') this.call(this.foundVoice)
    this.seenState = body.state
  }

  end() {
    this.sounds.forEach(sound => sound.stop())
  }
}
