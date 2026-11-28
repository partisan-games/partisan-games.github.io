import Stage3D from '../Stage3D.js'
import Dummy from '../Dummy.js'
import { playerControls } from '../playerControls.js'
import * as bomberModule from '/core3d/aircraft/derived/Bomber.js'
import * as flyingFortressModule from '/core3d/aircraft/derived/FlyingFortress.js'
import * as liberatorModule from '/core3d/aircraft/derived/Liberator.js'
import * as mitchellModule from '/core3d/aircraft/derived/Mitchell.js'
import { lancasterLooks, mitchellLooks } from '/core3d/actor/aircraft/bomberLooks.js'
import { liberatorLooks } from '/core3d/actor/aircraft/liberatorLooks.js'
import * as spitfireModule from '/core3d/aircraft/derived/Spitfire.js'
import * as messerschmittModule from '/core3d/aircraft/derived/Messerschmitt.js'
import * as towerModule from '/core/gameplay/bodies/buildings/Tower.js'
import * as warplaneModule from '/core/gameplay/bodies/aircraft/Warplane.js'
import * as interceptorModule from '/core/gameplay/bodies/aircraft/Interceptor.js'
import GunTurrets from '/core/gameplay/bodies/aircraft/GunTurrets.js'
import WarplaneKeys from '/core/gameplay/controllers/WarplaneKeys.js'
import { inputLayouts } from '/core/io/inputLayouts.js'
import { requestModels, loadedModel } from '/core3d/assets/models.js'
import makeWarplane from '/core3d/actor/aircraft/makeWarplane.js'
import makeInterceptor from '/core3d/actor/aircraft/makeInterceptor.js'
import ProjectilesModel from '/core3d/actor/ProjectilesModel.js'
import BuildingModel from '/core3d/actor/buildings/BuildingModel.js'
import { towerModel } from '/core3d/actor/buildings/buildingModels.js'
import { modelSize } from '/core3d/actor/characters/CharacterModel.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import * as cannonModule from '/core3d/actor/derived/Cannon.js'
import * as mortarModule from '/core3d/actor/artillery/MortarCrew.js'
import Crew, { models as crewModels } from '/core3d/actor/artillery/Crew.js'
import GunHit from '/core3d/actor/artillery/GunHit.js'
import FieldGunDamage from '/core3d/actor/artillery/FieldGunDamage.js'

/** Seconds the loaded field gun waits before it recoils. */
const firingPause = 1
/**
 * How the bomber's stand-in fighter circles it: radians a second, and how far ahead and behind, above and below, and
 * to either side it goes, in metres.
 */
const circling = { turn: .4, ahead: 40, above: 25, across: 15 }

/**
 * The field gun of Battle for Jablanica with its crew, facing the camera's right; it does not fire a shell here. Here
 * its health is the gun's own, not its crew's as in the game: destroyed, it lies broken and charred, and its crew,
 * whom only a hit on the crew brings down, kneels on beside the wreck.
 */
const fieldGun = async stage => {
  await requestModels([...cannonModule.models, ...crewModels], { parallelAnimations: true })
  const { body, model } = makeCharacter(cannonModule.description, { yaw: Math.PI / 2 })
  const hit = new GunHit(body, model.mesh, { detailed: true })
  const damage = new FieldGunDamage(body, model.mesh)
  // the crew loads, and a second after the round is in the gun recoils, again and again while it stands
  const drill = { crew: new Crew(model.mesh), loading: true, sinceReady: 0, update(dt) {
    // The crew remains independent when the carriage collapses.
    if (body.dead && !this.wrecked) {
      this.wrecked = true
      this.loading = false
      for (const { mesh } of this.crew.members) stage.scene.attach(mesh)
    }
    this.crew.update(dt, 0, this.loading)
    if (!this.crew.ready || body.dead) return
    this.loading = false
    this.sinceReady += dt
    if (this.sinceReady < firingPause) return
    this.crew.fired()
    this.sinceReady = 0
    this.loading = true
  } }
  // added with the gun, as a stage given only objects without a mesh hands three.js nothing to add; the drill goes
  // before the gun's model, so the crew is off a destroyed gun before the model draws it as a wreck
  stage.add(body, drill, model, hit, { update: dt => damage.update(dt), end: () => damage.end() })
  return body
}

/**
 * A fighter of `plane`'s module flying on in place, as the bombers do, at an unseen stand-in for the bomber ahead of it and off to its side:
 * attacking, it turns at the stand-in and fires when it has it in its sights; pulling away or moving, it flies on;
 * landing, it glides down and rolls to a stop; shot down, it falls.
 */
const fighter = plane => async stage => {
  await requestModels(plane.models, { parallelAnimations: true })
  const place = { x: 0, z: -12 }
  const standIn = new Dummy({ x: 30, y: 25, z: -110, size: { length: 20, height: 5, width: 30 } })
  const { body, model, guns } = makeInterceptor(plane.description,
    { target: standIn, clock: stage.session.clock, ...place, y: 20 })
  stage.add(body, model, guns)
  stage.controllers.push({ update: () => Object.assign(body, place) })
  // the game's keys fly it and fire its guns, as the warplanes are flown
  playerControls(stage, input => new WarplaneKeys(body, input), inputLayouts.warplane)
  return body
}

/**
 * A bomber of Ratweek, of `plane`'s module, over the stage, flying on in place, flown with the game's own controls: the arrows steer it,
 * Space fires a rocket and C, held, its guns, on the keyboard or the buttons on the screen. Its guns fire at an unseen
 * stand-in for a fighter circling it, ahead, above and behind in turn, so each turret's arc shows.
 */
const bomber = (plane, looks) => async(stage, _way, look) => {
  await requestModels(plane.models, { parallelAnimations: true })
  const { body, model } = makeWarplane(plane.description, { clock: stage.session.clock, height: 20, limit: 10, z: -12 })
  if (looks) {
    stage.setLook = await looks(model.mesh, stage.session.scope)
    stage.setLook(look)
  }
  const guns = new GunTurrets({ plane: body, clock: stage.session.clock, turrets: plane.description.turrets })
  stage.add(body, model, guns, new ProjectilesModel(guns, { shotSound: 'aircraft-gun.mp3' }))
  playerControls(stage, input => new WarplaneKeys(body, input, guns), inputLayouts.warplane)
  const fighter = new Dummy({ size: { length: 9, height: 3, width: 10 } })
  guns.targets.push(fighter)
  let around = 0
  stage.controllers.push({ update(dt) {
    around += dt * circling.turn
    Object.assign(fighter, { x: body.x + Math.sin(around * 2) * circling.across,
      y: body.y + Math.sin(around) * circling.above, z: body.z - Math.cos(around) * circling.ahead })
  } })
  return body
}

/** The tower in the middle with its gun on top, firing at an unseen stand-in beside it that never falls. */
const gunTower = async stage => {
  await requestModels([towerModel], { parallelAnimations: true })
  const mesh = loadedModel(towerModel)
  const size = modelSize(mesh)
  const body = new towerModule.default({ clock: stage.session.clock, size, y: size.height / 2 })
  body.targets.push(new Dummy({ x: body.x + size.height * .6, y: body.muzzle.y * .85, z: body.z }))
  stage.add(body, new BuildingModel(body, { mesh }))
  return body
}

export const aircraft = [
  { id: 'bombarder-3d', aliases: ['ratni-avion-3d/bombarder'], name: 'Bombarder Avro Lancaster', game: 'Operation Ratweek', block: warplaneModule,
    stage: Stage3D, looks: [{ id: 'pixel-art', name: 'Pixel art', value: true }, { id: 'original', name: 'Osnovna' }],
    create: bomber(bomberModule, lancasterLooks) },
  { id: 'bombarder-b-17-3d', name: 'Bombarder B-17 Flying Fortress', game: 'Operation Ratweek', block: warplaneModule, stage: Stage3D,
    create: bomber(flyingFortressModule) },
  { id: 'bombarder-b-24-3d', name: 'Bombarder B-24 Liberator', game: 'Operation Ratweek', block: warplaneModule, stage: Stage3D,
    looks: [{ id: 'original', name: 'Osnovna' }, { id: 'pixel-art', name: 'Pixel art', value: true }],
    create: bomber(liberatorModule, liberatorLooks) },
  { id: 'bombarder-b-25-3d', name: 'Bombarder B-25 Mitchell', game: 'Operation Ratweek', block: warplaneModule, stage: Stage3D,
    looks: [{ id: 'pixel-art', name: 'Pixel art', value: true }, { id: 'original', name: 'Osnovna' }],
    create: bomber(mitchellModule, mitchellLooks) },
  { id: 'lovac-bf-109-3d', aliases: ['mesersmit-3d', 'ratni-avion-3d', 'ratni-avion-3d/mesersmit'], name: 'Messerschmitt Bf 109',
    game: 'Operation Ratweek', block: interceptorModule, stage: Stage3D,
    create: fighter(messerschmittModule) },
  { id: 'lovac-spitfire-3d', name: 'Lovac Supermarine Spitfire', game: 'Zajednička biblioteka', block: interceptorModule,
    stage: Stage3D, create: fighter(spitfireModule) },
]

export const artillery = [
  { id: 'poljski-top-3d', name: 'Poljski top 75 mm sa posadom', game: 'Battle for Jablanica', block: cannonModule, stage: Stage3D,
    create: fieldGun },
  { id: 'minobacac-81-3d', name: 'Italijanski minobacač sa posadom', game: 'Battle for Jablanica (proba posade)',
    block: mortarModule, stage: Stage3D, create: async stage => {
      await requestModels(mortarModule.models, { parallelAnimations: true })
      const block = new mortarModule.default()
      block.mesh.rotation.y = .95
      stage.add(block)
      return block
    } },
]

export const towers = [
  { id: 'kula-3d', name: 'Kula sa topom', game: 'Operation Ratweek, FPS Airport', block: towerModule, stage: Stage3D, create: gunTower,
    catalogGroup: ['Scenografija', 'Zgrade'] },
]
