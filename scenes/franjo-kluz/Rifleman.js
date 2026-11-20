import ProjectilePool from '/core/actor/ProjectilePool.js'
import Cooldown from '/core/gameplay/Cooldown.js'
import StateMachine from '/core/gameplay/StateMachine.js'
import GroundTarget from './GroundTarget.js'
import Bullet from './Bullet.js'

/**
 * A soldier's rifle: its reach in pixels, the seconds between shots, the bullet speed, the little of the plane's
 * health one hit takes, and how steep, in radians, a shot must be for the soldier to raise his rifle to the sky.
 */
export const rifle = { range: 600, reload: 2, speed: 900, damage: 3, steep: .6 }
/** A soldier's patrol: his walking pace in pixels per second, and how far from his post he goes either way. */
export const patrol = { speed: 30, range: 80 }

/**
 * The soldier stands at ease, or walks his patrol to and fro, or fires his rifle where he aims as often as he
 * reloads, or lies fallen. Each lasts until he is set to another; who does it, and when, is
 * up to the world.
 */
const states = {
  idle: {
    enter: soldier => soldier.play('rest'),
  },
  patrol: {
    enter: soldier => {
      soldier.play('walk')
      // back towards the post, or either way when standing on it
      soldier.heading = Math.sign(soldier.post - soldier.x) || (Math.random() < .5 ? -1 : 1)
    },
    update: (soldier, dt) => {
      if (Math.abs(soldier.x + soldier.heading * patrol.speed * dt - soldier.post) > patrol.range) soldier.heading *= -1
      soldier.x += soldier.heading * patrol.speed * dt
      // the picture faces right; the renderer mirrors left to right by `flipY`
      soldier.flipY = soldier.heading
    },
  },
  fire: {
    // the shot's last frame is the rifle held at aim, which stays until the next shot
    enter: soldier => soldier.holdAim(),
    update: soldier => {
      if (soldier.cooldown.ready) soldier.shoot()
    },
  },
  dead: {
    enter: soldier => {
      if (soldier.alive) soldier.die()
    },
  },
}

/** A soldier at his post, who may patrol it and fire his rifle where he aims. */
export default class Rifleman extends GroundTarget {
  /** `targets` are what his rounds can hit. */
  constructor({ targets = [], session, ...options }) {
    super(options)
    this.targets = targets
    /** The picture of his shot, and the point it is fired at; with none, straight ahead. */
    this.shotClip = 'fire'
    this.aimPoint = null
    this.session = session
    this.post = this.x
    this.cooldown = new Cooldown({ seconds: rifle.reload, clock: session.clock })
    // soldiers standing together do not fire together
    this.cooldown.start(Math.random() * rifle.reload)
    this.bullets = new ProjectilePool({
      owner: this,
      create: () => new Bullet(this.camera, { sound: 'rifle.mp3', damage: rifle.damage }),
    })
    this.machine = new StateMachine(this, states, 'idle')
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

  /**
   * The shots the soldier's pictures show, each with a point ahead of him and above, in pixels, that he aims at so:
   * a level shot at a low point, the rifle raised to the sky for a high one.
   */
  get shots() {
    return { straight: { x: 400, y: -60 }, up: { x: 200, y: -400 } }
  }

  get reach() {
    return rifle.range
  }

  /** The way the soldier faces: 1 right, -1 left. */
  get forward() {
    return this.flipY
  }

  /**
   * Turns to `point` and raises the rifle for it: level for a low point, to the sky for a high one. A point below him
   * no picture shows, so he cannot aim there.
   */
  aimAt(point) {
    if (point.y >= this.y) return false
    // the picture faces right; the renderer mirrors left to right by `flipY`
    if (point.x !== this.x) this.flipY = point.x < this.x ? -1 : 1
    const clip = Math.atan2(this.y - point.y, Math.abs(point.x - this.x)) > rifle.steep ? 'fireUp' : 'fire'
    const turned = clip !== this.shotClip
    this.shotClip = clip
    this.aimPoint = { x: point.x, y: point.y }
    if (turned && this.state === 'fire') this.holdAim()
    return true
  }

  /** Holds the rifle at aim: the end of a shot, without firing it. */
  holdAim() {
    this.play(this.shotClip)
    this.animationElapsed = this.animationTime
  }

  /** The round leaves the muzzle drawn in the shot, where the picture marks one, towards the aimed point. */
  shoot() {
    this.play(this.shotClip)
    const muzzle = this.art?.clips[this.shotClip].muzzle
    const from = muzzle && this.width ? this.framePoint(muzzle) : this.position
    const angle = this.aimPoint ? Math.atan2(this.aimPoint.y - from.y, this.aimPoint.x - from.x) : this.forward > 0 ? 0 : Math.PI
    this.bullets.fire(from, angle, rifle.speed)
    this.cooldown.start()
  }

  die() {
    if (this.dead) return
    super.die()
    this.machine.set('dead')
  }

  update(dt, t) {
    super.update(dt, t)
    if (this.session.state !== 'running') return
    if (this.alive) this.machine.update(dt)
    // rounds already in the air still hit after the soldier falls
    this.bullets.checkHits(this.targets)
  }
}
