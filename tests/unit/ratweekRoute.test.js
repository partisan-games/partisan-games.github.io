import { test } from 'node:test'
import assert from 'node:assert/strict'
import { warplane } from '/core/gameplay/bodies/aircraft/Warplane.js'
import { bridges, heightAt, landmarks, onBridge, railwayAt, riverAt, river, routeLength, towns, valleyAt } from '/scenes/ratweek/route.js'

test('the railway keeps to dry ground and crosses the river only on its bridges', () => {
  assert.ok(bridges.length >= 8, `${bridges.length} bridges`)
  for (let u = 0; u < routeLength; u += 2)
    if (!onBridge(u)) assert.ok(heightAt(railwayAt(u), u) > -.3, `the track at ${u} is not in the river`)
  for (const { u } of bridges) assert.ok(Math.abs(riverAt(u) - railwayAt(u)) < 1, 'each bridge stands where the river crosses')
})

test('the hills under the bomber stay well below its height, and rise higher beyond its reach', () => {
  for (let u = 0; u < routeLength; u += 25) {
    for (let x = -200; x <= 200; x += 10) assert.ok(heightAt(x, u) < warplane.height - 15, `${x}, ${u}`)
    assert.ok(heightAt(valleyAt(u).floor + 200, u) > 30, 'hills close the valley')
  }
})

test('the towns, their stations, trains and factories stand on dry ground off the railway, the same each game', () => {
  const things = landmarks()
  assert.deepEqual(landmarks(), things)
  for (const kind of ['house', 'station', 'train', 'factory', 'bridge', 'tower'])
    assert.ok(things.some(thing => thing.kind === kind), kind)
  for (const { kind, u, x } of things) {
    if (kind === 'bridge') continue
    assert.ok(Math.abs(x - riverAt(u)) > river.half + river.banks, `the ${kind} at ${Math.round(u)} is out of the river`)
    if (kind !== 'train') assert.ok(Math.abs(x - railwayAt(u)) > 10, `the ${kind} at ${Math.round(u)} is off the railway`)
  }
  // each house keeps a yard clear round it, wider than its corners reach, however it is turned
  const houses = things.filter(({ kind }) => kind === 'house')
  assert.ok(houses.length > 200, `${houses.length} houses`)
  houses.forEach((a, i) => houses.slice(i + 1).forEach(b => assert.ok(
    Math.hypot(a.u - b.u, a.x - b.x) >= Math.hypot(a.width, a.depth) / 2 + Math.hypot(b.width, b.depth) / 2, 'houses apart')))
  for (const town of towns) {
    const middle = (town.from + town.to) / 2
    for (let u = middle - 130; u <= middle + 130; u += 2) assert.ok(!onBridge(u), `the station of ${town.name} is off the bridges`)
  }
})
