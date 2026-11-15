/** Place by sprite edges after loading; every return goes behind the last bunker. */
export default function spaceBunkers(bunkers, screenWidth) {
  const gap = Math.max(480, screenWidth * .65)
  let left = screenWidth + gap
  for (const bunker of bunkers) {
    bunker.x = Math.max(bunker.x, left + bunker.sirina / 2)
    left = bunker.x + bunker.sirina / 2 + gap
    bunker.nextSpawnX = () => Math.max(screenWidth, ...bunkers.map(other => other.x + other.sirina / 2)) + gap + bunker.sirina / 2
  }
}
