import { FlameUp, Smoke } from '/core3d/Particles.js'

/** A small engine fire and rising smoke, attached beside the vehicle so they cannot change its bounds. */
export default function wreckFire(mesh, engine) {
  const fire = new FlameUp({ num: 14, size: .53, color: 0xffa050, opacity: .85,
    minRadius: .02, maxRadius: .26, minVelocity: .8, maxVelocity: 1.45, min: -.72 })
  const smoke = new Smoke({ num: 26, size: 1.05, color: 0x393430, opacity: .54,
    minRadius: .04, maxRadius: .47, minVelocity: .45, maxVelocity: 1.2, min: -2.4 })
  for (const { mesh: plume } of [fire, smoke]) {
    plume.frustumCulled = false
    mesh.parent.add(plume)
  }
  return {
    fire, smoke,
    update(dt, t) {
      const source = mesh.localToWorld(fire.mesh.position.fromArray(engine))
      smoke.mesh.position.copy(source).y += .23
      fire.update(dt, t)
      smoke.update(dt, t, { rotateY: 0 })
    },
    dispose() {
      for (const { mesh: plume } of [fire, smoke]) {
        plume.removeFromParent()
        plume.geometry.dispose()
        plume.material.map?.dispose()
        plume.material.dispose()
      }
    },
  }
}
