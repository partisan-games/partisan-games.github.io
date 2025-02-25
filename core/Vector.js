export default class Vector {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  set({ x, y, z }) {
    if (x !== undefined) this.x = x
    if (y !== undefined) this.y = y
    if (z !== undefined) this.z = z
  }

  razmakDo(polozaj) {
    return Math.hypot(this.x - polozaj.x, this.y - polozaj.y, this.z - polozaj.z)
  }
}