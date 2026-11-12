/*
 * The waves of each level: when they come (seconds), which formation, which enemy and which path.
 * Defaults: one fighter; x is the share of the screen width, y of the height, for entries from the side.
 */
export const levels = [
  [
    { at: 1, path: 'straight', x: .3 },
    { at: 3, path: 'straight', x: .7 },
    { at: 5, formation: 'pair', path: 'straight', x: .5 },
    { at: 8, formation: 'line', count: 4, path: 'straight', x: .5 },
    { at: 12, formation: 'column', count: 5, path: 'wave', x: .3 },
    { at: 15, path: 'fromBelow', x: .6 },
    { at: 17, formation: 'vee', count: 5, path: 'straight', x: .5 },
    { at: 21, formation: 'column', count: 4, path: 'fromSide', side: 'left', y: .1 },
    { at: 24, formation: 'column', count: 4, path: 'fromSide', side: 'right', y: .15 },
    { at: 27, enemy: 'heavy', path: 'straight', x: .5 },
    { at: 30, formation: 'line', count: 3, path: 'uTurn', x: .3 },
    { at: 33, formation: 'pair', path: 'fromBelow', x: .4 },
    { at: 36, formation: 'vee', count: 5, path: 'wave', x: .6 },
    { at: 40, enemy: 'heavy', formation: 'pair', path: 'straight', x: .5 },
    { at: 44, formation: 'column', count: 6, path: 'fromSide', side: 'left', y: .2 },
    { at: 47, formation: 'line', count: 5, path: 'straight', x: .5 },
    { at: 50, formation: 'column', count: 5, path: 'uTurn', side: 'left', x: .7 },
    { at: 54, enemy: 'heavy', path: 'wave', x: .4 },
    { at: 56, formation: 'vee', count: 5, path: 'straight', x: .3 },
    { at: 59, formation: 'column', count: 6, path: 'fromSide', side: 'right', y: .1 },
    { at: 64, enemy: 'boss' },
  ],
]
