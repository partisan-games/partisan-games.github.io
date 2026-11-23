import { separateModels } from './catalogEntries.js'
import Stage3D from '../Stage3D.js'
import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three'
import Body from '/core/gameplay/bodies/Body.js'
import * as biplaneModule from '/core3d/aircraft/derived/Biplane.js'
import * as bomberModule from '/core3d/aircraft/derived/Bomber.js'
import * as f18Module from '/core3d/aircraft/derived/F18.js'
import * as messerschmittModule from '/core3d/aircraft/derived/Messerschmitt.js'
import * as triplaneModule from '/core3d/aircraft/derived/Triplane.js'
import * as dirigibleModule from '/core3d/aircraft/derived/Dirigible.js'
import * as airshipModule from '/core/gameplay/bodies/aircraft/Airship.js'
import * as towerModule from '/core/gameplay/bodies/buildings/Tower.js'
import * as warplaneModule from '/core/gameplay/bodies/aircraft/Warplane.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel } from '/core3d/actor/buildings/buildingModels.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import * as cannonModule from '/core3d/actor/derived/Cannon.js'
import Crew, { models as crewModels } from '/core3d/actor/artillery/Crew.js'

/** The crew of each field gun on the stage, and whether its loader is loading a round. */
const drills = new WeakMap()

/**
 * The field gun of Battle for Jablanica with its crew, facing the camera's right; it does not fire a shell here. Dead,
 * its crew has fallen beside it, as in the game.
 */
const fieldGun = async stage => {
  await requestModels([...cannonModule.models, ...crewModels])
  const { body, model } = makeCharacter(cannonModule.description, { yaw: Math.PI / 2 })
  const drill = { crew: new Crew(model.mesh), loading: false, update(dt) {
    if (body.dead) for (const member of this.crew.members)
      if (member.health.alive) this.crew.hit(member, member.health.current, stage.scene)
    this.crew.update(dt, 0, this.loading)
    if (this.crew.ready) this.loading = false
  } }
  // added with the gun, as a stage given only objects without a mesh hands three.js nothing to add
  stage.add(body, model, drill)
  drills.set(body, drill)
  return body
}

/** The loader brings a round to the breech and pushes it in. */
const loadGun = gun => {
  drills.get(gun).loading = true
}

/** A loaded gun recoils, its crew flinches, and the loader needs a new round. */
const recoil = gun => {
  const { crew } = drills.get(gun)
  if (crew.ready) crew.fired()
}

/** The warplane low over the stage, flying on in place, far enough ahead for the stage's camera to see it whole. */
const warplane = async(stage, way, look) => {
  await requestModels(look.models)
  const { body, model } = makeWarplane(look.description, { clock: stage.session.clock, height: 3, limit: 10, z: -12 })
  stage.add(body, model)
  return body
}

/** The tower in the middle with its gun on top; with no target in reach, it holds fire. */
const gunTower = async stage => {
  await requestModels([towerModel])
  const mesh = loadedModel(towerModel)
  const size = modelSize(mesh)
  const body = new towerModule.default({ clock: stage.session.clock, size, y: size.height / 2 })
  stage.add(body, new BuildingModel(body, { mesh }))
  return body
}

/** Put a visible practice target beside the tower for one burst from its normal gun. */
const offerTarget = (tower, stage) => {
  if (tower.dead || tower.target) return
  const radius = tower.size.height * .055
  const target = new Body({ x: tower.x + tower.size.height * .60, y: tower.muzzle.y * .85, z: tower.z,
    health: tower.gun.damage, size: { length: radius * 2, height: radius * 2, width: radius * 2 } })
  const mesh = new Mesh(new SphereGeometry(radius), new MeshBasicMaterial({ color: 0xd7a030, wireframe: true }))
  mesh.position.set(target.x, target.y, target.z)
  tower.targets.splice(0, tower.targets.length, target)
  const marker = { mesh, update() {
    if (target.dead) {
      stage.remove(marker)
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
  } }
  stage.add(marker)
}

/** The looks of a warplane: each plane of the game Warplane. */
const planes = [
  ['dvokrilac', 'Dvokrilac', biplaneModule], ['trokrilac', 'Trokrilac', triplaneModule],
  ['mesersmit', 'Mesersmit', messerschmittModule], ['bombarder', 'Bombarder', bomberModule], ['f18', 'F-18', f18Module],
].map(([id, name, value]) => ({ id, name, value }))

export const aircraft = [
  { id: 'ratni-avion-3d', name: 'Ratni avion', game: 'Warplane', block: warplaneModule, stage: Stage3D, looks: planes, create: warplane,
    modelIds: { dvokrilac: 'dvokrilac-3d', trokrilac: 'trokrilac-3d', mesersmit: 'mesersmit-3d', bombarder: 'bombarder-3d', f18: 'f18-3d' },
    commands: [{ label: 'Pomeri udesno', run: plane => plane.steer({ across: 1 }) },
      { label: 'Ispali raketu', run: plane => plane.fire() }, { label: 'Sleti', run: plane => plane.land() }] },
  { id: 'dirizabl-3d', name: 'Dirižabl', game: 'Zeppelin', block: airshipModule, stage: Stage3D,
    // the airship flies on alone, rising to its clearance above the floor
    create: async stage => {
      await requestModels(dirigibleModule.models)
      const { body, model } = dirigibleModule.default()
      body.y = body.size.height / 2 + 3
      model.place()
      stage.add(body, model)
      return body
    } },
].flatMap(story => story.looks ? separateModels(story) : [story])

export const artillery = [
  { id: 'poljski-top-3d', name: 'Poljski top sa posadom', game: 'Battle for Jablanica', block: cannonModule, stage: Stage3D,
    create: fieldGun, commands: [{ label: 'Napuni', run: loadGun }, { label: 'Trzaj', run: recoil }] },
]

export const towers = [
  { id: 'kula-3d', name: 'Kula sa topom', game: 'Warplane, FPS Airport', block: towerModule, stage: Stage3D, create: gunTower,
    commands: [{ label: 'Postavi metu', run: offerTarget }] },
]
