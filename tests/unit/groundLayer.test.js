import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import Terrain from '/scenes/ustanak/Terrain.js'
import GroundLayer from '/scenes/ustanak/GroundLayer.js'

before(createPageElements)

const even = () => .5 // the same uneven crater every time, without ragged columns

test('the ground layer cuts the same crater floors that Terrain digs', t => {
  const fills = []
  const recorder = {
    globalCompositeOperation: 'source-over',
    clearRect() {},
    createPattern: () => ({ setTransform() {} }),
    fillRect(x, y, width, height) {
      fills.push({ operation: this.globalCompositeOperation, x, y, width, height })
    },
  }
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => recorder)
  const terrain = new Terrain({ floorY: 500, width: 800, random: even })
  const layer = new GroundLayer({ width: 800, height: 600, floorY: 500 })
  terrain.view = layer
  const cut = terrain.blast(100)
  layer.redraw()
  const holes = fills.filter(fill => fill.operation === 'destination-out')
  assert.equal(holes.length, cut.floors.length)
  holes.forEach((hole, i) => {
    assert.equal(hole.x, cut.left + i * 2)
    assert.equal(hole.height, cut.floors[i] - 7, 'the visible hole ends 7 px above the floor, like the grass above the ground line')
    assert.equal(terrain.heightAt(hole.x), cut.floors[i])
  })
  terrain.reset()
  fills.length = 0
  layer.redraw()
  assert.equal(fills.filter(fill => fill.operation === 'destination-out').length, 0, 'a new round has a whole layer')
})
