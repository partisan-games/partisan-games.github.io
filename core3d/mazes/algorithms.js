import { sample } from '/core3d/helpers.js'

export function aldousBroder(maze) {
  let cell = maze.random_cell
  let unvisited = maze.size - 1

  while (unvisited) {
    const neighbor = sample(cell.neighbors)
    if (!neighbor.links_length) {
      cell.link(neighbor)
      unvisited -= 1
    }
    cell = neighbor
  }
}

export function wilsons(maze) {
  let unvisited = []
  for (const cell of maze.each_cell()) unvisited.push(cell)

  const first = sample(unvisited)
  unvisited = unvisited.filter(cell => cell.id !== first.id)

  while (unvisited.length) {
    let cell = sample(unvisited)
    let path = [cell]

    while (unvisited.some(x => x.id === cell.id)) {
      const { neighbors } = cell
      cell = sample(neighbors)
      const index = path.findIndex(x => x.id === cell.id)
      if (index !== -1)
        path = path.slice(0, index + 1)
      else
        path.push(cell)
    }

    for (let i = 0; i <= path.length - 2; i += 1) {
      path[i].link(path[i + 1])
      unvisited = unvisited.filter(cell => cell.id !== path[i].id)
    }
  }
}

/* RECURSIVE BACKTRACKER (depth-first search) */

export function recursiveBacktracker(maze, start_at = maze.random_cell) {
  const stack = [start_at]

  while (stack.length) {
    const current = stack[stack.length - 1]
    const neighbors = current.neighbors.filter(cell => cell.unvisited)
    if (!neighbors.length)
      stack.pop()
    else {
      const neighbor = sample(neighbors)
      current.link(neighbor)
      stack.push(neighbor)
    }
  }
}

/* PRIM'S */

export function truePrims(maze, start_at = maze.random_cell) {
  let active = []
  active.push(start_at)
  const costs = {}

  for (const cell of maze.each_cell())
    costs[cell.id] = Math.floor(Math.random() * 100)

  while (active.length) {
    active.sort((a, b) => costs[a.id] - costs[b.id])
    const cell = active[0]
    const available_neighbors = cell.neighbors.filter(c => c.unvisited)
    if (available_neighbors.length) {
      available_neighbors.sort((a, b) => costs[a.id] - costs[b.id])
      const neighbor = available_neighbors[0]
      cell.link(neighbor)
      active.push(neighbor)
    } else
      active = active.filter(c => c.id !== cell.id)
  }
}

/* ELER'S */

function divide(maze, row, column, height, width) {
  if (height <= 1 || width <= 1 || height < 5 && width < 5 && Math.random() < 0.25) return

  if (height > width)
    divide_horizontally(maze, row, column, height, width)
  else
    divide_vertically(maze, row, column, height, width)
}

function divide_horizontally(maze, row, column, height, width) {
  const divide_south_of = Math.floor(Math.random() * (height - 1))
  const passage_at = Math.floor(Math.random() * width)

  for (let x = 0; x < width; x += 1) {
    if (passage_at === x) continue
    const cell = maze.cell(row + divide_south_of, column + x)
    cell.unlink(cell.south)
  }

  divide(maze, row, column, divide_south_of + 1, width)
  divide(maze, row + divide_south_of + 1, column, height - divide_south_of - 1, width)
}

function divide_vertically(maze, row, column, height, width) {
  const divide_east_of = Math.floor(Math.random() * (width - 1))
  const passage_at = Math.floor(Math.random() * height)

  for (let y = 0; y < height; y += 1) {
    if (passage_at === y) continue
    const cell = maze.cell(row + y, column + divide_east_of)
    cell.unlink(cell.east)
  }

  divide(maze, row, column, height, divide_east_of + 1)
  divide(maze, row, column + divide_east_of + 1, height, width - divide_east_of - 1)
}

export function recursiveDivision(maze) {
  for (const cell of maze.each_cell())
    cell.neighbors.forEach(c => cell.link(c, false)) // removing all interior walls

  divide(maze, 0, 0, maze.rows, maze.columns)
}
