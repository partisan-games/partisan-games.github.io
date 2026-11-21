import canvas2d from '/core/io/canvas2d.js'
import PathFlight from '/core/gameplay/controllers/PathFlight.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'
import AttackPlane, { attackPlaneKinds } from '/core/gameplay/bodies/aircraft/AttackPlane.js'
import AttackPlaneSprite from '/core/actor/aircraft/AttackPlaneSprite.js'
import { formationMembers } from './formations.js'
import { paths } from './paths.js'
import { settings } from './settings.js'

/** Seconds before the boss flies away, and seconds a shot down plane falls before it is gone. */
export const boss = { timeLimit: 35 }
export const fall = { seconds: 2 }
/** Pixels past the edge where a plane that has flown off the screen is gone. */
const outside = 150

const pick = list => list[Math.floor(Math.random() * list.length)]

/** Where a plane of a wave is t seconds into its flight, in pixels, shifted across its path for its place. */
const route = ({ path = 'straight', x = Math.random(), y = .1, side = 'left', across = 0, speed }) => t => {
  const position = paths[path].position(t, { x, y, side, speed, width: canvas2d.width, height: canvas2d.height })
  position[paths[path].across] += across
  return position
}

/** The boss sways on its path until its time is up, then flies up and away. */
const bossRoute = speed => {
  const sway = route({ path: 'boss', speed })
  return t => {
    const position = sway(t)
    const leaving = t - boss.timeLimit
    if (leaving > 0) position.y -= speed * 3 * leaving
    return position
  }
}

/**
 * Sends the waves of a level into the scene at their times and takes out the planes that are gone. Each plane is
 * `{ type, body, view, flight, gunner }`. When a formation is shot down to the last plane, it calls
 * `onFormationDown` with where that plane fell, in pixels. The scene gives the `projection` and the `player` they fire
 * at, and `canFire(body)`.
 */
export default class Waves {
  constructor({ scene, player, schedule, projection, canFire, onFormationDown = () => {} }) {
    Object.assign(this, { scene, player, schedule, projection, canFire, onFormationDown })
    this.time = 0
    this.next = 0
    this.enemies = []
    this.formations = [] // each { planes, lastAlive }, while one of its planes still flies
  }

  get allLaunched() {
    return this.next >= this.schedule.length
  }

  /** Every wave has flown and no plane is left: the level is over. */
  get finished() {
    return this.allLaunched && !this.enemies.length
  }

  get boss() {
    return this.enemies.find(plane => plane.type === 'boss')
  }

  update(dt) {
    this.time += dt
    while (!this.allLaunched && this.schedule[this.next].at <= this.time)
      this.launch(this.schedule[this.next++])
    this.checkFormations()
    this.removeGone()
  }

  launch(wave) {
    const planes = wave.enemy === 'boss' ? [this.plane('boss', bossRoute(settings.enemies.boss.speed))] : this.formation(wave)
    if (planes.length > 1) this.formations.push({ planes, lastAlive: planes[0] })
    this.enemies.push(...planes)
    for (const plane of planes) {
      this.scene.targets.push(plane.body)
      this.scene.controllers.push(plane.flight, plane.gunner)
      this.scene.add(plane.body, plane.view)
    }
  }

  formation({ enemy = 'fighter', formation, count, path, x, y, side }) {
    const { speed } = settings.enemies[enemy]
    return formationMembers({ formation, count, gap: settings.formationGap, speed })
      .map(({ across, delay }) => this.plane(enemy, route({ path, x, y, side, across, speed }), delay))
  }

  /** A plane flown along its route, in pixels, that fires at the player while it may. */
  plane(type, path, delay = 0) {
    const body = new AttackPlane({ kind: attackPlaneKinds[type], clock: this.scene.session.clock, targets: [this.player],
      view: this.scene.screenView })
    body.canFire = () => this.canFire(body)
    const view = new AttackPlaneSprite(body, { src: pick(settings.enemies[type].images), projection: this.projection })
    const position = t => this.projection.toWorld(path(t))
    const flight = new PathFlight(body, { position, delay })
    return { type, body, view, flight, gunner: new Gunner(body, this.player), entered: false }
  }

  /** A formation is down when none of its planes flies; the one alive in the last frame fell last. */
  checkFormations() {
    this.formations = this.formations.filter(formation => {
      const alive = formation.planes.filter(plane => plane.body.alive)
      if (!alive.length) {
        this.onFormationDown(this.projection.point(formation.lastAlive.body))
        return false
      }
      formation.lastAlive = alive[0]
      return alive.some(plane => !this.isGone(plane)) // a plane that has flown away cannot be shot down any more
    })
  }

  /** A plane that has flown onto the screen and far out again is gone, and a shot down one once it has fallen. */
  isGone(plane) {
    const { body } = plane
    if (body.dead) return body.stateTime >= fall.seconds
    const { x, y } = this.projection.point(body)
    const onScreen = x >= 0 && x <= canvas2d.width && y >= 0 && y <= canvas2d.height
    if (onScreen) plane.entered = true
    return plane.entered && (x < -outside || x > canvas2d.width + outside || y < -outside || y > canvas2d.height + outside)
  }

  removeGone() {
    const gone = this.enemies.filter(plane => this.isGone(plane))
    if (!gone.length) return
    for (const plane of gone) {
      this.scene.remove(plane.body, plane.view)
      this.scene.targets.splice(this.scene.targets.indexOf(plane.body), 1)
      const kept = this.scene.controllers.filter(controller => controller !== plane.flight && controller !== plane.gunner)
      this.scene.controllers.splice(0, this.scene.controllers.length, ...kept)
    }
    this.enemies = this.enemies.filter(plane => !gone.includes(plane))
  }
}
