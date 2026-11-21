import { test } from 'node:test'
import assert from 'node:assert/strict'
import World from '/core/World.js'

const recorder = log => name => ({ name, update: () => log.push(name), end: () => log.push(`end ${name}`) })

test('an object removed while the world updates does not make it skip the next one', () => {
  const world = new World()
  const log = []
  const object = recorder(log)
  const second = object('second')
  world.add({ update: () => world.remove(second) }, second, object('third'))
  world.update(1 / 30)
  assert.deepEqual(log, ['second', 'third'])
  assert.equal(world.objects.includes(second), false)
})

test('an object added while the world updates waits for the next update', () => {
  const world = new World()
  const log = []
  const late = recorder(log)('late')
  world.add({ update: () => world.add(late) })
  world.update(1 / 30)
  assert.deepEqual(log, [])
  world.update(1 / 30)
  assert.deepEqual(log, ['late'])
})

test('children are updated with their owner, behind objects come first, and each object ends once', () => {
  const world = new World()
  const log = []
  const object = recorder(log)
  const player = object('player')
  world.add({ ...object('tank'), children: [object('barrel')] }, player)
  world.addBehind(object('crater'))
  world.update(1 / 30)
  assert.deepEqual(log, ['crater', 'tank', 'barrel', 'player'])

  log.length = 0
  world.end(player)
  assert.deepEqual(log, ['end crater', 'end tank', 'end player'])
  assert.deepEqual(world.objects, [])
})

test('controllers take input and decide before the objects, and end with the world', () => {
  const world = new World()
  const log = []
  world.controllers.push({ handleInput: () => log.push('keys'), update: () => log.push('decide'), end: () => log.push('end controller') })
  world.add({ alive: true, handleInput: () => log.push('object input'), update: () => log.push('move'), end: () => log.push('end object') })
  world.handleInput(1 / 30)
  world.update(1 / 30)
  world.end()
  assert.deepEqual(log, ['keys', 'object input', 'decide', 'move', 'end controller', 'end object'])
})
