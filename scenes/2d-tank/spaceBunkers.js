const GAP = 120

/** Place by sprite edges after loading; every return goes behind the last bunker. */
export default function spaceBunkers(bunkers, screenWidth) {
  let left = screenWidth + GAP
  for (const bunker of bunkers) {
    bunker.x = Math.max(bunker.x, left + bunker.sirina / 2)
    left = bunker.x + bunker.sirina / 2 + GAP
    bunker.nextSpawnX = () => Math.max(screenWidth, ...bunkers.map(other => other.x + other.sirina / 2)) + GAP + bunker.sirina / 2
  }
}
