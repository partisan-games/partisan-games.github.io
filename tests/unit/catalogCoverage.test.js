import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'

/**
 * The folders whose every actor, a player or an enemy, has a story in the catalog, and the modules in each that
 * are not actors: a game's own rules and lists, base classes, data and helpers, and the backgrounds, effects and
 * items, which the catalog leaves out (owner's decision); still scenery has its own group, outside these folders.
 */
const folders = {
  'scenes/franjo-kluz': ['Main.js', 'missions.js', 'Airfield.js', 'ParallaxLayer.js', 'AirfieldGuard.js'],
  // a view is seen in the story of its body
  'core/actor/aircraft': ['AircraftPropellers.js', 'propellerArt.js', 'FighterSprite.js', 'DiveBomberSprite.js', 'PotezSprite.js',
    'TopViewSprite.js', 'FighterBomberSprite.js', 'AttackPlaneSprite.js', 'fighterBomberPlanes.js', 'PictureAircraftSprite.js', 'topAircraftArt.js'],
  'core/actor/artillery': ['GunCrew.js', 'crewArt.js', 'FlakSprite.js', 'FieldGunSprite.js', 'MortarSprite.js', 'AntiTankGunSprite.js', 'BunkerSprite.js',
    'ShoreMachineGunSprite.js', 'ShoreDestruction.js', 'shoreNestArt.js'],
  'core/actor/soldiers': ['machineGunnerArt.js', 'RiflemanSprite.js', 'CannonCrewSprite.js', 'MortarCrewSprite.js', 'SkirmisherSprite.js',
    'FlagBearerSprite.js', 'Flag.js', 'MachineGunnerSprite.js', 'GrenadierSprite.js',
    'TrenchSoldierSprite.js', 'PartisanSprite.js', 'FrontEnemySprite.js', 'frontEnemyArt.js', 'frontStandingArt.js'],
  'core/actor/vehicles': ['TankSprite.js', 'VehicleSprite.js', 'GunCarrierSprite.js', 'RoadVehicleSprite.js', 'roadVehicleArt.js'],
  // a bomber's guns are seen in the story of the fighter they fire at
  'core/gameplay/bodies/aircraft': ['wreck.js', 'GunTurrets.js'],
  'core/gameplay/bodies/artillery': ['ArtilleryPiece.js'],
  // the Bunker game's machine gunner lies in the window of the house bunker, whose story shows him (owner's decision)
  'core/gameplay/bodies/soldiers': ['MachineGunner.js'],
  'core/gameplay/bodies/vehicles': ['CannonVehicle.js'],
  'scenes/to-trieste': ['Main.js', 'BattleFeedback.js', 'Route.js', 'Escort.js'],
  'scenes/camac': [
    'Main.js', 'Landing.js', 'Passengers.js', 'ShoreDefenses.js', 'SBoatEncounter.js', 'AirRaids.js', 'BoatCamera.js', 'wreckCollision.js',
    'WaterEffects.js', 'Obala.js', 'coastlines.js', 'Minefield.js',
  ],
  'core/actor/boats': ['HullSprite.js', 'BoatSprite.js', 'SBoatSprite.js', 'PatrolBoatSprite.js', 'SinkingWreck.js', 'SeaMineSprite.js', 'sBoatArt.js'],
  'core/gameplay/bodies/boats': ['SeaMine.js'],
  'scenes/bunker': ['Main.js', 'Mina.js'],
  'scenes/neretva': ['Main.js', 'AirAttack.js', 'Battlefield.js', 'BridgeCrossing.js'],
  // The street tank views reuse the Panzer III and T-34-85 already shown in the catalog.
  'scenes/otpisani': ['Main.js', 'streets.js', 'Panorama.js', 'AmbushView.js', 'CrossingTank.js', 'CrossingArmoredCar.js', 'VehicleGun.js',
    'ThrownGrenade.js', 'ReliefTank.js'],
  'scenes/ustanak': [
    'Main.js', 'startScreen.js', 'Turns.js', 'airTarget.js', 'Battlefield.js', 'GroundLayer.js', 'Terrain.js', 'Wind.js', 'WindEffects.js',
  ],
  'scenes/tenkici': ['Main.js', 'startScreen.js', 'BattleBackground.js', 'renderLayers.js'],
  'scenes/vis': [
    'Main.js', 'startScreen.js', 'settings.js', 'levels.js', 'paths.js', 'formations.js', 'Waves.js', 'Baza.js',
    'Oblak.js', 'PokretnaPozadina.js', 'Pokretno.js', 'PowerUps.js',
  ],
  // PartisanAim is the existing Partisan's aiming configuration; look libraries and mesh dressers are shown
  // through their owning character stories rather than as duplicate actors.
  'core3d/actor/derived/ww2': ['PartisanAim.js', 'partisanLooks.js', 'italianLooks.js', 'shapeM33.js', 'soldierFace.js', 'savoBlouse.js'],
  // the cannon fires through the Ammo physics world, which its stage does not have yet
  'core3d/actor/derived': ['Cannon.js', 'RenaultTracks.js', 'HotchkissTracks.js', 'tankCondition.js'],
  // bases of the planes, a plane's look, and its missile, seen in the planes' stories
  // the planes are looks of the Warplane body, seen in its' stories
  'core3d/aircraft/derived': ['Bomber.js', 'FlyingFortress.js', 'Liberator.js', 'Messerschmitt.js', 'Mitchell.js', 'Spitfire.js'],
}

/** 3D objects that are actors: the towers that fire. */
const modules = []

let kinds

before(async() => {
  createPageElements()
  ;({ default: kinds } = await import('/catalog/stories/index.js'))
})

test('every actor in the covered folders has a story', async() => {
  const shown = new Set(kinds.flatMap(kind => kind.stories.flatMap(story => [story.block,
    ...(story.looks ?? []).filter(look => look.block).map(look => look.block),
  ])))
  for (const [folder, without] of Object.entries(folders))
    for (const file of readdirSync(folder).filter(name => name.endsWith('.js') && !without.includes(name)))
      assert.ok(shown.has(await import(`/${folder}/${file}`)), `${folder}/${file} has no story`)
  for (const path of modules) assert.ok(shown.has(await import(`/${path}`)), `${path} has no story`)
})
