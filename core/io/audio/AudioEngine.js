import config, { assets } from '/config.js'
import AudioSession from './AudioSession.js'
import { createAudioRandom, mixHeadroom } from './audioProfiles.js'
import VoiceBudget from './VoiceBudget.js'

const cancelled = () => new DOMException('Audio request cancelled', 'AbortError')

/** RMS over all channels and samples: how loud the recording really is, measured once per decoded clip. */
function measureLoudness(buffer) {
  let sum = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++)
    for (const sample of buffer.getChannelData(channel)) sum += sample * sample
  const count = buffer.numberOfChannels * buffer.length
  return count ? Math.sqrt(sum / count) : 0
}

const waitForActivation = (promise, signal) => new Promise((resolve, reject) => {
  const abort = () => {
    signal?.removeEventListener('abort', abort)
    reject(cancelled())
  }
  signal?.addEventListener('abort', abort, { once: true })
  promise.then(value => {
    signal?.removeEventListener('abort', abort)
    resolve(value)
  }, error => {
    signal?.removeEventListener('abort', abort)
    reject(error)
  })
  if (signal?.aborted) abort()
})

/** One application context and decoded cache; constructing/importing it does not start audio. */
export class AudioEngine {
  constructor({
    random = createAudioRandom(),
    createContext = () => new AudioContext(),
    fetchFile = (...args) => fetch(...args),
    createMedia = url => {
      const media = new Audio()
      media.crossOrigin = 'anonymous'
      media.src = url
      return media
    },
  } = {}) {
    this.createContext = createContext
    this.random = random
    this.fetchFile = fetchFile
    this.createMedia = createMedia
    this.context = null
    this.master = null
    this.mix = null
    this.compressor = null
    this.activation = null
    this.buffers = new Map()
    this.loudness = new WeakMap()
    this.preloadQueue = []
    this.warming = false
    this.sessions = new Set()
    this.disposed = false
    this.budget = new VoiceBudget(this)
  }

  /** Call directly from a user gesture, never from a loader's completion callback. */
  async unlock() {
    if (this.disposed) throw cancelled()
    if (!this.context) {
      const context = this.createContext()
      let master, mix, compressor
      try {
        master = context.createGain()
        mix = context.createGain()
        mix.gain.value = mixHeadroom
        compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -3
        compressor.knee.value = 6
        compressor.ratio.value = 12
        compressor.attack.value = .003
        compressor.release.value = .12
        mix.connect(compressor)
        compressor.connect(master)
        master.connect(context.destination)
        this.context = context
        this.master = master
        this.mix = mix
        this.compressor = compressor
        this.syncVolume(true)
      } catch (error) {
        master?.disconnect()
        mix?.disconnect()
        compressor?.disconnect()
        this.context = this.master = this.mix = this.compressor = null
        context.close().catch(() => {})
        throw error
      }
    }
    const { context } = this
    if (context.state === 'running') {
      this.drainPreloads()
      return context
    }
    if (!this.activation) {
      const activation = {}
      activation.promise = new Promise((resolve, reject) => {
        activation.resolve = resolve
        activation.reject = reject
      })
      this.activation = activation
      activation.promise.then(() => {
        if (this.activation === activation) this.activation = null
      }, () => {
        if (this.activation === activation) this.activation = null
      })
    }
    const { activation } = this
    // A later real gesture must retry resume even if an earlier attempt is still pending.
    try {
      context.resume().then(() => {
        if (this.disposed || context.state !== 'running') activation.reject(cancelled())
        else {
          activation.resolve(context)
          this.drainPreloads()
        }
      }, error => activation.reject(error))
    } catch (error) {
      activation.reject(error)
    }
    return activation.promise
  }

  async whenUnlocked({ signal } = {}) {
    if (signal?.aborted) throw cancelled()
    if (this.disposed || !this.context) throw new Error('Audio must be unlocked by a user gesture')
    if (this.activation) await waitForActivation(this.activation.promise, signal)
    if (signal?.aborted) throw cancelled()
    if (this.disposed || this.context.state !== 'running') throw new Error('Audio requires another user gesture')
    return this.context
  }

  /** Queue background preparation before activation; only one warm-up fetch/decode runs at a time. */
  preload(file, { signal } = {}) {
    if (this.disposed || signal?.aborted) return Promise.reject(cancelled())
    return new Promise((resolve, reject) => {
      const job = { file, signal, resolve, reject }
      job.abort = () => {
        const index = this.preloadQueue.indexOf(job)
        if (index >= 0) this.preloadQueue.splice(index, 1)
        reject(cancelled())
      }
      signal?.addEventListener('abort', job.abort, { once: true })
      this.preloadQueue.push(job)
      this.drainPreloads()
    })
  }

  drainPreloads() {
    if (this.disposed || this.warming || this.context?.state !== 'running') return
    const job = this.preloadQueue.shift()
    if (!job) return
    this.warming = true
    this.load(job.file, { signal: job.signal }).then(job.resolve, job.reject).finally(() => {
      job.signal?.removeEventListener('abort', job.abort)
      this.warming = false
      this.drainPreloads()
    })
  }

  syncVolume(immediate = false) {
    if (!this.master || this.disposed) return
    const volume = Math.max(0, Math.min(1, config.volume))
    if (!immediate && volume === this.volume) return
    this.volume = volume
    if (immediate) this.master.gain.value = volume
    else this.master.gain.setTargetAtTime(volume, this.context.currentTime, .015)
  }

  url(file) {
    if (typeof file !== 'string' || !file.trim()) throw new TypeError('A sound needs an asset path')
    return new URL(file, new URL(assets.sounds, document.baseURI)).href
  }

  createSession(options) {
    if (this.disposed) throw cancelled()
    const session = new AudioSession(this, options)
    this.sessions.add(session)
    return session
  }

  async load(file, { signal } = {}) {
    if (signal?.aborted) throw cancelled()
    const context = await this.whenUnlocked({ signal })
    if (signal?.aborted) throw cancelled()
    const url = this.url(file)
    let entry = this.buffers.get(url)
    if (!entry) {
      entry = { controller: new AbortController(), users: 0, settled: false }
      this.buffers.set(url, entry)
      entry.promise = (async() => {
        const response = await this.fetchFile(url, { signal: entry.controller.signal })
        if (!response.ok) throw new Error(`Audio request failed (${response.status}): ${url}`)
        const bytes = await response.arrayBuffer()
        if (this.disposed || entry.controller.signal.aborted) throw cancelled()
        const buffer = await context.decodeAudioData(bytes)
        this.loudness.set(buffer, measureLoudness(buffer))
        return buffer
      })()
      entry.promise.then(() => {
        entry.settled = true
      }, () => {
        entry.settled = true
        if (this.buffers.get(url) === entry) this.buffers.delete(url)
      })
    }
    return new Promise((resolve, reject) => {
      entry.users++
      let released = false
      const release = () => {
        if (released) return
        released = true
        signal?.removeEventListener('abort', abort)
        entry.users--
        // One departing scene must not cancel a request still used by another.
        if (!entry.users && !entry.settled) {
          entry.controller.abort()
          if (this.buffers.get(url) === entry) this.buffers.delete(url)
        }
      }
      function abort() {
        release()
        reject(cancelled())
      }
      signal?.addEventListener('abort', abort, { once: true })
      entry.promise.then(buffer => {
        release()
        if (this.disposed || signal?.aborted) reject(cancelled())
        else resolve(buffer)
      }, error => {
        release()
        reject(error)
      })
      if (signal?.aborted) abort()
    })
  }

  loudnessOf(buffer) {
    return this.loudness.get(buffer) ?? 1
  }

  /** Scene teardown never closes the shared context; only application teardown does. */
  async dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const session of this.sessions) session.dispose()
    for (const job of this.preloadQueue.splice(0)) {
      job.signal?.removeEventListener('abort', job.abort)
      job.reject(cancelled())
    }
    for (const entry of this.buffers.values()) entry.controller.abort()
    this.buffers.clear()
    this.master?.disconnect()
    this.mix?.disconnect()
    this.compressor?.disconnect()
    if (this.context && this.context.state !== 'closed') await this.context.close()
  }
}

export default new AudioEngine()
