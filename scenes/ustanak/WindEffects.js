/** Wind carries the existing particles without moving their sources or changing their lifetime. */
export default class WindEffects {
  constructor(wind) {
    this.wind = wind
  }

  update(objects, dt) {
    const shift = this.wind.drift * dt
    if (!shift) return
    const seen = new Set()
    const visit = object => {
      if (seen.has(object)) return
      seen.add(object)
      if (object.burning && object.flame)
        for (const particle of object.flame.sparks) {
          if (seen.has(particle)) continue
          seen.add(particle)
          particle.x += shift
        }

      object.children?.forEach(visit)
    }
    objects.forEach(visit)
  }
}
