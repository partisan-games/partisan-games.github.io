import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Vector from '/core/Vector.js'
import { sudar, unutar } from '/core/utils/sudari.js'
import { nasumicnoOkruglo, nadjiNajdaljeTacke, getRandomCoords } from '/core/utils.js'
import Maze from '/core3d/mazes/Maze.js'
import * as algorithms from '/core3d/mazes/algorithms.js'

let granice, platno

before(async() => {
  createPageElements()
  granice = await import('/core/utils/granice.js')
  platno = document.getElementById('platno')
  platno.width = 800
  platno.height = 600
})

const box = (x, y, size = 10) => ({ x, y, sirina: size, visina: size })

test('Vector measures distance in 3D and set changes only given axes', () => {
  const v = new Vector(1, 2, 3)
  v.set({ y: 0 })
  assert.deepEqual([v.x, v.y, v.z], [1, 0, 3])
  assert.equal(new Vector().razmakDo({ x: 3, y: 4, z: 0 }), 5)
})

test('sudar detects overlap but not boxes that only touch', () => {
  assert.equal(sudar(box(0, 0), box(5, 5)), true)
  assert.equal(sudar(box(0, 0), box(10, 0)), false)
  assert.equal(sudar(box(0, 0), box(50, 50)), false)
})

test('unutar is true only strictly inside the box', () => {
  assert.equal(unutar({ x: 0, y: 0 }, box(0, 0)), true)
  assert.equal(unutar({ x: 5, y: 0 }, box(0, 0)), false)
})

test('screen bounds: leaving and leaving completely differ by half the size', () => {
  const { izasaoDesno, izasaoDesnoSkroz, izasaoGore, vanEkrana, izasaoIgde } = granice
  assert.equal(izasaoDesno(box(platno.width + 1, 0)), true)
  assert.equal(izasaoDesnoSkroz(box(platno.width + 1, 0)), false)
  assert.equal(izasaoDesnoSkroz(box(platno.width + 6, 0)), true)
  assert.equal(izasaoGore(box(10, -1)), true)
  assert.equal(izasaoIgde(box(400, 300)), false)
  assert.equal(vanEkrana(box(400, 300)), false)
})

test('nasumicnoOkruglo returns whole numbers including both limits', () => {
  const results = new Set(Array.from({ length: 500 }, () => nasumicnoOkruglo(1, 3)))
  assert.deepEqual([...results].sort(), [1, 2, 3])
})

test('nadjiNajdaljeTacke returns the two farthest points, left one first', () => {
  const points = [{ x: 5, y: 5 }, { x: 10, y: 0 }, { x: 0, y: 0 }, { x: 6, y: 4 }]
  assert.deepEqual(nadjiNajdaljeTacke(points), [{ x: 0, y: 0 }, { x: 10, y: 0 }])
  assert.deepEqual(nadjiNajdaljeTacke([{ x: 1, y: 1 }]), [])
})

test('getRandomCoords covers the grid inside the margin and respects n', () => {
  const all = getRandomCoords({ width: 300, height: 200, fieldSize: 100 })
  assert.equal(all.length, 6)
  assert.equal(getRandomCoords({ n: 2, width: 300, height: 200, fieldSize: 100 }).length, 2)
})

const reachableCells = maze => {
  const seen = new Set([maze.first_cell])
  const queue = [maze.first_cell]
  while (queue.length)
    for (const next of Object.values(queue.shift().links))
      if (!seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
  return seen.size
}

const linkCount = maze => [...maze.each_cell()].reduce((sum, cell) => sum + cell.links_length, 0) / 2

// recursive division leaves open rooms by design, so it may contain loops
const { recursiveDivision, ...perfectAlgorithms } = algorithms

for (const [name, algorithm] of Object.entries(perfectAlgorithms))
  test(`${name} builds a perfect maze: every cell reachable, no loops`, () => {
    const maze = new Maze({ rows: 8, columns: 6, algorithm })
    assert.equal(reachableCells(maze), maze.size)
    assert.equal(linkCount(maze), maze.size - 1)
  })

test('recursiveDivision leaves every cell reachable', () => {
  const maze = new Maze({ rows: 8, columns: 6, algorithm: recursiveDivision })
  assert.equal(reachableCells(maze), maze.size)
})
