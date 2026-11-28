import { test } from 'node:test'
import assert from 'node:assert/strict'
import { block, wallCourses } from '/core3d/actor/buildings/ConcreteBlock.js'

test('a wall of blocks stands on the ground within its length, each course half a block along from the one under it', () => {
  const places = wallCourses(4, 3)
  const courses = [0, 1, 2].map(course => places.filter(({ y }) => Math.abs(y - block.height * (course + .5)) < 1e-9))
  assert.deepEqual(courses.map(course => course.length), [4, 3, 4])
  assert.equal(courses[0][0].x, -1.5, 'the first block at the end of the wall')
  assert.equal(courses[1][0].x, -1, 'the next course half a block along')
  assert.ok(places.every(({ x }) => Math.abs(x) + block.width / 2 <= 2 + 1e-9), 'none past its ends')
})
