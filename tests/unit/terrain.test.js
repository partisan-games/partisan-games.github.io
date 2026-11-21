import { test } from 'node:test'
import assert from 'node:assert/strict'
import Terrain, { craterProfile } from '/scenes/ustanak/Terrain.js'

const even = () => .5 // the same uneven crater every time, without ragged columns

test('the crater is a shallow uneven bowl, 120 px wide and about 24 px deep', () => {
  const depths = craterProfile(even)
  assert.equal(depths.length, 60)
  const deepest = Math.max(...depths)
  assert.ok(deepest >= 20 && deepest <= 30, `about 24 px deep: ${deepest}`)
  assert.ok(depths[0] <= 4 && depths.at(-1) <= 4, 'its edges are shallow')
  assert.notEqual(depths[10], depths[49], 'it is not a regular half circle')
  assert.ok(depths.every(depth => depth % 2 === 0), 'pixel-art columns')
})

test('a blast cuts a crater into the ground, a blast in it deepens it to the bottom, and switched off ground stays flat', () => {
  const terrain = new Terrain({ floorY: 500, width: 800, bottom: 560, random: even })
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 524)
  assert.ok(terrain.heightAt(150) > 500 && terrain.heightAt(150) < 524)
  assert.equal(terrain.heightAt(39), 500)
  assert.equal(terrain.heightAt(161), 500)
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 548, 'the second crater starts at the bottom of the first')
  terrain.blast(100)
  assert.equal(terrain.heightAt(100), 560, 'never below the bottom of the layer')

  terrain.reset()
  assert.equal(terrain.heightAt(100), 500)
  terrain.enabled = false
  assert.equal(terrain.blast(100), null)
  assert.equal(terrain.heightAt(100), 500)
})
