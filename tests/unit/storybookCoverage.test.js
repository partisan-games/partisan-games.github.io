import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'

/**
 * The folders whose every actor, a player or an enemy, has a story in the storybook, and the modules in each that
 * are not actors: a game's own rules and lists, base classes, data and helpers, and the backgrounds, scenery,
 * effects and items, which the storybook leaves out (owner's decision).
 */
const folders = {
  'scenes/franjo-kluz': ['Main.js', 'missions.js', 'Airfield.js', 'ParallaxLayer.js', 'AirfieldGuard.js'],
  // a view is seen in the story of its body
  'core/actor/aircraft': ['AircraftPropellers.js', 'propellerArt.js', 'FighterSprite.js', 'DiveBomberSprite.js', 'PotezSprite.js',
    'TopViewSprite.js', 'FighterBomberSprite.js', 'AttackPlaneSprite.js', 'fighterBomberPlanes.js', 'PictureAircraftSprite.js'],
  'core/actor/artillery': ['GunCrew.js', 'crewArt.js', 'FlakSprite.js', 'FieldGunSprite.js', 'AntiTankGunSprite.js', 'BunkerSprite.js',
    'ShoreMachineGunSprite.js', 'ShoreDestruction.js'],
  'core/actor/soldiers': ['machineGunnerArt.js', 'RiflemanSprite.js', 'CannonCrewSprite.js', 'SkirmisherSprite.js',
    'FlagBearerSprite.js', 'Flag.js', 'MachineGunnerSprite.js', 'GrenadierSprite.js', 'PatrolSprite.js',
    'TrenchSoldierSprite.js', 'OccupierSprite.js', 'PartisanSprite.js'],
  'core/actor/vehicles': ['TankSprite.js', 'VehicleSprite.js', 'GunCarrierSprite.js'],
  'core/gameplay/bodies/aircraft': ['wreck.js'],
  'core/gameplay/bodies/artillery': [],
  'core/gameplay/bodies/soldiers': [],
  'core/gameplay/bodies/vehicles': ['CannonVehicle.js'],
  'scenes/to-trieste': ['Main.js', 'BattleFeedback.js', 'Route.js', 'Escort.js'],
  'scenes/camac': [
    'Main.js', 'Landing.js', 'Passengers.js', 'ShoreDefenses.js', 'SBoatEncounter.js', 'AirRaids.js', 'BoatCamera.js', 'wreckCollision.js',
    'WaterEffects.js', 'Obala.js', 'coastlines.js', 'Minefield.js',
  ],
  'core/actor/boats': ['HullSprite.js', 'BoatSprite.js', 'SBoatSprite.js', 'PatrolBoatSprite.js', 'SinkingWreck.js', 'SeaMineSprite.js'],
  'core/gameplay/bodies/boats': [],
  'scenes/bunker': ['Main.js', 'Mina.js'],
  'scenes/ranjenik': ['Main.js', 'Strelica.js', 'Paljba.js'],
  'scenes/neretva': ['Main.js', 'AirAttack.js'],
  'scenes/otpisani': ['Main.js'],
  'scenes/ustanak': [
    'Main.js', 'Turns.js', 'Battlefield.js', 'GroundLayer.js', 'Terrain.js', 'Wind.js', 'WindEffects.js',
  ],
  'scenes/tenkici': ['Main.js', 'BattleBackground.js', 'renderLayers.js'],
  'scenes/vis': [
    'Main.js', 'settings.js', 'levels.js', 'paths.js', 'formations.js', 'Waves.js', 'Baza.js',
    'Oblak.js', 'PokretnaPozadina.js', 'Pokretno.js', 'PowerUps.js',
  ],
  'core3d/actor/derived/fantasy': [],
  'core3d/actor/derived/horror': [],
  'core3d/actor/derived/ww2': [],
  // the cannon fires through the Ammo physics world, which its stage does not have yet
  'core3d/actor/derived': ['Cannon.js'],
  // bases of the planes, a plane's look, and its missile, seen in the planes' stories
  // the planes are looks of the Warplane and Airship bodies, seen in those bodies' stories
  'core3d/aircraft/derived': ['Dirigible.js', 'Biplane.js', 'Bomber.js', 'F18.js', 'Messerschmitt.js', 'Triplane.js'],
}

/** 3D objects that are actors: the towers that fire. */
const modules = []

let kinds

before(async() => {
  createPageElements()
  ;({ default: kinds } = await import('/storybook/stories/index.js'))
})

test('every actor in the covered folders has a story', async() => {
  const shown = new Set(kinds.flatMap(kind => kind.stories.map(story => story.block)))
  for (const [folder, without] of Object.entries(folders))
    for (const file of readdirSync(folder).filter(name => name.endsWith('.js') && !without.includes(name)))
      assert.ok(shown.has(await import(`/${folder}/${file}`)), `${folder}/${file} has no story`)
  for (const path of modules) assert.ok(shown.has(await import(`/${path}`)), `${path} has no story`)
})
