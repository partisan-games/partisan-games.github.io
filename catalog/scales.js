/**
 * The catalogue shows every block at its natural size (owner, 2026-11-23): the source scale of its group of games, in
 * pixels a metre, which is the largest any game of the group draws; only a game may draw it smaller. Side views and
 * views from above share one scale. See docs/ART.md#razmera.
 */
const sideAndTop = 40
export default { side: sideAndTop, top: sideAndTop, front: 100 }
