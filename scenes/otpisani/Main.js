import { attackLabels } from '/core/io/keys.js'
import Sound from '/core/io/audio/SoundSource.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import Occupier from '/core/gameplay/bodies/soldiers/Occupier.js'
import FrontEnemySprite from '/core/actor/soldiers/FrontEnemySprite.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'
import enemyKinds from '/core/gameplay/frontEnemyKinds.js'
import { sideProjection } from '/core/actor/projection.js'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import { progresBar } from '/ui/components.js'
import Health from '/core/gameplay/Health.js'
import { randomInRange } from '/core/utils.js'

/** The Germans come in turn: the rifleman, the sentry and the full figure shared with Neretva. */
const lineup = ['rifleman', 'sentry', 'nemac']
/** The full figure stands 122 px of its picture; a man is 180 px here. */
const nemacScale = 180 / 122

export default class OtpisaniScene extends Scene2D {
  constructor() {
    super({
      controlKeys: { [attackLabels.pointer]: 'shoot' },
      intro: 'Kill all the occupiers!<br>Liberation is near.',
    })
  }

  init() {
    // The stationary gunner's world position is a model point, independent of the aim cursor.
    this.player = { position: { x: this.width * .5, y: this.height * .95 }, sounds: [] }
    this.player.shotSound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.player.shotSound)
    this.health = new Health()
    // the occupiers, 1.8 m tall, walk on the street at three quarters of the screen's height, their middle 90 px above it
    this.projection = sideProjection({ pxPerMeter: 100, groundY: this.height * .75 + 90 })
    this.background = new Background('background/beograd-1944-crno-belo.webp')
    this.audio = new Sound('otpisani.mp3', { stream: true, profile: 'music', loop: true })
    this.player.sounds.push(this.audio)
    this.spawnElapsed = 0
    this.spawned = 0
    /** The occupiers, `{ body, view }`. */
    this.occupiers = []
    /** How long each occupier still walking has walked, and how long he walks before he fires, in seconds. */
    this.walks = new Map()
    this.dodajNeprijatelja()
    showCrosshair()
    this.intervalIzlaska = 3000
    this.poeni = 0
  }

  /** An occupier comes in from either side and walks for a while before he fires. */
  dodajNeprijatelja() {
    const walkTime = randomInRange(.7, 3.2)
    const fromLeft = Math.random() > .5
    const kind = lineup[this.spawned++ % lineup.length]
    // the full figure stands with its feet on its point, the others with their middle
    const y = kind === 'nemac' ? this.height * .75 + 90 : this.height * .75
    const body = new Occupier({ ...this.projection.toWorld({ x: fromLeft ? 0 : this.width, y }),
      yaw: fromLeft ? 0 : Math.PI, initial: 'move', shotInterval: enemyKinds[kind]?.shotInterval })
    const view = kind === 'nemac'
      ? new TrenchSoldierSprite(body, { faction: 'nemci', scale: nemacScale, projection: this.projection })
      : new FrontEnemySprite(body, { kind, projection: this.projection })
    this.occupiers.push({ body, view })
    this.walks.set(body, { walked: 0, walkTime })
    this.add(body, view)
  }

  /** Sets each occupier who has walked his while to fire; a fallen one walks no more. */
  attack(dt) {
    for (const [occupier, walk] of this.walks)
      if (occupier.dead) this.walks.delete(occupier)
      else if ((walk.walked += dt) > walk.walkTime) {
        occupier.setState('attack')
        this.walks.delete(occupier)
      }

  }

  get energija() {
    return this.health.current
  }

  handleClick(e) {
    if (this.session.state !== 'running' || this.ui.screen || this.ui.ended || this.ui.outro) return
    if (e.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    this.player.shotSound.play()
    for (const { body, view } of this.occupiers) {
      const middle = view.inTrench === false ? view.y - view.height / 2 : view.y
      if (body.alive && Math.abs(e.pageX - view.x) < view.width / 2 && Math.abs(e.pageY - middle) < view.height / 2) {
        body.setState('dead')
        this.poeni++
      }
    }
    this.audio.setPlaying(true)
  }

  /** Each occupier firing wears the defender down. */
  takeFire(dt) {
    for (const { body } of this.occupiers) if (body.state === 'attack') this.health.damage(dt * 5)
  }

  end() {
    super.end()
    hideCrosshair()
    this.audio.stop()
  }

  update(dt, t) {
    if (this.ui.outro) return
    super.update(dt, t)
    this.takeFire(dt)
    this.attack(dt)

    this.spawnElapsed += dt
    if (this.spawnElapsed * 1000 > Math.max(this.intervalIzlaska, 500)) {
      this.dodajNeprijatelja()
      this.spawnElapsed = 0
    }
    this.intervalIzlaska -= dt * 100

    if (this.energija === 0) this.defeat()
  }

  sceneUI() {
    return /* html */`
      <div class="top-left">
        Score: ${this.poeni} <br>
      </div>
      <div class="top-right">
        ${progresBar(this.energija)}
      </div>
    `
  }
}
