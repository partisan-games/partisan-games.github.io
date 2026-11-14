import Predmet from '/core/actor/Predmet.js'
import platno from '/core/io/platno.js'
import { randomInRange } from '/core/utils.js'
import ProjectilePool from '/core/actor/ProjectilePool.js'
import Metak from '/core/actor/projektili/Metak.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import Weapon from '/core/gameplay/Weapon.js'
import { createSound } from '/core/io/sound.js'
import { paths } from './paths.js'
import { settings } from './settings.js'
import { resetFlame } from './flame.js'

const { fallTime, enemyBulletSpeed } = settings
const pick = list => list[Math.floor(Math.random() * list.length)]
const outside = 150 // px past the edge where a plane that has left the screen is gone

// by the plane's center, since its size is unknown until its image loads
const isOnScreen = ({ x, y }) => x >= 0 && x <= platno.width && y >= 0 && y <= platno.height
const isFarOut = ({ x, y }) => x < -outside || x > platno.width + outside || y < -outside || y > platno.height + outside

/**
 * An enemy plane that flies its path, shoots at the player and falls when shot down.
 * Its shots and its fall wait on the game `session`.
 */
export default class Enemy extends Predmet {
  constructor({ session, type = 'fighter', path = 'straight', x = Math.random(), y = .1, side = 'left', across = 0, delay = 0 }) {
    const kind = settings.enemies[type]
    super(pick(kind.images), { skalar: kind.scale, zapaljiv: true, senka: true })
    this.type = type
    this.points = kind.points
    this.maxHits = this.hits = kind.hits
    this.session = session
    this.fire = kind.fire
    this.path = paths[path]
    this.route = { x, y, side, speed: kind.speed }
    this.across = across
    this.age = -delay // a later member of a formation is still behind the leader on the path
    this.entered = this.falling = this.gone = false
    this.ciljevi = []
    this.bullets = new ProjectilePool({ owner: this, create: () => new Metak() })
    this.weapon = new Weapon({
      cooldown: new Cooldown({ seconds: kind.fire.interval, clock: session.clock }),
      barrels: kind.fire.spread.map(angle => ({ angle })),
      spawnProjectile: (origin, angle) => this.bullets.fire(origin, angle, enemyBulletSpeed),
    })
    this.weapon.cooldown.start(kind.fire.interval * Math.random()) // planes of a formation do not fire together
    this.fly(0)
  }

  /** Where the plane is on its path at the given age, shifted across the path for its place in the formation. */
  routePosition(age = this.age) {
    const position = this.path.position(age, { ...this.route, width: platno.width, height: platno.height })
    position[this.path.across] += this.across
    return position
  }

  fly(dt) {
    this.age += dt
    const { x, y } = this.routePosition()
    const ahead = this.routePosition(this.age + .05)
    if (ahead.x !== x || ahead.y !== y)
      this.ugao = Math.atan2(ahead.y - y, ahead.x - x) + Math.PI / 2 // the image points up
    this.x = x
    this.y = y

    // a plane starts outside the screen; once it has flown in and out again, it is gone
    if (isOnScreen(this)) this.entered = true
    else if (this.entered && isFarOut(this)) this.gone = true
  }

  /** A bullet is one hit, whatever damage it carries. */
  reagujNaPogodak() {
    this.damage(1)
  }

  damage(hits) {
    if (this.dead) return
    if (!this.zapaljen) resetFlame(this)
    this.hits -= hits
    if (this.hits <= 0) this.umri()
  }

  /** A heavy plane catches fire when half of its hits are gone. */
  get zapaljen() {
    return this.zapaljiv && (this.dead || this.hits <= this.maxHits / 2)
  }

  /** A shot down plane leaves its path and formation and goes on straight ahead, the way its nose points. */
  umri() {
    if (!this.zapaljen) resetFlame(this)
    super.umri()
    createSound('explosion.mp3', { random: true }).play()
    this.falling = true
    const heading = this.ugao - Math.PI / 2 // the image points up
    this.dx = this.route.speed * Math.cos(heading)
    this.dy = this.route.speed * Math.sin(heading)
    this.session.gameplay.after(fallTime, () => {
      this.gone = true
    })
  }

  /** Where the next shot leaves from. */
  nextGun() {
    return { x: this.x, y: this.y }
  }

  shoot() {
    const target = this.ciljevi[0]
    if (!this.weapon.cooldown.ready || !target?.alive || !isOnScreen(this)) return

    const gun = this.nextGun()
    if (this.weapon.tryFire(gun, Math.atan2(target.y - gun.y, target.x - gun.x)))
      this.weapon.cooldown.start(this.fire.interval * randomInRange(.8, 1.2))
  }

  update(dt, t) {
    if (!this.falling) this.fly(dt)
    super.update(dt, t)
    if (this.alive) this.shoot()
    this.bullets.checkHits(this.ciljevi)

    if (this.falling)
      this.scaleX = this.scaleY = this.scaleX * Math.pow(0.8, dt)
  }
}
