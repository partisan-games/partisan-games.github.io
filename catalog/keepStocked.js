/** What a block may run out of: rounds, bombs, and the bombs of a pass (a count, or whether it has its one). */
const stocks = ['ammo', 'bombs', 'loaded']

/**
 * A controller that keeps `block` stocked as the catalog shows it: whatever it has of `stocks` at the start, a count
 * or a yes, it has again after every shot, so it can fire as often as it is asked.
 */
export default function keepStocked(block) {
  const full = Object.fromEntries(stocks.filter(name => ['number', 'boolean'].includes(typeof block[name]))
    .map(name => [name, block[name]]))
  return {
    update() {
      Object.assign(block, full)
    },
  }
}
