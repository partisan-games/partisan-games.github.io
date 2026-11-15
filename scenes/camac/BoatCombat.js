/** Sweep a bullet through a moving target's local rectangle; x/y remain world positions. */
function hitTime(shot, target, before) {
  const angle = target.ugao || 0
  const cos = Math.cos(angle), sin = Math.sin(angle)
  const local = (x, y) => ({ x: x * cos + y * sin, y: -x * sin + y * cos })
  const start = local(shot.start.x - before.x, shot.start.y - before.y)
  const end = local(shot.end.x - target.x, shot.end.y - target.y)
  const direction = shot.ugao - angle
  const paddingX = (Math.abs(Math.cos(direction)) * shot.sirina + Math.abs(Math.sin(direction)) * shot.visina) / 2
  const paddingY = (Math.abs(Math.sin(direction)) * shot.sirina + Math.abs(Math.cos(direction)) * shot.visina) / 2
  let enter = 0, exit = 1
  for (const [axis, half] of [['x', target.sirina / 2 + paddingX], ['y', target.visina / 2 + paddingY]]) {
    const delta = end[axis] - start[axis]
    if (delta === 0) {
      if (Math.abs(start[axis]) > half) return null
    } else {
      const a = (-half - start[axis]) / delta, b = (half - start[axis]) / delta
      enter = Math.max(enter, Math.min(a, b))
      exit = Math.min(exit, Math.max(a, b))
    }
  }
  return enter <= exit ? enter : null
}

/** One hit phase after all actors and projectiles have moved. */
export default class BoatCombat {
  constructor(session) {
    this.session = session
    this.actors = new Map()
    this.before = new Map()
  }

  add(actor, team) { this.actors.set(actor, team) }
  remove(actor) { this.actors.delete(actor); this.before.delete(actor) }

  beginFrame() {
    this.before.clear()
    for (const actor of this.actors.keys()) {
      if (actor.alive && actor.vidljiv)
        this.before.set(actor, { x: actor.x, y: actor.y, lifeId: actor.lifeId })
    }
  }

  resolve() {
    if (this.session.state !== 'running') return
    for (const [owner, team] of this.actors) {
      for (const shot of owner.bullets?.projectiles || []) {
        if (!shot.vidljiv || !shot.start || !shot.end) continue
        let first = null
        for (const [target, targetTeam] of this.actors) {
          const before = this.before.get(target)
          if (targetTeam === team || !before || target.dead || !target.vidljiv || before.lifeId !== target.lifeId ||
            !Number.isFinite(target.sirina) || !Number.isFinite(target.visina)) continue
          const time = hitTime(shot, target, before)
          if (time !== null && (!first || time < first.time)) first = { target, time, lifeId: before.lifeId }
        }
        if (first) {
          const { target, time, lifeId } = first
          shot.postavi(shot.start.x + (shot.end.x - shot.start.x) * time,
            shot.start.y + (shot.end.y - shot.start.y) * time)
          shot.reset()
          target.reagujNaPogodak(shot.steta, lifeId)
        } else if (shot.vanEkrana) shot.reset()
        shot.start = shot.end = null
      }
    }
  }
}
