import Stage3D from '../Stage3D.js'
import { requestModels } from '/core3d/assets/models.js'
import makeCharacter from '/core3d/actor/characters/makeCharacter.js'
import * as barbarianModule from '/core3d/actor/derived/fantasy/Barbarian.js'
import * as bigfootModule from '/core3d/actor/derived/fantasy/Bigfoot.js'
import * as demonModule from '/core3d/actor/derived/fantasy/Demon.js'
import * as goblinModule from '/core3d/actor/derived/fantasy/Goblin.js'
import * as golemModule from '/core3d/actor/derived/fantasy/Golem.js'
import * as ironGiantModule from '/core3d/actor/derived/fantasy/IronGiant.js'
import * as orcModule from '/core3d/actor/derived/fantasy/Orc.js'
import * as orcOgreModule from '/core3d/actor/derived/fantasy/OrcOgre.js'
import * as skeletonModule from '/core3d/actor/derived/fantasy/Skeleton.js'
import * as sorceressModule from '/core3d/actor/derived/fantasy/Sorceress.js'
import * as trollModule from '/core3d/actor/derived/fantasy/Troll.js'
import * as witchModule from '/core3d/actor/derived/fantasy/Witch.js'
import * as wizardModule from '/core3d/actor/derived/fantasy/Wizard.js'
import * as ghostModule from '/core3d/actor/derived/horror/Ghost.js'
import * as gothGirlModule from '/core3d/actor/derived/horror/GothGirl.js'
import * as nudeVictimModule from '/core3d/actor/derived/horror/NudeVictim.js'
import * as zombieBarefootModule from '/core3d/actor/derived/horror/ZombieBarefoot.js'
import * as zombieCopModule from '/core3d/actor/derived/horror/ZombieCop.js'
import * as zombieDoctorModule from '/core3d/actor/derived/horror/ZombieDoctor.js'
import * as zombieDoctorCrawlModule from '/core3d/actor/derived/horror/ZombieDoctorCrawl.js'
import * as zombieGuardModule from '/core3d/actor/derived/horror/ZombieGuard.js'
import * as germanFlameThrowerModule from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import * as germanMachineGunnerModule from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import * as germanSoldierModule from '/core3d/actor/derived/ww2/GermanSoldier.js'
import * as naziAgentModule from '/core3d/actor/derived/ww2/NaziAgent.js'
import * as naziOfficerModule from '/core3d/actor/derived/ww2/NaziOfficer.js'
import * as partisanModule from '/core3d/actor/derived/ww2/Partisan.js'
import * as partisanAimModule from '/core3d/actor/derived/ww2/PartisanAim.js'
import * as partisanLowpolyModule from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import * as resistanceFighterModule from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import * as sSSoldierModule from '/core3d/actor/derived/ww2/SSSoldier.js'
import * as soldierModule from '/core3d/actor/derived/ww2/Soldier.js'
import * as sovietPartisanModule from '/core3d/actor/derived/ww2/SovietPartisan.js'
import * as workerModule from '/core3d/actor/derived/ww2/Worker.js'
import * as elephantModule from '/core3d/actor/derived/Elephant.js'
import * as flamingoModule from '/core3d/actor/derived/Flamingo.js'
import * as tankModule from '/core3d/actor/derived/Tank.js'
import * as zeppelinModule from '/core3d/actor/derived/Zeppelin.js'

/** A character no game uses yet stays in the shared library, ready for one. */
const library = 'Zajednička biblioteka'

/**
 * A story of a 3D character, with its model and weapon as its games have them. A 3D block needs its models loaded
 * before it is made. A character with a description is its body and model, with no controller, so a state it is set
 * to lasts until another is set; one without is still the earlier actor that the player leads.
 */
const character = (id, name, game, block, Character) => ({
  id, name, game, block, stage: Stage3D,
  create: async stage => {
    await requestModels(block.models)
    if (block.description) {
      const { body, model } = makeCharacter(block.description)
      stage.add(body, model)
      return body
    }
    const actor = new Character({ controller: null })
    stage.add(actor)
    return actor
  },
})

export const fantasy = [
  character('varvarin-3d', 'Varvarin', 'RPG Fantasy', barbarianModule),
  character('snezni-covek-3d', 'Snežni čovek', library, bigfootModule),
  character('demon-3d', 'Demon', 'Minas Tirith', demonModule),
  character('goblin-3d', 'Goblin', library, goblinModule),
  character('golem-3d', 'Golem', 'Follow', golemModule),
  character('gvozdeni-div-3d', 'Gvozdeni div', library, ironGiantModule),
  character('ork-3d', 'Ork', library, orcModule),
  character('ork-div-3d', 'Ork div', library, orcOgreModule),
  { ...character('kostur-3d', 'Kostur', library, skeletonModule),
    commands: [{ label: 'Hod / lebdenje', run: body => body.steer({ ahead: 1, running: !body.running }) }] },
  character('carobnica-3d', 'Čarobnica', 'Follow, Graveyard Survival, Walls', sorceressModule),
  character('trol-3d', 'Trol', library, trollModule),
  character('vestica-3d', 'Veštica', 'Ruins', witchModule),
  character('carobnjak-3d', 'Čarobnjak', library, wizardModule),
]

export const horror = [
  character('duh-3d', 'Duh', 'Graveyard Survival', ghostModule),
  character('gotska-devojka-3d', 'Gotska devojka', 'Graveyard Survival', gothGirlModule),
  character('zrtva-3d', 'Žrtva', library, nudeVictimModule),
  character('bosi-zombi-3d', 'Bosi zombi', 'Graveyard Survival', zombieBarefootModule),
  character('zombi-policajac-3d', 'Zombi policajac', 'Graveyard Survival', zombieCopModule),
  character('zombi-doktor-3d', 'Zombi doktor', 'Graveyard Survival', zombieDoctorModule),
  character('zombi-doktor-koji-puzi-3d', 'Zombi doktor koji puzi', library, zombieDoctorCrawlModule),
  character('zombi-strazar-3d', 'Zombi stražar', 'Graveyard Survival', zombieGuardModule),
]

export const ww2 = [
  character('nemacki-bacac-plamena-3d', 'Nemački bacač plamena', 'FPS Base', germanFlameThrowerModule),
  character('nemacki-mitraljezac-3d', 'Nemački mitraljezac', '3D Tank, FPS Airport, FPS Base', germanMachineGunnerModule),
  character('nemacki-vojnik-3d', 'Nemački vojnik', library, germanSoldierModule),
  character('nacisticki-agent-3d', 'Nacistički agent', library, naziAgentModule),
  character('nacisticki-oficir-3d', 'Nacistički oficir', '3D Tank, FPS Airport, FPS Base', naziOfficerModule),
  character('partizan-3d', 'Partizan', 'Liberated City, Spomenici', partisanModule),
  character('partizan-koji-nisani-3d', 'Partizan koji nišani', 'Liberated City', partisanAimModule),
  character('partizan-jednostavan-model-3d', 'Partizan, jednostavan model', 'Liberated City', partisanLowpolyModule),
  character('borac-pokreta-otpora-3d', 'Borac pokreta otpora', 'Liberated City', resistanceFighterModule),
  character('ss-vojnik-3d', 'SS vojnik', '3D Tank, FPS Airport, FPS Base', sSSoldierModule),
  character('vojnik-3d', 'Vojnik', library, soldierModule),
  character('sovjetski-partizan-3d', 'Sovjetski partizan', 'Liberated City', sovietPartisanModule),
  character('radnik-3d', 'Radnik', 'Graffiti City, Graffiti City Maze', workerModule),
]

export const beasts = [
  character('slon-3d', 'Slon', library, elephantModule),
  character('flamingo-3d', 'Flamingo', 'RPG Fantasy', flamingoModule),
  character('tenk-3d', 'Tenk', 'FPS Airport', tankModule),
  character('cepelin-3d', 'Cepelin', 'RPG Fantasy', zeppelinModule),
]
