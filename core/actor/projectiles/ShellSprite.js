import GameObject2D from '/core/actor/GameObject2D.js'
import Sound from '/core/io/audio/SoundSource.js'

/** How a shell body looks and sounds: the shell in flight, and its small fire and bang when it bursts. */
export default class ShellSprite extends GameObject2D {
  constructor(shell, projection) {
    super('items/granata.gif', { scale: .5, visible: false })
    this.shell = shell
    this.projection = projection
    this.flightSound = new Sound('shell-flight.mp3', { volume: .45, loop: true, profile: 'flight', spatial: { getPosition: () => this.position } })
    this.explosionSound = new Sound('explosion.mp3', { volume: .9, profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.flightSound, this.explosionSound)
    this.smallFlame = new GameObject2D('plamen.gif', { scale: .4, visible: false })
    this.children.push(this.smallFlame)
    this.seenState = shell.state
  }

  update() {
    const { shell, projection } = this
    const { x, y } = projection.point(shell)
    this.setPosition(x, y)
    this.angle = projection.angle(shell.yaw, shell.pitch)
    this.visible = shell.state === 'flight'
    this.flightSound.setPlaying(this.visible)
    if (shell.state === 'burst' && this.seenState !== 'burst') {
      this.explosionSound.play()
      this.smallFlame.setPosition(x, y)
    }
    this.smallFlame.visible = shell.state === 'burst'
    this.seenState = shell.state
  }
}
