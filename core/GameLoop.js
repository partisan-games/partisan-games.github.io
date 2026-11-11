export default class GameLoop {
  constructor(sceneLoop) {
    this.sceneLoop = sceneLoop
    this.lastTimestamp = 0
    this.time = 0
    this.loopId = null
    this.isPaused = this.timeStopped = false
  }

  get isRunning() {
    return this.loopId !== null
  }

  /* METHODS */

  start() {
    if (this.isRunning) return

    this.isPaused = this.timeStopped = false
    this.lastTimestamp = 0
    this.loopId = requestAnimationFrame(this.mainLoop)
  }

  stop() {
    if (!this.isRunning) return

    cancelAnimationFrame(this.loopId)
    this.isPaused = false
    this.loopId = null
    this.lastTimestamp = 0
    this.time = 0
  }

  pause() {
    if (!this.isRunning || this.isPaused) return

    this.isPaused = true
  }

  unpause() {
    if (!this.isRunning || !this.isPaused) return

    this.isPaused = false
    this.lastTimestamp = 0
  }

  stopTime() {
    this.timeStopped = true
  }

  /* LOOP */

  mainLoop = timestamp => {
    if (!this.isRunning) return
    if (!this.isPaused) this.tick(timestamp)
    if (this.isRunning) this.loopId = requestAnimationFrame(this.mainLoop)
  }

  tick(timestamp) {
    if (this.lastTimestamp === 0)
      this.lastTimestamp = timestamp

    const deltaTime = timestamp - this.lastTimestamp

    this.lastTimestamp = timestamp
    if (!this.timeStopped) this.time += deltaTime

    this.sceneLoop(deltaTime * 0.001, this.time * 0.001) // to seconds
  }
}
