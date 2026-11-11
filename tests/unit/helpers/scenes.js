/** A stand-in for a scene module, recording what the SceneManager does with it. */
export function createSceneClass({ init = () => {}, pozadina, log = [] } = {}) {
  return class FakeScene {
    constructor() {
      this.pozadina = pozadina
      this.hasStartScreen = false
      log.push(this)
      this.ended = 0
      this.started = 0
    }

    init() {
      return init()
    }

    start() {
      this.started++
    }

    end() {
      this.ended++
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
