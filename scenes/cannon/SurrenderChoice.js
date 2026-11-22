import { currentStyleClasses } from '/ui/styles.js'

/** The fort's surrender pauses combat until the player accepts it or continues the attack. */
export default class SurrenderChoice {
  constructor(scene) {
    this.scene = scene
    this.answer = null
  }

  get pending() {
    return this.answer === 'pending'
  }

  get rejected() {
    return this.answer === 'destroy'
  }

  get accepted() {
    return this.answer === 'accepted'
  }

  get ceasefire() {
    return this.scene.garrison.surrendered && !this.rejected
  }

  update() {
    const { scene } = this
    if (!scene.defenders.living) return
    if (scene.garrison.update(scene.defenders.living)) scene.flag.surrender()
    // A regular pause can coincide with the surrender; offer it after play resumes.
    if (scene.garrison.surrendered && scene.flag.whiteRaised) this.offer()
  }

  offer() {
    const { scene } = this
    if (this.answer || scene.ui.outro || scene.session.state !== 'running' || scene.player.dead || !scene.defenders.living) return
    this.answer = 'pending'
    scene.spaceHeld = false
    scene.power.reset()
    scene.gameLoop.pause()
    scene.session.pause()
    scene.syncSounds()
    this.show()
  }

  show() {
    const { container, button } = currentStyleClasses()
    this.scene.ui.showScreen('surrender', /* html */`
      <div class="central-screen flex-column ${container}">
        <h3>The garrison offers to surrender.</h3>
        <p>Accept the surrender or continue the attack?</p>
        <button class="${button}" id="accept-surrender">Accept surrender</button>
        <button class="${button}" id="reject-surrender">Continue attack</button>
      </div>
    `)
    // A held fire key must not activate either answer as the dialog appears.
    document.getElementById('modal').focus({ preventScroll: true })
  }

  resolve(accept) {
    const { scene } = this
    if (!this.pending || scene.ui.outro) return
    this.answer = accept ? 'accepted' : 'destroy'
    scene.spaceHeld = false
    scene.power.reset()
    if (accept) scene.defenders.surrender(scene.fortFront)
    scene.unpause()
  }
}
