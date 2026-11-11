import State from '../State.js'

const ATTACK_INTERVAL = 3 // seconds

export default class AIAttackLoopState extends State {
  constructor(...args) {
    super(...args)
    this.onLoop = this.onLoop.bind(this)
    this.shouldFinishAttack = false
    this.sinceAttack = 0
  }

  enter(oldState, oldAction) {
    super.enter(oldState)
    this.actor.enterAttack()

    if (this.actor.anim) {
      if (this.action) this.transitFrom(oldAction, .25)
      this.actor.anim?.addEventListener('loop', this.onLoop)
    }
  }

  onLoop(e) {
    if (e.action === this.action) this.attackAgain() // the mixer reports every action, also the one fading out
  }

  attackAgain() {
    this.actor.enterAttack()

    if (this.shouldFinishAttack) {
      this.cleanup()
      this.actor.setState(this.prevOrIdle)
      this.shouldFinishAttack = false // reset to init value
    }
  }

  update(delta) {
    const { actor } = this

    if (actor.distanceToTarget > actor.attackDistance)
      this.shouldFinishAttack = true

    // without an animation loop to time the attacks, the game loop times them, so they stop with the game
    if (actor.anim) return
    this.sinceAttack += delta
    if (this.sinceAttack >= ATTACK_INTERVAL) {
      this.sinceAttack = 0
      this.attackAgain()
    }
  }

  cleanup() {
    this.actor.anim?.removeEventListener('loop', this.onLoop)
  }

  exit() {
    this.cleanup()
    if (this.actor.exitAttack) this.actor.exitAttack()
  }
}
