import BufferedAudio from './BufferedAudio.js'
import StreamedAudio from './StreamedAudio.js'
import AudioCoordinates from './AudioCoordinates.js'
import SpatialAudio, { validateDistanceProfile, spatialSample } from './SpatialAudio.js'
import SoundEmitter from './SoundEmitter.js'
import { audioGroups, resolveAudioProfile, sampleAudioRange } from './audioProfiles.js'
import { automate } from './VoiceOutput.js'
import AmbientEmitter from './AmbientEmitter.js'

/** A scene's output and playback handles, independent of its drawable object tree. */
export default class AudioSession {
  constructor(engine, { getListener = null, coordinates = null } = {}) {
    this.engine = engine
    this.state = 'loading'
    this.disposed = false
    this.playbacks = new Set()
    this.emitters = new Set()
    this.ambiences = new Map()
    this.events = new Set()
    this.pausedEvents = new Set()
    this.preloads = new Map()
    this.output = null
    this.groups = new Map()
    this.groupLevels = { ...audioGroups }
    this.setSpatialContext({ getListener, coordinates })
  }

  hasSpatialSources() {
    for (const playback of this.playbacks) if (playback.spatialModel) return true
    for (const emitter of this.emitters) if (emitter.options.spatial) return true
    return false
  }

  setSpatialContext({ getListener = this.getListener, coordinates = this.coordinates } = {}) {
    if (getListener !== null && typeof getListener !== 'function') throw new TypeError('getListener must be a function')
    const hasSpatialSources = this.hasSpatialSources()
    if (coordinates !== this.coordinates && hasSpatialSources)
      throw new Error('The audio coordinate frame cannot change while spatial sources exist')
    if (!getListener && hasSpatialSources)
      throw new Error('Spatial sources still need their player listener')
    if (coordinates !== this.coordinates) this.coordinateFrame = coordinates ? new AudioCoordinates(coordinates) : null
    this.getListener = getListener
    this.coordinates = coordinates
  }

  /** Warm short owner events after unlock; no native voice is allocated and teardown cancels the request. */
  preload(file, variants = []) {
    if (this.disposed) return
    for (const source of [file, ...variants]) {
      const url = this.engine.url(source)
      if (this.preloads.has(url)) continue
      const controller = new AbortController()
      this.preloads.set(url, controller)
      this.engine.preload(url, { signal: controller.signal }).catch(() => {
        if (this.preloads.get(url) === controller) this.preloads.delete(url)
      })
    }
  }

  createPlayback(file, { stream = false, profile = null, spatial = null, afterFinish = false, beforeStart = false, steady = false, mixOffset = 0, variants = [], loop = false } = {}) {
    const resolvedProfile = resolveAudioProfile(profile, { stream })
    this.validateSource(spatial, resolvedProfile)
    if (!Array.isArray(variants)) throw new TypeError('Audio variants must be an array of asset paths')
    const files = [file, ...variants].map(path => this.engine.url(path))
    const selected = files.length === 1 ? files[0] : files[Math.floor(this.engine.random() * files.length)]
    const spatialModel = spatial === null ? null : new SpatialAudio(spatial, resolvedProfile, this.coordinateFrame)
    this.engine.budget.registerProfile(resolvedProfile)
    const Playback = stream ? StreamedAudio : BufferedAudio
    const playback = new Playback(this, selected, {
      loop, profile: resolvedProfile, spatial, spatialModel, afterFinish, beforeStart: Boolean(beforeStart), steady: Boolean(steady), mixOffset,
      variationVolume: sampleAudioRange(this.engine.random, resolvedProfile.volumeRange),
      playbackRate: sampleAudioRange(this.engine.random, resolvedProfile.pitchRange),
    })
    this.playbacks.add(playback)
    return playback
  }

  validateSource(spatial = null, profile = null) {
    if (this.disposed) throw new Error('The audio session has ended')
    if (spatial === null) return
    if (!this.getListener) throw new Error('A spatial sound needs its player listener')
    if (!this.coordinateFrame) throw new Error('A spatial sound needs its world coordinate frame')
    if (typeof spatial !== 'object') throw new TypeError('Invalid spatial source')
    const providers = ['position', 'getPosition', 'getArea'].filter(key => spatial[key] !== undefined)
    if (providers.length !== 1) throw new TypeError('A spatial sound needs exactly one position or area provider')
    for (const key of ['getPosition', 'getArea', 'getRevision'])
      if (spatial[key] !== undefined && typeof spatial[key] !== 'function') throw new TypeError(`${key} must be a function`)
    if (spatial.position !== undefined && (!spatial.position || typeof spatial.position !== 'object'))
      throw new TypeError('Invalid static source position')
    validateDistanceProfile(profile)
  }

  createEmitter(file, options = {}) {
    if (options.ambienceKey == null) {
      const emitter = new SoundEmitter(this, file, options)
      this.emitters.add(emitter)
      return emitter
    }
    if (options.stream) throw new TypeError('Shared ambience uses buffered recordings')
    const profile = resolveAudioProfile(options.profile)
    this.validateSource(options.spatial, profile)
    if (!options.loop || profile.group !== 'ambience') throw new TypeError('Shared ambience needs an ambient loop')
    return new AmbientEmitter(this, this.engine.url(file), { ...options, profile })
  }

  attachAmbience(owner) {
    const key = owner.options.ambienceKey
    const recording = JSON.stringify([owner.file, owner.options.variants ?? [], owner.options.profile, owner.afterFinish])
    let entry = this.ambiences.get(key)
    if (entry && (entry.recording !== recording || entry.spatial !== owner.options.spatial))
      throw new Error('An ambience key must identify the same recording, profile and physical area')
    if (!entry) {
      const emitter = new SoundEmitter(this, owner.file, owner.options)
      entry = { emitter, owners: new Set(), recording, spatial: owner.options.spatial }
      this.ambiences.set(key, entry)
      this.emitters.add(emitter)
    }
    entry.owners.add(owner)
    owner.entry = entry
  }

  /** Events become session-owned immediately; their point and loading deadline belong to this emission. */
  emit(file, { maxDelay = .1, follow = false, ...options } = {}) {
    if (!Number.isFinite(maxDelay) || maxDelay <= 0) throw new RangeError('An audio event needs a positive loading deadline')
    if (options.loop || options.stream) throw new TypeError('Audio events must be short one-shot recordings')
    if (this.disposed) return null
    const profile = resolveAudioProfile(options.profile)
    if (!this.allows(options.afterFinish, options.beforeStart && !options.spatial && profile.group === 'ui')) return null
    if (this.engine.context?.state !== 'running') return null
    let spatial = options.spatial ?? null
    let sample = null
    if (spatial) {
      this.validateSource(spatial, profile)
      if (spatial.getArea) throw new TypeError('An audio event needs an emission point, not a moving area')
      if (!follow) spatial = { position: { ...(spatial.position ?? spatial.getPosition()) } }
      const frame = this.coordinateFrame.frame()
      sample = spatialSample(frame.listener(this.getListener()), frame.position(spatial.position ?? spatial.getPosition()), profile, {}, frame.viewport)
    }
    const volume = options.volume ?? 1
    if (!this.engine.budget.acceptsEvent(this, profile, volume, sample)) return null
    const voice = this.createPlayback(file, { ...options, spatial, profile })
    voice.expiresAt = this.engine.context.currentTime + maxDelay
    voice.volume = volume
    this.events.add(voice)
    voice.addEventListener('ended', () => voice.dispose(), { once: true })
    voice.started = voice.play()
    voice.started.catch(() => voice.dispose())
    // A start the budget refuses settles before play() returns; the event is dropped at once.
    if (voice.paused) {
      voice.dispose()
      return null
    }
    return voice
  }

  releasePlayback(playback) {
    this.playbacks.delete(playback)
    this.events.delete(playback)
    this.pausedEvents.delete(playback)
  }

  expired(playback) {
    return playback.expiresAt != null && this.engine.context?.currentTime > playback.expiresAt
  }

  canStart(playback) {
    return this.canPlay(playback) && !this.expired(playback)
      && (!this.events.has(playback) || this.engine.context?.state === 'running')
  }

  /** Before start only nonspatial UI may play; after the result only sounds meant for it. */
  allows(afterFinish, beforeStart) {
    return !this.disposed && (this.state === 'running' || (this.state === 'finished' && Boolean(afterFinish))
      || (this.state === 'ready' && Boolean(beforeStart)))
  }

  canPlay(playback) {
    return this.allows(playback.afterFinish, playback.beforeStart && !playback.spatialModel && playback.profile.group === 'ui')
  }

  setState(state) {
    if (this.disposed) return
    if (this.state !== state)
      for (const playback of this.playbacks) playback.spatialModel?.resetMotion()
    this.state = state
    for (const playback of this.playbacks) {
      if (this.canPlay(playback)) continue
      if (this.events.has(playback)) {
        playback.resumeId = (playback.resumeId || 0) + 1
        if (state !== 'paused' || playback.expiresAt != null) {
          playback.dispose()
          continue
        }
        if (!playback.paused) this.pausedEvents.add(playback)
      }
      playback.pause()
    }
    for (const playback of this.pausedEvents) {
      if (!this.canPlay(playback)) continue
      this.pausedEvents.delete(playback)
      const resumeId = playback.resumeId = (playback.resumeId || 0) + 1
      playback.play().catch(() => {
        if (playback.resumeId === resumeId) playback.dispose()
      })
    }
  }

  get updating() {
    return !this.disposed && (this.state === 'running' || this.state === 'finished')
  }

  update(dt) {
    if (!this.updating) return
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid audio simulation step')
    for (const event of this.events) if (this.expired(event)) event.dispose()
    for (const playback of this.playbacks) playback.advanceVirtual(dt)
    this.updateSpatial(dt)
    for (const playback of this.playbacks) playback.reconcile()
    this.engine.budget.drain()
  }

  updateSpatial(dt) {
    if (!this.updating) return
    let frame = null, listener = null
    for (const source of this.playbacks) {
      if (!source.spatialModel || source.paused || !this.canPlay(source)) continue
      if (!frame) {
        frame = this.coordinateFrame.frame()
        listener = frame.listener(this.getListener())
      }
      source.spatialState = source.spatialModel.update(listener, frame, dt)
      source.applySpatial(source.spatialState, dt)
    }
  }

  preparePlayback(playback) {
    if (!playback.spatialModel) return
    const frame = this.coordinateFrame.frame()
    playback.spatialState = playback.spatialModel.update(frame.listener(this.getListener()), frame, 0)
  }

  setGroupVolume(group, value) {
    if (!Object.hasOwn(this.groupLevels, group) || !Number.isFinite(value) || value < 0 || value > 1)
      throw new RangeError('Invalid audio group volume')
    this.groupLevels[group] = value
    const node = this.groups.get(group)
    if (node) automate(node.gain, value, this.engine.context)
  }

  groupDestination(group, context) {
    if (this.groups.has(group)) return this.groups.get(group)
    const node = context.createGain()
    try {
      node.gain.value = this.groupLevels[group]
      node.connect(this.destination(context))
      this.groups.set(group, node)
      return node
    } catch (error) {
      node.disconnect()
      throw error
    }
  }

  destination(context) {
    if (this.disposed || this.engine.context !== context) throw new Error('The audio output is no longer available')
    if (!this.output) {
      this.output = context.createGain()
      this.output.connect(this.engine.mix)
    }
    return this.output
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const controller of this.preloads.values()) controller.abort()
    this.preloads.clear()
    for (const emitter of this.emitters) emitter.dispose()
    for (const entry of this.ambiences.values()) {
      for (const owner of entry.owners) {
        owner.entry = null
        owner.disposed = true
      }
      entry.owners.clear()
    }
    this.ambiences.clear()
    for (const playback of this.playbacks) playback.dispose()
    for (const node of this.groups.values()) node.disconnect()
    this.groups.clear()
    this.output?.disconnect()
    this.output = null
    this.engine.sessions.delete(this)
  }
}
