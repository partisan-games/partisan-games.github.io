import canvas2d from '/core/io/canvas2d.js'
import PathFlight from '/core/gameplay/controllers/PathFlight.js'
import Gunner from '/core/gameplay/controllers/Gunner.js'
import Enemy from './Enemy.js'
import Boss, { boss } from './Boss.js'
import { formationMembers } from './formations.js'
import { paths } from './paths.js'
import { settings } from './settings.js'

/** Where a plane of a wave is t seconds into its flight, shifted across its path for its place in the formation. */
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
 * Sends the waves of a level into the scene at their times and takes out the planes that are gone.
 * When a formation is shot down to the last plane, it calls onFormationDown with where that plane fell.
 */
export default class Waves {
  constructor({ scene, player, schedule, onFormationDown = () => {} }) {
    this.scene = scene
    this.player = player
    this.schedule = schedule
    this.onFormationDown = onFormationDown
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
    return this.enemies.find(enemy => enemy instanceof Boss)
  }

  update(dt) {
    this.time += dt
    while (!this.allLaunched && this.schedule[this.next].at <= this.time)
      this.launch(this.schedule[this.next++])
    this.checkFormations()
    this.removeGone()
  }

  launch(wave) {
    const { session } = this.scene
    const planes = wave.enemy === 'boss' ? [this.bossPlane(session)] : this.formation(wave, session)
    planes.forEach(plane => plane.targets.push(this.player))
    if (planes.length > 1) this.formations.push({ planes, lastAlive: planes[0] })
    this.enemies.push(...planes)
    this.player.targets.push(...planes)
    this.scene.add(...planes)
  }

  bossPlane(session) {
    const position = bossRoute(settings.enemies.boss.speed)
    return this.pilot(new Boss({ session }), { position })
  }

  formation({ enemy = 'fighter', formation, count, path, x, y, side }, session) {
    const { speed } = settings.enemies[enemy]
    return formationMembers({ formation, count, gap: settings.formationGap, speed })
      .map(({ across, delay }) => {
        const position = route({ path, x, y, side, across, speed })
        return this.pilot(new Enemy({ session, type: enemy }), { position, delay })
      })
  }

  /**
   * Flies a plane along its route and fires it at the player while it is on the screen. Its engine is heard once
   * its flight has begun, after its delay behind the formation's leader.
   */
  pilot(plane, course) {
    const flight = new PathFlight(plane, course)
    const gunner = new Gunner(plane, this.player)
    plane.engineRunning = flight.started
    plane.controller = {
      flight,
      gunner,
      update: dt => {
        flight.update(dt)
        plane.engineRunning = flight.started
        gunner.update()
      },
    }
    return plane
  }

  /** A formation is down when none of its planes flies; the one alive in the last frame fell last. */
  checkFormations() {
    this.formations = this.formations.filter(formation => {
      const alive = formation.planes.filter(plane => plane.alive)
      if (!alive.length) {
        const { x, y } = formation.lastAlive
        this.onFormationDown({ x, y })
        return false
      }
      formation.lastAlive = alive[0]
      return alive.some(plane => !plane.gone) // a plane that has flown away cannot be shot down any more
    })
  }

  removeGone() {
    const gone = this.enemies.filter(enemy => enemy.gone)
    if (!gone.length) return

    const stays = enemy => !gone.includes(enemy)
    this.scene.remove(...gone)
    this.enemies = this.enemies.filter(stays)
    this.player.targets = this.player.targets.filter(stays)
  }
}
