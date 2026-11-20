import { icons } from '/core/io/icons.js'
import { keys, attackLabels } from '/core/io/keys.js'
import { baseControls } from '/ui/Controls.js'
import Player2D from '/core/actor/Player2D.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import canvas2d from '/core/io/canvas2d.js'
import Sound from '/core/io/audio/SoundSource.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import Bullet from './Bullet.js'
import Explosion from '/core/actor/effects/Explosion.js'
import PlayerView from './PlayerView.js'
import { getAircraft } from './aircraft.js'
import { resetFlame } from './flame.js'

// the plane's look is tuned with the plane
export { look } from './PlayerView.js'

/** The numbers of the player plane. */
export const playerPlane = {
  lives: 3,
  bombs: 3,
  bombRadius: .5, // of the shorter side of the screen, where the bursts go off
  bombHits: 10, // a fighter or a heavy plane goes down, the boss loses a sixth
  bombBursts: 12, // explosions spread over the blast, besides one on every plane it hits
  bombSpread: .4, // seconds over which the bursts go off
  burstScale: 1.8, // a burst's size against its 128 px frame
  respawnTime: 2.5, // seconds
  shieldTime: 2, // seconds the plane cannot be hit after coming back
  loops: 3, // per life
  loop: { duration: 1, grow: .5, ahead: 60 }, // seconds; how much bigger and how many px ahead at the top of the loop
  reloadTime: .1, // seconds between shots
  bulletSpeed: 1000, // px per second
}

/** The guns of each fire level, from the start up: px across from the nose, radians off straight ahead. */
const fire = [
  [{ x: 0, angle: 0 }],
  [{ x: -12, angle: 0 }, { x: 12, angle: 0 }],
  [{ x: 0, angle: -.33 }, { x: 0, angle: 0 }, { x: 0, angle: .33 }],
]

/** The plane flies as its player steers it; set to fire, it also fires as often as it reloads. */
const states = {
  fly: {},
  fire: {
    update: plane => plane.shoot(),
  },
}

/** The plane fires on Space; on a phone, with its buttons. */
export const inputOptions = { attackKey: 'Space', buttonDict: { attack: icons.shoot, attack2: icons.loop, special: icons.bomb } }
/** The keys the controls list shows for the plane. */
export const controlKeys = { ...baseControls, [attackLabels[inputOptions.attackKey]]: 'shoot', [keys.attack2.label]: 'loop', [keys.special.label]: 'bomb' }

/**
 * The player plane. Its reload, respawn and bomb bursts wait on the game `session`. `startAt(plane)` gives where it
 * starts and comes back after a lost life, once its picture has loaded and its size is known; by default where it is made.
 */
export class Avionce extends Player2D {
  #fireLevel = 0

  constructor({ session, aircraftId = 'spitfire', x = 0, y = 0, startAt = () => ({ x, y }) }) {
    // vis was tuned on a 60 Hz screen, unlike the older games
    super(getAircraft(aircraftId).image, { scale: .5, flammable: true, shadow: true, tunedFps: 60, ...inputOptions })
    this.startAt = startAt
    this.bombSound = new Sound('explosion.mp3', { profile: 'explosion', spatial: { getPosition: () => this.position } })
    this.sounds.push(this.bombSound)
    this.aircraftId = aircraftId
    this.session = session
    this.speed = 0
    this.poeni = 0
    this.zivoti = playerPlane.lives
    this.bombs = playerPlane.bombs
    this.specialHeld = this.attack2Held = false
    this.loopsLeft = playerPlane.loops
    this.loopAge = null // seconds into the loop, while it lasts
    this.shield = 0 // seconds of safety left after coming back
    this.targets = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Bullet() })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: playerPlane.reloadTime, clock: session.clock }),
      barrels: fire[0],
      spawnProjectile: (origin, angle) => this.bullets.fire(origin, angle, playerPlane.bulletSpeed),
    })
    this.view = new PlayerView()
    this.explosions = Array.from({ length: playerPlane.bombBursts }, () => this.createBurst()) // loaded before the first bomb
    this.children.push(...this.explosions)
    this.machine = new StateMachine(this, states, 'fly')
  }

  get states() {
    return this.machine.names
  }

  get state() {
    return this.machine.name
  }

  setState(name) {
    this.machine.set(name)
  }

  /** The guns point straight up the screen, the way the plane flies. */
  get shots() {
    return { up: { x: 0, y: -300 } }
  }

  /** The plane faces up the screen: a point ahead of it is above it, not to a side. */
  get forward() {
    return 1
  }

  /** A bullet flies on until it leaves the top of the screen. */
  get reach() {
    return this.y
  }

  /** The guns are fixed, so the plane can fire only at a point above it. */
  aimAt(point) {
    return point.y < this.y
  }

  /** Which of the fire levels: the guns that fire together. */
  get fireLevel() {
    return this.#fireLevel
  }

  set fireLevel(level) {
    this.#fireLevel = level
    this.weapon.barrels = fire[level]
  }

  selectAircraft(id) {
    const plane = getAircraft(id)
    if (this.aircraftId !== id) {
      this.aircraftId = id
      this.loadImage(plane.image, undefined, undefined, .5)
    }
    return this.imageLoaded
  }

  onload() {
    this.toStart()
  }

  toStart() {
    this.audioRevision = (this.audioRevision ?? 0) + 1
    const { x, y } = this.startAt(this)
    this.setPosition(x, y)
  }

  get looping() {
    return this.loopAge !== null
  }

  /** Neither a bullet nor a crash takes a life: just after coming back, and during a loop. */
  get invulnerable() {
    return this.shield > 0 || this.looping
  }

  checkBounds() {
    this.keepOnScreen()
  }

  /** One bullet from every gun of the fire level; the reload goes by game time, so it waits in a pause. */
  shoot() {
    this.weapon.tryFire({ x: this.x, y: this.y - this.height / 4 }, Math.PI * 1.5)
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
    const { loop } = playerPlane
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
    this.bombSound.play()
    const radius = playerPlane.bombRadius * Math.min(canvas2d.width, canvas2d.height)
    // whatever the fire touches, also just past the outermost burst
    const inBlast = thing => this.distanceTo(thing) < radius + this.explosions[0].reach
    this.targets
      .filter(plane => plane.alive && inBlast(plane))
      .forEach(plane => {
        plane.damage(playerPlane.bombHits)
        this.scoreIfDown(plane)
        this.explode(plane.x, plane.y)
      })
    this.targets
      .flatMap(plane => plane.bullets.projectiles)
      .filter(bullet => bullet.visible && inBlast(bullet))
      .forEach(bullet => bullet.reset())
    this.spreadBursts(radius)
  }

  /** Explosions at random places in the blast, a little apart in time. */
  spreadBursts(radius) {
    const { bombBursts, bombSpread } = playerPlane
    for (let i = 0; i < bombBursts; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = radius * Math.sqrt(Math.random()) // evenly over the circle, not crowded in the middle
      const x = this.x + Math.cos(angle) * distance
      const below = Math.sin(angle) * distance
      const y = this.y + (this.y + below > canvas2d.height ? -below : below) // a burst under the screen's edge shows above instead
      this.session.presentation.after(Math.random() * bombSpread, () => this.explode(x, y))
    }
  }

  /** A burst on the screen, above the planes. */
  createBurst() {
    return new Explosion(null, { scale: playerPlane.burstScale, z: -1 })
  }

  explode(x, y) {
    let explosion = this.explosions.find(burst => !burst.visible)
    if (!explosion) {
      explosion = this.createBurst()
      this.explosions.push(explosion)
      this.children.push(explosion)
    }
    explosion.start(x, y)
  }

  /** Points count only while the game runs, not after its result. */
  scoreIfDown(plane) {
    if (plane.dead && this.session.state === 'running') this.poeni += plane.points
  }

  /** A bullet takes a life unless the plane is invulnerable. */
  takeHit() {
    if (!this.invulnerable) this.die()
  }

  /** A crash into an enemy plane takes a life and one hit of the enemy. */
  checkCrashes() {
    if (!this.alive || this.invulnerable) return

    const enemy = this.targets.find(plane => plane.alive && this.collidesWith(plane))
    if (!enemy) return
    enemy.damage(1)
    this.die()
  }

  /** The plane comes back at the bottom of the screen, safe for a while, with its loops. */
  reset() {
    this.alive = true
    this.scaleX = this.scaleY = 1
    this.stop()
    this.toStart()
    this.shield = playerPlane.shieldTime
    resetFlame(this)
    this.loopsLeft = playerPlane.loops
  }

  /** A lost life also takes away the fire power-ups. */
  die() {
    resetFlame(this)
    this.alive = false
    this.loopAge = null
    this.fireLevel = 0
    this.fall = true
    this.zivoti--
    this.session.gameplay.after(playerPlane.respawnTime, () => {
      this.fall = false
      if (this.zivoti) this.reset()
    })
  }

  update(dt, t) {
    if (this.alive) this.machine.update(dt)
    if (this.looping) this.flyLoop(dt)
    this.shield = Math.max(this.shield - dt, 0)
    this.view.update(dt)
    super.update(dt, t)
    this.bullets.checkHits(this.targets, plane => this.scoreIfDown(plane))
    this.checkCrashes()

    if (this.fall)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }

  render() {
    this.view.render(this)
  }
}
