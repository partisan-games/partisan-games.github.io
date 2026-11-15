/** Include projectile children, such as grenade explosions, before the mission can start. */
export default async function prepareCombatAssets(pools) {
  for (const pool of pools) pool.prepare()

  const images = new Set()
  const collect = object => {
    if (object.slika) images.add(object)
    for (const child of object.predmeti || []) collect(child)
  }
  for (const pool of pools) for (const projectile of pool.projectiles) collect(projectile)

  await Promise.all([...images].map(async object => {
    await object.slikaUcitana
    // Loading bytes does not guarantee that the first draw can skip image decoding.
    if (typeof object.slika.decode === 'function') await object.slika.decode()
  }))
}
