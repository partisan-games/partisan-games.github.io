import Sound from '/core/io/audio/SoundSource.js'
import { showCrosshair, hideCrosshair } from '/core/io/crosshair.js'
import Scene2D from '/core/Scene2D.js'
import Background from '/core/objects/Background.js'
import imageReady from '/core/io/imageReady.js'
import TrenchSoldier, { trench } from '/core/gameplay/bodies/soldiers/TrenchSoldier.js'
import TrenchSoldierSprite from '/core/actor/soldiers/TrenchSoldierSprite.js'
import Cover from '/core/objects/Cover.js'
import { sideProjection } from '/core/actor/projection.js'
import Health from '/core/gameplay/Health.js'
import AirAttack, { airAttack } from './AirAttack.js'
import Battlefield from './Battlefield.js'
import BridgeCrossing from './BridgeCrossing.js'

const DALJI_Y = window.innerHeight * 0.25
const BLIZI_Y = window.innerHeight * 0.5
/**
 * How many pixels a metre is drawn in the near row of trenches; the far row is half as near, and the Ju 87 flies
 * nearer the defenders than the near row.
 */
const pxPerMeter = 22
const planePxPerMeter = 28
/** Seconds to hold the position: the Germans attack first, the Chetniks in the second half (owner's decision). */
const holdTime = 120
const chetniksAt = holdTime / 2
/**
 * Trenches dug by hand, not by a ruler: in groups of `group`, `close` apart within and `apart` between, in trench
 * widths roughly; the row bowed toward the player at its middle by `bow` px, each trench `rise` px forward or back;
 * scaled with the row's art, the same each game.
 */
const dug = { group: [2, 3], close: 1.15, apart: 1.8, bow: 24, rise: 8 }
/**
 * The chance per second that a hidden soldier of the far and the near row rises: the Chetniks, routed after the
 * crossing, half as often as the Germans (owner's decision); `calm` is how many seconds pass before the first rises.
 */
const armies = {
  nemci: { rises: { far: .02, near: .03 }, calm: 0, kind: 'trench' },
  cetnici: { rises: { far: .01, near: .015 }, calm: 3, kind: 'stones' },
}

/** A random number from 0 to 1 that repeats from its `seed`, so the trenches lie the same each game. */
function seeded(seed) {
  let state = seed
  return () => {
    state = Math.imul(1664525, state) + 1013904223 | 0
    return (state >>> 0) / 4294967296
  }
}

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
    this.chetniks = this.army('cetnici')
    this.crossing = new BridgeCrossing({ width: this.width, height: this.height })
    this.battlefield = new Battlefield()
    this.manTrenches(this.army('nemci'))
    // Ju 87s attack the crossing while the Germans hold the trenches
    const projection = sideProjection({ pxPerMeter: planePxPerMeter, groundY: BLIZI_Y })
    this.airAttack = new AirAttack({ scene: this, projection, onBomb: point => {
      this.health.damage(airAttack.damage)
      this.battlefield.impact(projection.point(point))
    } })
    this.ucitajRekord()
    showCrosshair()
  }

  /** Each soldier has a body, its view and a separate scenery cover placed in front. */
  army(faction) {
    const { kind, ...army } = armies[faction]
    return {
      ...army,
      background: new Background(`background/neretva-1943-${faction}.png`),
      near: this.praviSvabe(8, sideProjection({ pxPerMeter, groundY: BLIZI_Y }), { scale: 1, faction, kind }),
      far: this.praviSvabe(12, sideProjection({ pxPerMeter: pxPerMeter / 2, groundY: DALJI_Y }), { scale: .5, faction, kind }),
    }
  }

  /** Replaces the formation and its cover with the incoming army's. */
  manTrenches({ near, far, background, rises = {}, calm = 0 }) {
    if (this.sveSvabe)
      this.remove(...this.sveSvabe.flatMap(({ body, view, cover }) => [body, view, cover]))

    this.background = background
    this.bliziRovovi = near
    this.daljiRovovi = far
    this.sveSvabe = [...far, ...near]
    this.ucestalost = new Map([[far, rises.far], [near, rises.near]])
    this.calm = calm
    this.battlefield.setFormation(this.sveSvabe)
    this.add(...this.sveSvabe.flatMap(({ body, view, cover }) => [body, view, cover]))
  }

  imagesLoaded() {
    const chetniks = this.chetniks ? [this.chetniks.background,
      ...[...this.chetniks.near, ...this.chetniks.far].flatMap(({ view, cover }) => [view, cover])] : []
    const crossing = this.crossing ? [this.crossing.background, ...this.crossing.men.map(({ view }) => view)] : []
    return Promise.all([super.imagesLoaded(), imageReady(this.battlefield.crater),
      ...[...chetniks, ...crossing].map(object => imageReady(object.image, object.imageLoaded))])
  }

  clear() {
    super.clear()
    this.battlefield?.render(this.renderer.ctx, this.width, this.height)
  }

  /** Half way the Germans are beaten off and the partisans cross the river, where the Chetniks wait. */
  crossRiver() {
    if (!this.chetniks || this.crossing.shown || this.preostaloVreme > chetniksAt) return
    this.manTrenches({ near: [], far: [], background: this.crossing.background })
    this.airAttack.clear()
    this.crossing.show()
    this.add(...this.crossing.drawables)
    this.ui.showMessage('Position held. Our forces are crossing the Neretva.')
  }

  /** Once the crossing has been shown, the Chetniks take cover behind stones. */
  bringChetniks() {
    this.remove(...this.crossing.drawables)
    this.manTrenches(this.chetniks)
    this.chetniks = null
    this.crossing = null
    this.ui.showMessage('Chetniks are next')
  }

  /** `n` soldiers in a row across the screen, spaced as `dug` and drawn by `projection`. */
  praviSvabe(n, projection, { faction, scale, kind }) {
    const random = seeded(n * 1943)
    const { width } = this
    // steps from post to post: one within a group, `apart` between groups; then the whole row fitted to the width
    const steps = []
    for (let left = n - 1, size = 0; left > 0; left--) {
      size ||= dug.group[Math.floor(random() * dug.group.length)]
      steps.push(--size ? dug.close : dug.apart)
    }
    const unit = width / (steps.reduce((sum, step) => sum + step, 0) + 1)
    const ground = projection.point({ x: 0, y: 0 }).y
    let x = unit / 2
    return Array.from({ length: n }, (_, i) => {
      if (i) x += steps[i - 1] * unit
      const along = x / width
      const at = { x, y: ground + (dug.bow * 4 * along * (1 - along) + dug.rise * (random() * 2 - 1)) * scale }
      const body = new TrenchSoldier(projection.toWorld(at))
      const view = new TrenchSoldierSprite(body, { faction, variant: i % 3, scale, projection, inTrench: true })
      const cover = new Cover({ ...projection.point(body), scale, kind, flipY: i % 2 ? -1 : 1 })
      return { body, view, cover }
    })
  }

  /** Now and then a hidden soldier rises to fire; one who has just fallen waits until he lies in the trench. */
  podizi(dt) {
    this.calm = Math.max(0, this.calm - dt)
    for (const [rovovi, ucestalost] of this.ucestalost)
      for (const post of rovovi) {
        if (post.body.dead && post.body.stateTime >= trench.fallTime) {
          const previous = post.body
          post.body = new TrenchSoldier({ x: previous.x, y: previous.y, z: previous.z })
          post.view.body = post.body
          this.remove(previous)
          this.addBehind(post.body)
        }
        if (!this.calm && post.body.state === 'idle' && Math.random() < ucestalost * dt) post.body.setState('aim')
      }
  }

  /** Each soldier firing wears the defender down. */
  takeFire(dt) {
    for (const { body } of this.sveSvabe) if (body.state === 'attack') this.health.damage(trench.damage * dt)
  }

  handleClick(event) {
    if (this.session.state !== 'running' || this.ui.screen || this.ui.outro || this.energija <= 0) return
    if (this.crossing?.shown) return
    if (event.target.closest('button, input, select, a, #ui, #modal, dialog')) return
    this.player.shotSound.play()
    const aim = { x: event.pageX, y: event.pageY }
    if (this.airAttack.shoot(aim)) {
      this.pogoci++
      return
    }
    // the near row stands in front of the far one
    if (!this.proveriPogotke(this.bliziRovovi, aim)) this.proveriPogotke(this.daljiRovovi, aim)
  }

  get energija() {
    return this.health.current
  }

  /** Whether the aim hits a risen soldier at his trench's opening, the shot window, whatever the figure's art bounds. */
  proveriPogotke(rovovi, aim) {
    let hit = false
    for (const { body, cover } of rovovi)
      if (body.standing && Math.abs(aim.x - cover.x) < cover.width / 2 && Math.abs(aim.y - cover.y) < cover.height / 2) {
        body.setState('dead')
        this.pogoci++
        hit = true
      }
    return hit
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

    this.battlefield.update(dt)
    if (this.crossing?.shown) {
      super.update(dt)
      this.crossing.update(dt)
      if (this.crossing.done) this.bringChetniks()
      return
    }

    this.preostaloVreme -= dt

    super.update(dt)
    this.takeFire(dt)
    this.airAttack.update(dt, Boolean(this.chetniks))
    this.crossRiver()
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
