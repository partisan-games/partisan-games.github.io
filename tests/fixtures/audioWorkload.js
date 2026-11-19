import audioEngine from '/core/io/audio/AudioEngine.js'

const percentile = values => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * .95) - 1)]
}

/** Manual, isolated browser fixture. Importing it plays nothing and adds no UI or animation loop. */
export function createAudioWorkload({ engine = audioEngine, withAudio = true, loopFile = 'avion-mali.mp3', shotFile = 'cannon-shot.mp3' } = {}) {
  const player = { identity: 'audio-fixture', position: { x: 0, y: 0 } }
  const positions = Array.from({ length: 100 }, (_, i) => ({ x: 10 + i * 2, y: 0 }))
  const audioTimes = [], frameTimes = []
  let session = null, time = 0, frame = 0, peakNative = 0, peakReserved = 0
  return {
    // Call directly from an authorized real user gesture; use only while no game is active.
    async start() {
      if (!withAudio || session) return
      await engine.unlock()
      session = engine.createSession({ getListener: () => player, coordinates: { dimensions: 2, unitsPerAudioUnit: 1 } })
      session.setState('running')
      try {
        await Promise.all(positions.map(position => session.createPlayback(loopFile, {
          loop: true, profile: 'engine', spatial: { getPosition: () => position },
        }).play()))
      } catch (error) {
        session.dispose()
        session = null
        throw error
      }
    },
    step(dt, frameMs) {
      time += dt
      frame++
      player.position.x = Math.sin(time * .2) * 10
      positions.forEach((position, i) => { position.x = 10 + i * 2 + Math.sin(time + i) * 30 })
      const began = performance.now()
      if (session) {
        if (frame % 60 === 0) {
          for (let i = 0; i < 200; i++) session.emit(shotFile, { profile: 'rifle', spatial: { position: { x: i % 20 * 2 - 20, y: 0 } } })
          session.emit(shotFile, { profile: 'ui' })
        }
        session.update(dt)
      }
      const elapsed = performance.now() - began
      if (audioTimes.length < 3600) audioTimes.push(elapsed)
      if (Number.isFinite(frameMs) && frameTimes.length < 3600) frameTimes.push(frameMs)
      let native = 0
      for (const voice of engine.budget.active.keys()) if (voice.node && voice.processing) native++
      peakNative = Math.max(peakNative, native)
      peakReserved = Math.max(peakReserved, engine.budget.active.size)
    },
    pause() { session?.setState('paused') },
    resume() {
      if (!session) return
      session.setState('running')
      for (const voice of session.playbacks) if (voice.loop) voice.play().catch(() => {})
    },
    report() {
      return {
        withAudio, frames: frame, p95AudioJsMs: percentile(audioTimes), p95FrameMs: percentile(frameTimes),
        peakNative, peakReserved, activeReservations: engine.budget.active.size,
        pendingReservations: engine.budget.waiting.size, retainedClips: engine.buffers.size,
        note: 'Audio JS timing covers only synchronous step work. Async work, native DSP, memory bytes, device conditions and listening require separate evidence.',
      }
    },
    dispose() {
      session?.dispose()
      session = null
    },
  }
}
