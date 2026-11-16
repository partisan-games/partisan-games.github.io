/** Place by sprite edges after loading; every return goes behind the last bunker. */
export default function spaceBunkers(bunkers, screenWidth) {
  const gap = Math.max(480, screenWidth * .65)
  let left = screenWidth + gap
  for (const bunker of bunkers) {
    bunker.x = Math.max(bunker.x, left + bunker.width / 2)
    left = bunker.x + bunker.width / 2 + gap
    bunker.nextSpawnX = () => Math.max(screenWidth, ...bunkers.map(other => other.x + other.width / 2)) + gap + bunker.width / 2
  }
}
