import Enemy from './Enemy.js'
import Boss from './Boss.js'
import { formationMembers } from './formations.js'
import { settings } from './settings.js'

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
    const planes = wave.enemy === 'boss' ? [new Boss()] : this.formation(wave)
    planes.forEach(plane => plane.ciljevi.push(this.player))
    if (planes.length > 1) this.formations.push({ planes, lastAlive: planes[0] })
    this.enemies.push(...planes)
    this.player.ciljevi.push(...planes)
    this.scene.add(...planes)
  }

  formation({ enemy = 'fighter', formation, count, path, x, y, side }) {
    const { speed } = settings.enemies[enemy]
    return formationMembers({ formation, count, gap: settings.formationGap, speed })
      .map(({ across, delay }) => new Enemy({ type: enemy, path, x, y, side, across, delay }))
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
    this.player.ciljevi = this.player.ciljevi.filter(stays)
  }
}
