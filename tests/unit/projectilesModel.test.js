import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import GameClock from '/core/runtime/GameClock.js'
import Tower from '/core/gameplay/bodies/buildings/Tower.js'
import Warplane from '/core/gameplay/bodies/aircraft/Warplane.js'

test('the rounds of a gun show where they fly, one mesh each, and hide once spent; a tower draws them beside it', async() => {
  createPageElements()
  const { Group, Mesh, BoxGeometry, Scene } = await import('three')
  const { default: ProjectilesModel } = await import('/core3d/actor/ProjectilesModel.js')
  const { default: BuildingModel } = await import('/core3d/actor/buildings/BuildingModel.js')
  const clock = new GameClock(), plane = new Warplane({ clock, y: 20 })
  const tower = new Tower({ clock, targets: [plane], size: { length: 4, height: 10, width: 4 } })
  const scene = new Scene(), view = new BuildingModel(tower, { mesh: new Group().add(new Mesh(new BoxGeometry())) })
  scene.add(view.mesh)
  for (let i = 0; i < 3; i++) {
    clock.advance(.6)
    tower.update(.6)
    view.update(.6, i)
  }
  const tracers = view.rounds.mesh.children
  assert.equal(view.rounds.mesh.parent, scene, 'the rounds fly in the world, not on the building')
  assert.equal(tracers.length, tower.rounds.projectiles.length)
  const [round] = tower.rounds.projectiles
  assert.deepEqual(tracers[0].position.toArray(), [round.x, round.y, round.z])
  tower.targets = []
  tower.update(.1)
  view.update(.1, 3)
  assert.ok(tracers.every(tracer => !tracer.visible), 'spent rounds are hidden')

  const plain = new ProjectilesModel(tower)
  plain.update()
  assert.equal(plain.mesh.children.length, tower.rounds.projectiles.length)
  view.end()
  assert.equal(view.rounds.mesh.parent, null)
})

test('a tracer\'s trail grows from the muzzle to its full length as the round flies', async() => {
  createPageElements()
  const { default: ProjectilesModel, trailLength } = await import('/core3d/actor/ProjectilesModel.js')
  const { default: GunTurrets } = await import('/core/gameplay/bodies/aircraft/GunTurrets.js')
  const clock = new GameClock(), guns = new GunTurrets({ plane: new Warplane({ clock }), clock })
  const view = new ProjectilesModel(guns)
  guns.firing = true
  guns.update(1 / 30)
  guns.firing = false
  const trail = () => {
    view.update()
    return view.mesh.children[0].getObjectByName('trail').scale.z
  }
  const [round] = guns.rounds.projectiles
  const flown = Math.hypot(round.vx, round.vy, round.vz) * round.stateTime
  assert.ok(flown < trailLength && Math.abs(trail() - flown / trailLength) < 1e-6, 'it reaches back only to the muzzle')
  for (let i = 0; i < 6; i++) guns.update(1 / 30)
  assert.equal(trail(), 1)
})
