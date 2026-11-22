const attackNames = ['attack', 'fire']

/** Give a single attack one entry; several aimed attacks replace its generic entry. */
export function attackControls(block) {
  const states = block.states ?? []
  const animations = Object.keys(block.anim?.actions ?? {})
  const acts = block.acts ?? []
  const shots = Object.keys(block.shots ?? {})
  const manual = shots.filter(name => !block.shots[name].automatic)
  const state = attackNames.find(name => states.includes(name))
  const animation = attackNames.find(name => animations.includes(name))
  const specific = manual.length > 1
  return {
    states: states.filter(name => !specific || !attackNames.includes(name)),
    animations: animations.filter(name => !attackNames.includes(name) || (!specific && !state)),
    acts: acts.filter(name => !attackNames.includes(name) || (!specific && !state && !animation)),
    shots: shots.filter(name => !(manual.length === 1 && state && name === manual[0])),
    primary: ['straight', 'down', 'drop'].find(name => manual.includes(name)) ?? manual[0],
  }
}
