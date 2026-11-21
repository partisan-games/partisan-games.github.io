/** A whole number from `low` to `high`, both included. */
const randomWhole = (low, high) => low + Math.floor(Math.random() * (high - low + 1))

/** The damage of a blow `distance` away: a whole number in `range` within `reach`, otherwise none. */
export const damageAt = ({ distance, reach, range = [35, 55], roll = randomWhole }) =>
  distance <= reach ? roll(...range) : 0

/** The blows of characters the computer leads are weaker than a player's, so that one player can stand up to several. */
export const computerDamage = [15, 35]
