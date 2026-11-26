import { loadedModel } from '/core3d/assets/models.js'

export const dfs230Model = { file: 'aircraft/dfs-230/dfs-230.glb', size: 2.3, fitVisible: true, castShadow: false }

/** Scenic glider on the first drop. Its low pass ends on the far bank of the town. */
export default class Dfs230 {
  constructor(groundAt = () => 0) {
    this.mesh = loadedModel(dfs230Model).clone(true)
    this.groundAt = groundAt
    this.elapsed = 0
    this.update(0)
  }

  update(dt) {
    this.elapsed = Math.min(9, this.elapsed + dt)
    const progress = this.elapsed / 9
    const x = 106 - 29 * progress
    const z = 102 - 205 * progress
    this.mesh.position.set(x, this.groundAt(x, z) + 45 * (1 - progress) ** 1.27, z)
    this.mesh.rotation.set(0, Math.atan2(205, -29), -.20 * Math.sin(Math.PI * progress), 'YZX')
  }
}
