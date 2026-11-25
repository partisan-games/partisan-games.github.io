import Sound from '/core/io/audio/SoundSource.js'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import imageReady from '/core/io/imageReady.js'
import TrenchSoldier, { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'
import Trench from '/core/objects/Trench.js'
import { sideProjection } from '/core/actor/projection.js'
import Health from '/core/gameplay/Health.js'
import AirAttack, { airAttack } from './AirAttack.js'
import Partisan from '/core/gameplay/bodies/soldiers/Partisan.js'
import PartisanSprite from '/core/actor/soldiers/PartisanSprite.js'

const DALJI_Y = window.innerHeight * 0.25
const BLIZI_Y = window.innerHeight * 0.5
/** How many pixels a metre is drawn in the near row of trenches; the far row is half as near. */
const pxPerMeter = 22
/** Seconds to hold the position: the Germans attack first, the Chetniks in the second half (owner's decision). */
const holdTime = 120
const chetniksAt = holdTime / 2

export default class NeretvaScene extends Scene2D {
  constructor() {
    super({ intro: 'Hold the enemy at all costs until the wounded are safe.', showControls: false,
      reportText: 'Neretva, March 1943\n\nThe partisan main force is trapped on the Neretva with four thousand wounded. Your task is to cover their evacuation.' })
  }

  init() {
    // The stationary gunner's world position is a model point, independent of the aim cursor.
    this.player = { position: { x: this.width * .5, y: this.height * .95 }, sounds: [] }
    this.player.shotSound = new Sound('pucanj.mp3', { profile: 'rifle', spatial: { getPosition: () => this.player.position } })
    this.player.sounds.push(this.player.shotSound)
    this.pogoci = 0
    this.rekord = 0
    this.health = new Health()
    this.preostaloVreme = holdTime
    this.ubrzano = false
    this.chetniks = this.army('cetnici')
    this.manTrenches(this.army('nemci'))
    const allyProjection = sideProjection({ pxPerMeter: 38, groundY: this.height * .94 })
    this.allies = [.2, .5, .8].map(across => {
      const body = new Partisan({ role: 'rear', x: this.width * across / 38, y: .9 })
      const view = new PartisanSprite(body, { projection: allyProjection })
      view.position.z = -3
      const cover = new Trench({ x: this.width * across, y: this.height * .94 - 15, scale: 1.5 })
      cover.position.z = -4
      this.add(body, view, cover)
      return body
    })
    // Ju 87s attack the crossing while the Germans hold the trenches
    this.airAttack = new AirAttack({ scene: this, projection: sideProjection({ pxPerMeter, groundY: BLIZI_Y }),
      onBomb: () => this.health.damage(airAttack.damage) })
    this.ucitajRekord()
    showCrosshair()
  }

  /** Each soldier has a body, its view and a separate scenery cover placed in front. */
  army(faction) {
    return {
      background: new Background(`background/neretva-1943-${faction}.png`),
      near: this.praviSvabe(10, sideProjection({ pxPerMeter, groundY: BLIZI_Y }), { scale: 1, faction }),
      far: this.praviSvabe(12, sideProjection({ pxPerMeter: pxPerMeter / 2, groundY: DALJI_Y }), { scale: .5, faction }),
    }
  }

  /** Puts an army in the trenches, in place of the one there. */
  manTrenches({ near, far, background }) {
    if (this.sveSvabe)
      this.remove(...this.sveSvabe.flatMap(({ body, view, cover }) => [body, view, cover]))

    const speedUp = this.ubrzano ? 2 : 1
    this.background = background
    this.bliziRovovi = near
    this.daljiRovovi = far
    this.sveSvabe = [...far, ...near]
    /** The chance per second that a hidden soldier of each row rises. */
    this.ucestalost = new Map([[far, .02 * speedUp], [near, .03 * speedUp]])
    this.add(...this.sveSvabe.flatMap(({ body, view, cover }) => [body, view, cover]))
  }

  imagesLoaded() {
    return Promise.all([super.imagesLoaded(), this.chetniks && imageReady(this.chetniks.background.image)])
  }

  /** Half way the Germans give way to the Chetniks. */
  bringChetniks() {
    if (!this.chetniks || this.preostaloVreme > chetniksAt) return
    this.manTrenches(this.chetniks)
    this.chetniks = null
    this.ui.showMessage('Chetniks are next')
  }

  /** `n` soldiers evenly along a row of trenches, which `projection` draws. */
  praviSvabe(n, projection, { faction, scale }) {
    const razmak = this.width / n
    const polaRazmaka = razmak / 2
    return Array.from({ length: n }, (_, i) => {
      const body = new TrenchSoldier(projection.toWorld({ x: i * razmak + polaRazmaka, y: projection.point({ x: 0, y: 0 }).y }))
      const view = new TrenchSoldierSprite(body, { faction, variant: i % 3, scale, projection, inTrench: true })
      const { x, y } = projection.point(body)
      const cover = new Trench({ x, y, scale })
      return { body, view, cover }
    })
  }

  /** Now and then a hidden soldier rises to fire; one who has just fallen waits until he lies in the trench. */
  podizi(dt) {
    for (const [rovovi, ucestalost] of this.ucestalost)
      for (const post of rovovi) {
        if (post.body.dead && post.body.stateTime >= trench.fallTime) {
          const previous = post.body
          post.body = new TrenchSoldier({ x: previous.x, y: previous.y, z: previous.z })
          post.view.body = post.body
          this.remove(previous)
          this.addBehind(post.body)
        }
        if (post.body.state === 'idle' && Math.random() < ucestalost * dt) post.body.setState('aim')
      }
  }

  /** Each soldier firing wears the defender down. */
  takeFire(dt) {
    for (const { body } of this.sveSvabe) if (body.state === 'attack') this.health.damage(trench.damage * dt)
  }

  handleClick(event) {
    if (this.session.state !== 'running' || this.ui.screen || this.ui.outro || this.energija <= 0) return
    if (event.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    this.player.shotSound.play()
    const aim = { x: event.pageX, y: event.pageY }
    if (this.airAttack.shoot(aim)) {
      this.pogoci++
      return
    }
    const ciljaniRovovi = (aim.y <= DALJI_Y) ? this.daljiRovovi : this.bliziRovovi
    this.proveriPogotke(ciljaniRovovi, aim)
  }

  get energija() {
    return this.health.current
  }

  /** Preserve this game's shot window at the trench opening, independently of the figure's art bounds. */
  proveriPogotke(rovovi, aim) {
    for (const { body, cover } of rovovi)
      if (body.standing && Math.abs(aim.x - cover.x) < cover.width / 2 && Math.abs(aim.y - cover.y) < cover.height / 2) {
        body.setState('dead')
        this.pogoci++
      }
  }

  smrt() {
    let poruka = 'You fell bravely. '
    if (this.pogoci > this.rekord) {
      poruka += `You killed ${this.pogoci} enemies. That’s a new record!`
      localStorage.setItem('svabeRekord', this.pogoci)
    }
    this.defeat(poruka)
  }

  ucitajRekord() {
    this.rekord = parseInt(localStorage.getItem('svabeRekord'))
    if (!this.rekord) this.rekord = 0
  }

  end() {
    super.end()
    hideCrosshair()
  }

  update(dt) {
    if (this.ui.outro || this.energija <= 0) return

    if (Math.ceil(this.preostaloVreme) < 1)
      return this.victory('You defended the position; the wounded have been saved.')

    this.preostaloVreme -= dt
    for (const body of this.allies) {
      body.aimAt(body.ahead(15))
      body.setState('attack')
    }

    super.update(dt)
    if (!this.ubrzano && this.preostaloVreme < 60) {
      for (const [rovovi, ucestalost] of this.ucestalost) this.ucestalost.set(rovovi, ucestalost * 2)
      this.ubrzano = true
    }
    this.takeFire(dt)
    this.airAttack.update(dt, Boolean(this.chetniks))
    this.bringChetniks()
    this.podizi(dt)
    if (this.energija <= 0) this.smrt()
  }

  sceneUI() {
    const energija = Math.round(this.energija)

    return /* html */`
    ${this.ui.scoreUI('Score', this.pogoci, 'Evacuation in', Math.ceil(this.preostaloVreme))}
    <progress class="progress top-right" value="${energija}" max='100'></progress>
    `
  }
}
