import Body from '../Body.js'

const states = {
  idle: {
    enter: shell => {
      shell.vx = shell.vy = shell.vz = 0
    },
  },
  flight: {
    update: shell => {
      if (shell.stateTime < shell.fuse) return
      shell.bursts++
      shell.onBurst(shell)
      shell.setState('idle')
    },
  },
}

/**
 * An anti-aircraft shell: out of play (`idle`) or flying straight on (`flight`) until its fuse bursts it, wherever
 * that is; `onBurst(shell)` deals the damage. It stays where it burst, and `bursts` counts its bursts for the view.
 */
export default class FlakShell extends Body {
  constructor({ onBurst = () => {}, ...rest } = {}) {
    super({ size: { length: .21, height: .21, width: .21 }, ...rest, states })
    this.onBurst = onBurst
    this.fuse = 0
    this.bursts = 0
  }

  get active() {
    return this.state !== 'idle'
  }

  /** Flies from `point` along `yaw` and `pitch` and bursts after `fuse` seconds. */
  launch(point, yaw, pitch, speed, fuse) {
    Object.assign(this, point)
    Object.assign(this, { yaw, pitch, fuse })
    const level = Math.cos(pitch) * speed
    this.vx = Math.cos(yaw) * level
    this.vy = Math.sin(pitch) * speed
    this.vz = -Math.sin(yaw) * level
    this.setState('idle')
    this.setState('flight')
  }
}
