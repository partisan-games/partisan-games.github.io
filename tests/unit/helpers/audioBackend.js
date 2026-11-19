import { AudioEngine } from '/core/io/audio/AudioEngine.js'

/** A decoded clip shaped like an AudioBuffer; full-scale samples unless `level` says otherwise. */
const decoded = (duration, level = 1) => ({
  duration, numberOfChannels: 1, length: 1, getChannelData: () => Float32Array.of(level),
})

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

class RecordingParam {
  constructor(value = 1) {
    this.value = value
    this.targets = []
  }
  cancelScheduledValues() {}
  setValueAtTime(value) {
    this.value = value
  }
  setTargetAtTime(value) {
    this.value = value
    this.targets.push(value)
  }
  linearRampToValueAtTime(value) {
    this.value = value
    this.targets.push(value)
  }
}

class RecordingNode {
  constructor() {
    this.connections = new Set()
    this.gain = new RecordingParam()
    this.playbackRate = new RecordingParam()
  }
  connect(node) {
    this.connections.add(node)
  }
  disconnect() {
    this.connections.clear()
  }
  start(when, offset) {
    this.offset = offset
  }
  stop(when = 0) {
    this.stopped = true
    this.stopAt = when
  }
}

class RecordingContext {
  constructor() {
    this.state = 'suspended'
    this.currentTime = 0
    this.destination = {}
    this.sources = []
    this.mediaSources = []
    this.decodes = 0
    this.resumes = 0
    this.sampleRate = 48000
  }
  createGain() {
    return new RecordingNode()
  }
  createDynamicsCompressor() {
    const node = new RecordingNode()
    for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) node[key] = new RecordingParam()
    return node
  }
  createBiquadFilter() {
    const node = new RecordingNode()
    node.frequency = new RecordingParam(350)
    node.Q = new RecordingParam(0)
    return node
  }
  createStereoPanner() {
    const node = new RecordingNode()
    node.pan = new RecordingParam(0)
    return node
  }
  createBufferSource() {
    const node = new RecordingNode()
    this.sources.push(node)
    return node
  }
  createMediaElementSource(media) {
    const node = new RecordingNode()
    node.media = media
    this.mediaSources.push(node)
    return node
  }
  async decodeAudioData() {
    this.decodes++
    return decoded(10)
  }
  async resume() {
    this.resumes++
    this.state = 'running'
  }
  async close() {
    this.state = 'closed'
  }
}

class RecordingMedia extends EventTarget {
  constructor(src) {
    super()
    this.src = src
    this.currentTime = 0
    this.paused = true
    this.ended = false
    this.readyState = 1
    this.duration = 10
  }
  async play() {
    this.paused = false
  }
  pause() {
    this.paused = true
  }
  removeAttribute(name) {
    if (name === 'src') this.src = ''
  }
  load() {}
}

const response = () => ({ ok: true, arrayBuffer: async() => new ArrayBuffer(1) })

function finishFades(context) {
  for (const node of context.sources)
    if (node.stopAt > 0 && node.stopAt <= context.currentTime && node.onended) node.onended()
}

function fixture(options = {}) {
  const context = new RecordingContext()
  const stats = { contexts: 0, fetches: 0, media: [] }
  const engine = new AudioEngine({
    createContext: () => {
      stats.contexts++
      return context
    },
    fetchFile: async(...args) => {
      stats.fetches++
      return options.fetchFile ? options.fetchFile(...args) : response()
    },
    createMedia: url => {
      const media = new RecordingMedia(url)
      stats.media.push(media)
      return media
    },
  })
  return { engine, context, stats }
}

export { decoded, deferred, fixture, finishFades, response, RecordingContext, RecordingMedia }
