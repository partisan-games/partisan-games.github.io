import { modelStatistics } from './modelStatistics.js'

/**
 * How each model moves and fights, the values agreed for the games from docs/STATISTIKE.md, shared by its 2D and 3D
 * views. Speed and firepower are shares of the plain body of its kind, health the hits it takes, or for a tank, its armour as the damage it takes; a model not listed
 * moves and fights as the plain one.
 */
export const modelPerformance = {
  spitfire: { speed: 1.1, health: 9, firepower: 1.2, bombs: 2 },
  hurricane: { speed: 1, health: 12, firepower: 1.3, bombs: 4 },
  breguet: { speed: .7, health: 12, firepower: .6, bombs: 5 },
  yak: { speed: 1.15, health: 8, firepower: 1.1, bombs: 2 },
  partisanTank: { speed: 1.05, health: 110, firepower: 1.1, physical: modelStatistics.partisanTank },
  'stug-iii': { speed: .95, health: 100, firepower: 1.1, physical: modelStatistics['stug-iii'] },
  'm15-42': { speed: .9, health: 80, firepower: .8, physical: modelStatistics['m15-42'] },
  'tiger-i': { speed: .9, health: 120, firepower: 1.3, physical: modelStatistics['tiger-i'] },
  'somua-s35': { speed: .8, health: 60, firepower: .7, physical: modelStatistics['somua-s35'] },
}
