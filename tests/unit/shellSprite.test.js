import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Shell, ShellSprite, sideProjection

before(async() => {
  createPageElements()
  ;[{ default: Shell }, { default: ShellSprite }, { sideProjection }] = await Promise.all([
    import('/core/gameplay/bodies/projectiles/Shell.js'), import('/core/actor/projectiles/ShellSprite.js'),
    import('/core/actor/projection.js'),
  ])
})

test('a shell and its burst stay drawn in the view of a camera that has moved far along the world', () => {
  const pxPerMeter = 20, camera = { cameraX: 5000, cameraY: 0 }
  const shell = new Shell({ gravity: 0 })
  const view = new ShellSprite(shell, sideProjection({ pxPerMeter, groundY: 100 }), camera)
  // the sizes of the loaded pictures, which a page without images does not give
  Object.assign(view, { width: 16, height: 4 })
  Object.assign(view.smallFlame, { width: 20, height: 20 })
  shell.launch({ x: (camera.cameraX + 10) / pxPerMeter, y: 2, z: 0 }, 0, 0, 20)
  view.update()
  assert.equal(view.shown, true, 'in flight')
  shell.update(0)
  shell.strike({ target: { alive: true, takeHit() {} }, time: 0 })
  view.update()
  assert.equal(view.smallFlame.shown, true, 'bursting')
  camera.cameraX = 1e6
  assert.equal(view.smallFlame.shown, false, 'left behind the view')
})
