import GameObject2D from '/core/actor/GameObject2D.js'

/** The player's stand-in on the stage: unseen, as big as a plane, and never destroyed. */
export default class Target extends GameObject2D {
  constructor({ x = 0, y = 0, width = 200, height = 60 } = {}) {
    super(null, { x, y, width, height })
  }

  takeHit() {}
}
