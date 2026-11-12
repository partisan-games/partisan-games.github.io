import Enemy from './Enemy.js'
import Boss from './Boss.js'
import { formationMembers } from './formations.js'
import { settings } from './settings.js'

/** Sends the waves of a level into the scene at their times and takes out the planes that are gone. */
export default class Waves {
  constructor({ scene, player, schedule }) {
    this.scene = scene
    this.player = player
    this.schedule = schedule
    this.time = 0
    this.next = 0
    this.enemies = []
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
    this.removeGone()
  }

  launch(wave) {
    const planes = wave.enemy === 'boss' ? [new Boss()] : this.formation(wave)
    planes.forEach(plane => plane.ciljevi.push(this.player))
    this.enemies.push(...planes)
    this.player.ciljevi.push(...planes)
    this.scene.add(...planes)
  }

  formation({ enemy = 'fighter', formation, count, path, x, y, side }) {
    const { speed } = settings.enemies[enemy]
    return formationMembers({ formation, count, gap: settings.formationGap, speed })
      .map(({ across, delay }) => new Enemy({ type: enemy, path, x, y, side, across, delay }))
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
