import TenkLevo from '/scenes/tenkici/TenkLevo.js'
import TenkDesno from '/scenes/tenkici/TenkDesno.js'

/** A tank alone, firing at the target. */
const tank = Tank => stage => {
  const block = new Tank({
    x: stage.width / 2, y: stage.groundY, groundY: stage.groundY, clock: stage.session.clock, ai: false, xLimit: Infinity,
  })
  block.targets.push(stage.target)
  stage.add(block)
  return block
}

const game = 'Tenkići'

export const vehicles = [
  { id: 'partizanski-tenk', name: 'Partizanski tenk', game, block: '/scenes/tenkici/TenkLevo.js', create: tank(TenkLevo) },
  { id: 'nemacki-tenk', name: 'Nemački tenk', game, block: '/scenes/tenkici/TenkDesno.js', create: tank(TenkDesno) },
]
