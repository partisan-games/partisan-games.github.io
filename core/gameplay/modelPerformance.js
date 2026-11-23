/**
 * How each model moves and fights, the values agreed for the games from docs/STATISTIKE.md, shared by its 2D and 3D
 * views. Speed and firepower are shares of the plain body of its kind, health the hits it takes; a model not listed
 * moves and fights as the plain one.
 */
export const modelPerformance = {
  spitfire: { speed: 1.1, health: 9, firepower: 1.2, bombs: 2 },
  hurricane: { speed: 1, health: 12, firepower: 1.3, bombs: 4 },
  breguet: { speed: .7, health: 12, firepower: .6, bombs: 5 },
  yak: { speed: 1.15, health: 8, firepower: 1.1, bombs: 2 },
}
