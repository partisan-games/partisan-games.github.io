import Maze from '/core3d/mazes/Maze.js'

export const cellSize = 5
const roomSize = cellSize * 2
const compound = cell => cell.row >= 2 && cell.row <= 3 && cell.column >= 2 && cell.column <= 5
const yard = cell => cell.row >= 4 && cell.row <= 5 && cell.column >= 3 && cell.column <= 4

/** A connected maze around a reserved storehouse compound, with one joined roll-call yard. */
export default function campLayout(random = Math.random) {
  const pick = list => list[Math.floor(random() * list.length)]
  const maze = new Maze({ rows: 8, columns: 8, cellSize, algorithm: maze => {
    const visited = new Set([maze.first_cell]), frontier = [maze.first_cell]
    while (frontier.length) {
      const cell = pick(frontier)
      const neighbors = cell.neighbors.filter(next => !compound(next) && !visited.has(next))
      if (!neighbors.length) {
        frontier.splice(frontier.indexOf(cell), 1)
        continue
      }
      const next = pick(neighbors)
      cell.link(next)
      visited.add(next)
      frontier.push(next)
    }
    for (const cell of maze.each_cell()) if (yard(cell))
      for (const next of cell.neighbors) if (yard(next)) cell.link(next)
  } })
  const rooms = [...maze.each_cell()].filter(cell => !compound(cell))
  const walls = []
  const add = (a, b, perimeter = false, enclosure = false) => walls.push({ a, b,
    kind: !perimeter && !enclosure && random() < .32 ? 'timber' : 'wire' })
  for (const cell of maze.each_cell()) {
    const { x, z } = maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1)
    const h = roomSize / 2
    if (!cell.north) add([x - h, z - h], [x + h, z - h], true)
    if (!cell.west) add([x - h, z - h], [x - h, z + h], true)
    for (const [next, a, b] of [[cell.east, [x + h, z - h], [x + h, z + h]],
      [cell.south, [x - h, z + h], [x + h, z + h]]]) {
      if (next && (cell.linked(next) || compound(cell) && compound(next))) continue
      if (!next && cell === maze.last_cell && a[1] === b[1]) {
        // Keep the original exit at (35, 40); its five-metre gate is already open.
        add(a, [x - 2.5, z + h], true)
        add([x + 2.5, z + h], b, true)
      } else add(a, b, !next, compound(cell) || next && compound(next))
    }
  }
  // The second perimeter stands two metres outside the first, leaving the same exit clear.
  for (const [a, b] of [[[-42, -42], [42, -42]], [[-42, -42], [-42, 42]], [[42, -42], [42, 42]],
    [[-42, 42], [32.5, 42]], [[37.5, 42], [42, 42]]]) add(a, b, true)
  const start = maze.tilePosition(1, 1)
  const spawnPoints = rooms.filter(cell => cell !== maze.first_cell && cell !== maze.last_cell).map(cell => {
    const point = maze.tilePosition(cell.row * 2 + 1, cell.column * 2 + 1)
    return { ...point, x: point.x + (random() - .5) * 2.4, z: point.z + (random() - .5) * 2.4 }
  })
  for (let i = spawnPoints.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[spawnPoints[i], spawnPoints[j]] = [spawnPoints[j], spawnPoints[i]]
  }
  return { maze, rooms, walls, start, spawnPoints, storehouse: { x: 0, z: -10, length: 32.3, depth: 9.3 },
    sandbags: [{ x: -8, z: 10, angle: Math.PI / 2 }, { x: 8, z: 10, angle: Math.PI / 2 }],
    gate: { x: 32.5, z: 40 }, towers: [{ x: -35, z: -45, angle: 0 }, { x: 45, z: 28, angle: -Math.PI / 2 }] }
}
