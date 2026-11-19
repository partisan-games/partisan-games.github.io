import { voiceLimits, mixHeadroom, screenMix } from './audioProfiles.js'

/** Critical sounds outrank every ordinary one, whatever their priority or distance. */
const criticalRank = 100000
/** A newcomer must outrank a playing voice by this much to replace it, so equal voices do not swap back and forth. */
const replaceMargin = .5

const distanceOf = voice => voice.spatialState?.distance ?? 0

/** Raises a source too quiet next to the player to the on-screen near level; silence stays silent. */
const screenMakeup = (fullLevel, target = screenMix.nearLevel) => fullLevel > 0 ? Math.max(1, target / fullLevel) : 1

/** Application-wide reservations include loading and fading sources, so no backend can overshoot the cap. */
export default class VoiceBudget {
  constructor(engine) {
    this.engine = engine
    this.active = new Map()
    this.waiting = new Set()
    this.draining = false
    this.profileCaps = new Map()
  }

  registerProfile(profile) {
    const previous = this.profileCaps.get(profile.budgetKey)
    if (previous !== undefined && previous !== profile.maxVoices) throw new Error('An audio budget key must have one consistent cap')
    this.profileCaps.set(profile.budgetKey, profile.maxVoices)
  }

  /** Linear level at the speaker for a full-scale recording: source, trim, distance, group, mix and master gains. */
  level(session, profile, volume, distanceFactor) {
    return volume * profile.trim * distanceFactor * session.groupLevels[profile.group] * mixHeadroom * (this.engine.volume ?? 1)
  }

  /**
   * Gain added to an on-screen source so that, next to the player, it is never quieter than `screenMix.nearLevel`;
   * a steady source only needs to reach `screenMix.floorLevel` where it is. `mixOffset` (dB) then tunes the sound.
   */
  makeup(voice) {
    const offset = 10 ** (voice.mixOffset / 20)
    const sample = voice.spatialState
    if (!sample?.screen) return offset
    const fullLevel = this.level(voice.session, voice.profile, voice.volume * voice.variationVolume, 1) * voice.loudness
    const floor = screenMakeup(fullLevel, screenMix.floorLevel * 10 ** (sample.distanceRatio * screenMix.span / 20))
    const raised = voice.steady ? floor : screenMakeup(fullLevel)
    // The offset tunes a sound within the mix, but never takes it below the audibility floor where it is.
    return Math.max(raised * offset, floor)
  }

  audibility(voice) {
    const sample = voice.spatialModel ? voice.spatialState : null
    // During a listener transition a playing voice is heard at its smoothed gain; otherwise judge where it is heading.
    const distanceFactor = !sample ? 1 : !voice.virtual && voice.spatialModel.transition ? sample.gain : sample.targetGain
    return this.level(voice.session, voice.profile, voice.volume * voice.variationVolume, distanceFactor) * voice.loudness
      * this.makeup(voice)
  }

  /** Hysteresis: a voice must be louder to start or return than a playing one may get before it is silenced. */
  isAudible(audibility, starting) {
    return audibility > (starting ? voiceLimits.enter : voiceLimits.leave)
  }

  audible(voice) {
    return this.isAudible(this.audibility(voice), !voice.isRunning())
  }

  rankOf(profile, audibility, distance) {
    return (profile.critical ? criticalRank : 0) + profile.priority * 100 + Math.min(1, audibility) * 10 + 10 / (1 + distance)
  }

  rank(voice) {
    return this.rankOf(voice.profile, this.audibility(voice), distanceOf(voice))
  }

  tally(profile) {
    let loops = 0, ordinary = 0, sameKey = 0
    for (const current of this.active.keys()) {
      if (current.loop) loops++
      if (!current.profile.critical) ordinary++
      if (current.profile.budgetKey === profile.budgetKey) sameKey++
    }
    return { loops, ordinary, sameKey }
  }

  hasRoom(profile, loop) {
    const { loops, ordinary, sameKey } = this.tally(profile)
    return this.active.size < voiceLimits.total && (!loop || loops < voiceLimits.loops)
      && (profile.critical || ordinary < voiceLimits.total - voiceLimits.reserved)
      && sameKey < profile.maxVoices
  }

  /** The weakest playing voice whose replacement would free the kind of slot the newcomer needs. */
  victimFor(profile, loop, rank) {
    const { loops, sameKey } = this.tally(profile)
    const needsLoop = loop && loops >= voiceLimits.loops
    const needsSameKey = sameKey >= profile.maxVoices
    let victim = null, victimRank = Infinity
    for (const current of this.active.keys()) {
      if (current.retiring || (needsLoop && !current.loop)) continue
      if (needsSameKey && current.profile.budgetKey !== profile.budgetKey) continue
      const currentRank = this.rank(current)
      if (rank > currentRank + replaceMargin && currentRank < victimRank) {
        victim = current
        victimRank = currentRank
      }
    }
    return victim
  }

  admits(profile, loop, audibility, distance, starting) {
    return this.isAudible(audibility, starting)
      && (this.hasRoom(profile, loop) || Boolean(this.victimFor(profile, loop, this.rankOf(profile, audibility, distance))))
  }

  accepts(voice) {
    return this.admits(voice.profile, voice.loop, this.audibility(voice), distanceOf(voice), !voice.isRunning())
  }

  /**
   * Checks a one-shot before anything is created for it, so a rejected burst leaves nothing behind.
   * Its recording may not be decoded yet, so it counts as full scale here; the voice checks again once loaded.
   */
  acceptsEvent(session, profile, volume, sample) {
    const makeup = sample?.screen ? screenMakeup(this.level(session, profile, volume, 1)) : 1
    const audibility = this.level(session, profile, volume, sample?.targetGain ?? 1) * makeup
    return this.admits(profile, false, audibility, sample?.distance ?? 0, true)
  }

  request(voice, signal) {
    if (signal.aborted || !this.audible(voice)) return null
    const existing = this.active.get(voice)
    if (existing) return existing
    const room = this.hasRoom(voice.profile, voice.loop)
    const victim = room ? null : this.victimFor(voice.profile, voice.loop, this.rank(voice))
    if (!room && !victim) return null
    const ticket = { voice, signal, granted: false }
    ticket.ready = new Promise(resolve => {
      ticket.resolve = resolve
    })
    ticket.abort = () => this.release(voice, ticket)
    signal.addEventListener('abort', ticket.abort, { once: true })
    if (victim) {
      this.waiting.add(ticket)
      victim.retire()
    } else this.grant(ticket)
    return ticket
  }

  grant(ticket) {
    this.waiting.delete(ticket)
    this.active.set(ticket.voice, ticket)
    ticket.granted = true
    ticket.resolve(true)
  }

  release(voice, ticket = this.active.get(voice)) {
    if (!ticket) return
    ticket.signal.removeEventListener('abort', ticket.abort)
    if (this.active.get(voice) === ticket) this.active.delete(voice)
    this.waiting.delete(ticket)
    ticket.resolve(false)
    this.drain()
  }

  drain() {
    if (this.draining) return
    this.draining = true
    try {
      for (const voice of this.active.keys())
        if (voice.retiring && Number.isFinite(voice.retireUntil) && this.engine.context.currentTime >= voice.retireUntil)
          voice.finishRetirement()
      while (this.waiting.size) {
        let best = null, bestRank = -Infinity
        for (const ticket of this.waiting) {
          const { voice } = ticket
          if (ticket.signal.aborted || !voice.session.canStart(voice) || !this.audible(voice)) {
            this.release(voice, ticket)
            continue
          }
          if (!this.hasRoom(voice.profile, voice.loop)) continue
          const rank = this.rank(voice)
          if (rank > bestRank) {
            best = ticket
            bestRank = rank
          }
        }
        if (!best) break
        this.grant(best)
      }
    } finally {
      this.draining = false
    }
  }
}
