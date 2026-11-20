import { test } from 'node:test'
import assert from 'node:assert/strict'
import PathFlight from '/core/gameplay/controllers/PathFlight.js'

/** A body that only records where it is put and the way it faces. */
const fakeBody = () => ({
  x: 0, y: 0, alive: true, facing: null,
  face(direction) {
    this.facing = direction
  },
})

/** Right at 100 px a second for 2 s, then down. */
const position = t => t < 2 ? { x: 100 * t, y: 0 } : { x: 200, y: 100 * (t - 2) }

test('a path flight puts the body at its start at once, and a delayed one behind it on the path', () => {
  const body = fakeBody()
  new PathFlight(body, { position })
  assert.deepEqual([body.x, body.y], [0, 0])

  const late = fakeBody()
  const flight = new PathFlight(late, { position, delay: .5 })
  assert.deepEqual([late.x, late.y], [-50, 0])
  assert.equal(flight.started, false)
  flight.update(.5)
  assert.equal(flight.started, true, 'once its delay has passed')
})

test('a path flight flies the body the same at 30 and 60 frames per second and faces it the way it goes', () => {
  const flyFor = (seconds, fps) => {
    const body = fakeBody()
    const flight = new PathFlight(body, { position })
    for (let i = 0; i < seconds * fps; i++) flight.update(1 / fps)
    return body
  }
  const at60 = flyFor(1, 60), at30 = flyFor(1, 30)
  assert.ok(Math.abs(at60.x - at30.x) < 1e-9 && Math.abs(at60.x - 100) < 1e-9)
  assert.equal(at60.facing, 0, 'right')
  assert.ok(Math.abs(flyFor(3, 60).facing - Math.PI / 2) < 1e-9, 'then down')
})

test('a path flight does not turn a body that stands, and leaves a dead body alone', () => {
  const body = fakeBody()
  const flight = new PathFlight(body, { position: () => ({ x: 5, y: 5 }) })
  flight.update(1)
  assert.equal(body.facing, null)

  const shot = fakeBody()
  const path = new PathFlight(shot, { position })
  shot.alive = false
  path.update(1)
  assert.deepEqual([shot.x, shot.y, path.age], [0, 0, 0])
})
