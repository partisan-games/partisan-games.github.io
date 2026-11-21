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
  'scenes/franjo-kluz': ['Main.js', 'missions.js', 'enemies.js', 'Airfield.js', 'ParallaxLayer.js'],
  'core/actor/aircraft': ['AircraftPropellers.js', 'propellerArt.js'],
  'core/actor/artillery': ['GunCrew.js', 'crewArt.js'],
  'core/actor/soldiers': ['machineGunnerArt.js'],
  'core/actor/vehicles': [],
  'core/actor/derived': ['GrenadierSprite.js', 'TopDownPlayerVehicle.js'],
  'scenes/to-trieste': [
    'Main.js', 'AirRaids.js', 'enemyArt.js', 'spaceBunkers.js', 'prepareCombatAssets.js', 'lineOfFire.js',
    'CombatTarget.js', 'CombatLayers.js', 'BattleFeedback.js', 'EnemyFire.js', 'EnemyWeapons.js', 'AimedBarrel.js',
    'AttachedFlame.js', 'Battlefield.js',
  ],
  'scenes/camac': [
    'Main.js', 'Landing.js', 'ShoreDefenses.js', 'SBoatEncounter.js', 'BoatCombat.js', 'BoatCamera.js',
    'wreckCollision.js', 'CombatLife.js', 'CombatTarget.js', 'BoatBullet.js', 'SinkingWreck.js', 'ShoreDestruction.js',
    'WaterEffects.js', 'Obala.js',
  ],
  'scenes/bunker': ['Main.js', 'Mina.js'],
  'scenes/ranjenik': ['Main.js', 'Strelica.js', 'Paljba.js'],
  'scenes/neretva': ['Main.js'],
  'scenes/otpisani': ['Main.js'],
  'scenes/ustanak': [
    'Main.js', 'Turns.js', 'artFrame.js', 'Battlefield.js', 'Djule.js', 'GroundLayer.js', 'Terrain.js',
    'Wind.js', 'WindEffects.js', 'Zastava.js',
  ],
  'scenes/tenkici': ['Main.js', 'Tenk.js', 'shellPhysics.js', 'BattleBackground.js', 'renderLayers.js'],
  'scenes/vis': [
    'Main.js', 'settings.js', 'levels.js', 'aircraft.js', 'paths.js', 'formations.js', 'flame.js', 'Waves.js',
    'PlayerView.js', 'Baza.js', 'Bullet.js', 'Oblak.js', 'PokretnaPozadina.js', 'Pokretno.js',
    'PowerUps.js',
  ],
  'core3d/actor/derived/fantasy': [],
  'core3d/actor/derived/horror': [],
  'core3d/actor/derived/ww2': [],
  // the cannon fires through the Ammo physics world, which its stage does not have yet
  'core3d/actor/derived': ['Cannon.js'],
  // bases of the planes, a plane's look, and its missile, seen in the planes' stories
  'core3d/aircraft': ['Airship.js', 'Warplane.js', 'WarplaneView.js', 'Missile.js'],
  'core3d/aircraft/derived': [],
}

/** 3D objects that are actors: the towers that fire. */
const modules = ['core3d/objects/Tower.js']

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
