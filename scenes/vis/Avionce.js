import Player2D from '/core/actor/Player2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import platno from '/core/io/platno.js'
import { createSound } from '/core/io/sound.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'
import Bullet from './Bullet.js'
import Explosion from './Explosion.js'
import PlayerView from './PlayerView.js'
import { settings } from './settings.js'

const {
  lives, bombs, bombRadius, bombHits, bombBursts, bombSpread, respawnTime, shieldTime, loops, loop,
  reloadTime, bulletSpeed, fire,
} = settings.player

/** The plane fires on Space; on a phone, with its buttons. */
export const inputOptions = { attackKey: 'Space', buttonDict: { attack: '💥', attack2: '➰', special: '💣' } }

/** The player plane. Its reload, respawn and bomb bursts wait on the game `session`. */
export class Avionce extends Player2D {
  #fireLevel = 0

  constructor({ session }) {
    // vis was tuned on a 60 Hz screen, unlike the older games
    super('armies/partizani/avioni/spitfire-odozgo.png', { skalar: .5, zapaljiv: true, senka: true, tunedFps: 60, ...inputOptions })
    this.session = session
    this.brzina = 0
    this.poeni = 0
    this.zivoti = lives
    this.bombs = bombs
    this.specialHeld = this.attack2Held = false
    this.loopsLeft = loops
    this.loopAge = null // seconds into the loop, while it lasts
    this.shield = 0 // seconds of safety left after coming back
    this.ciljevi = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Bullet() })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: reloadTime, clock: session.clock }),
      barrels: fire[0],
      spawnProjectile: (origin, angle) => this.bullets.fire(origin, angle, bulletSpeed),
    })
    this.view = new PlayerView()
    this.explosions = Array.from({ length: bombBursts }, () => new Explosion()) // loaded before the first bomb
    this.predmeti.push(...this.explosions)
  }

  /** Which of settings.player.fire: the guns that fire together. */
  get fireLevel() {
    return this.#fireLevel
  }

  set fireLevel(level) {
    this.#fireLevel = level
    this.weapon.barrels = fire[level]
  }

  onload() {
    this.toStart()
  }

  toStart() {
    this.postavi(platno.width / 2, platno.height - this.visina)
  }

  get looping() {
    return this.loopAge !== null
  }

  /** Neither a bullet nor a crash takes a life: just after coming back, and during a loop. */
  get invulnerable() {
    return this.shield > 0 || this.looping
  }

  proveriGranice() {
    this.ogranici()
  }

  /** One bullet from every gun of the fire level; the reload goes by game time, so it waits in a pause. */
  puca() {
    this.weapon.tryFire({ x: this.x, y: this.y - this.visina / 4 }, Math.PI * 1.5)
  }

  powerUp(kind) {
    if (kind === 'fire') this.fireLevel = Math.min(this.fireLevel + 1, fire.length - 1)
    if (kind === 'bomb') this.bombs++
    if (kind === 'life') this.zivoti++
  }

  handleInput(dt) {
    super.handleInput(dt)
    if (this.input.special && !this.specialHeld) this.dropBomb()
    this.specialHeld = this.input.special
    if (this.input.attack2 && !this.attack2Held) this.startLoop()
    this.attack2Held = this.input.attack2
  }

  startLoop() {
    if (!this.loopsLeft || this.looping) return

    this.loopsLeft--
    this.loopAge = 0
  }

  /** The plane grows as it climbs, turns over on its back and comes down where it began, a little ahead and back. */
  flyLoop(dt) {
    const lift = progress => Math.sin(Math.PI * progress)
    const before = Math.min(this.loopAge / loop.duration, 1)
    this.loopAge += dt
    const progress = Math.min(this.loopAge / loop.duration, 1)

    this.scaleX = 1 + loop.grow * lift(progress)
    this.scaleY = this.scaleX * Math.cos(2 * Math.PI * progress) // 1, 0, -1 on its back, 0 and 1 again
    this.y -= loop.ahead * (lift(progress) - lift(before))
    if (progress === 1) this.loopAge = null
  }

  /** A heavy blow to everything around the player: fighters and heavy planes go down, the boss is hurt, enemy bullets are gone. */
  dropBomb() {
    if (!this.bombs) return

    this.bombs--
    createSound('explosion.mp3').play()
    const radius = bombRadius * Math.min(platno.width, platno.height)
    // whatever the fire touches, also just past the outermost burst
    const inBlast = thing => this.razmakDo(thing) < radius + Explosion.reach
    this.ciljevi
      .filter(plane => plane.alive && inBlast(plane))
      .forEach(plane => {
        plane.damage(bombHits)
        this.scoreIfDown(plane)
        this.explode(plane.x, plane.y)
      })
    this.ciljevi
      .flatMap(plane => plane.bullets.projectiles)
      .filter(bullet => bullet.vidljiv && inBlast(bullet))
      .forEach(bullet => bullet.reset())
    this.spreadBursts(radius)
  }

  /** Explosions at random places in the blast, a little apart in time. */
  spreadBursts(radius) {
    for (let i = 0; i < bombBursts; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = radius * Math.sqrt(Math.random()) // evenly over the circle, not crowded in the middle
      const x = this.x + Math.cos(angle) * distance
      const below = Math.sin(angle) * distance
      const y = this.y + (this.y + below > platno.height ? -below : below) // a burst under the screen's edge shows above instead
      this.session.presentation.after(Math.random() * bombSpread, () => this.explode(x, y))
    }
  }

  explode(x, y) {
    let explosion = this.explosions.find(burst => !burst.vidljiv)
    if (!explosion) {
      explosion = new Explosion()
      this.explosions.push(explosion)
      this.predmeti.push(explosion)
    }
    explosion.start(x, y)
  }

  /** Points count only while the game runs, not after its result. */
  scoreIfDown(plane) {
    if (plane.dead && this.session.state === 'running') this.poeni += plane.points
  }

  /** A bullet takes a life unless the plane is invulnerable. */
  reagujNaPogodak() {
    if (!this.invulnerable) this.umri()
  }

  /** A crash into an enemy plane takes a life and one hit of the enemy. */
  checkCrashes() {
    if (!this.alive || this.invulnerable) return

    const enemy = this.ciljevi.find(plane => plane.alive && this.sudara(plane))
    if (!enemy) return
    enemy.damage(1)
    this.umri()
  }

  /** The plane comes back at the bottom of the screen, safe for a while, with its loops. */
  reset() {
    this.alive = true
    this.scaleX = this.scaleY = 1
    this.stani()
    this.toStart()
    this.shield = shieldTime
    this.loopsLeft = loops
  }

  /** A lost life also takes away the fire power-ups. */
  umri() {
    this.alive = false
    this.loopAge = null
    this.fireLevel = 0
    this.pada = true
    this.zivoti--
    this.session.gameplay.after(respawnTime, () => {
      this.pada = false
      if (this.zivoti) this.reset()
    })
  }

  update(dt, t) {
    if (this.looping) this.flyLoop(dt)
    this.shield = Math.max(this.shield - dt, 0)
    this.view.update(dt)
    super.update(dt, t)
    this.bullets.checkHits(this.ciljevi, plane => this.scoreIfDown(plane))
    this.checkCrashes()

    if (this.pada)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }

  render() {
    this.view.render(this)
  }
}
