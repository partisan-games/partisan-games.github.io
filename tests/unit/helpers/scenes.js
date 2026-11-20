import GameSession from '/core/runtime/GameSession.js'
import imageReady from '/core/io/imageReady.js'

/** A stand-in for a scene module, recording what the SceneManager does with it. */
export function createSceneClass({ init = () => {}, background, log = [] } = {}) {
  return class FakeScene {
    constructor() {
      this.session = new GameSession()
      this.background = background
      this.hasStartScreen = false
      // the router redraws the paid buttons of the open game when the pocket changes
      this.ui = { markPaid() {} }
      log.push(this)
      this.ended = 0
      this.started = 0
      this.paused = 0
    }

    pause() {
      this.paused++
    }

    init() {
      return init()
    }

    start() {
      this.started++
      this.session.start()
    }

    imagesLoaded() {
      return this.background?.image ? imageReady(this.background.image) : Promise.resolve()
    }

    end() {
      this.ended++
      this.session.dispose()
    }
  }
}

export const flush = () => new Promise(resolve => {
  setTimeout(resolve, 0)
})

/** Lets queued browser events (such as hashchange) and the scene start that follows them finish. */
export async function settle(rounds = 5) {
  for (let i = 0; i < rounds; i++) await flush()
}
