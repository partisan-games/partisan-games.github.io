import Stage3D from '../Stage3D.js'
import { requestModels } from '/core3d/assets/models.js'
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
 * A story of a 3D character, the one the player leads, with its model and weapon as its games have them. A 3D block
 * needs its models loaded before it is made. It has no controller, so a state it is set to lasts until another is set.
 */
const character = (id, name, game, block, Character) => ({
  id, name, game, block, stage: Stage3D,
  create: async stage => {
    await requestModels(block.models)
    const actor = new Character({ controller: null })
    stage.add(actor)
    return actor
  },
})

export const fantasy = [
  character('varvarin-3d', 'Varvarin', 'RPG Fantasy', barbarianModule, barbarianModule.BarbarianPlayer),
  character('snezni-covek-3d', 'Snežni čovek', library, bigfootModule, bigfootModule.BigfootPlayer),
  character('demon-3d', 'Demon', 'Demon Forest', demonModule, demonModule.DemonPlayer),
  character('goblin-3d', 'Goblin', library, goblinModule, goblinModule.GoblinPlayer),
  character('golem-3d', 'Golem', 'Follow, Minas Tirith', golemModule, golemModule.GolemPlayer),
  character('gvozdeni-div-3d', 'Gvozdeni div', library, ironGiantModule, ironGiantModule.IronGiantPlayer),
  character('ork-3d', 'Ork', library, orcModule, orcModule.OrcPlayer),
  character('ork-div-3d', 'Ork div', library, orcOgreModule, orcOgreModule.OrcOgrePlayer),
  character('kostur-3d', 'Kostur', library, skeletonModule, skeletonModule.SkeletonPlayer),
  character('carobnica-3d', 'Čarobnica', 'Follow, Graveyard Survival, Walls', sorceressModule, sorceressModule.SorceressPlayer),
  character('trol-3d', 'Trol', library, trollModule, trollModule.TrollPlayer),
  character('vestica-3d', 'Veštica', 'Ruins', witchModule, witchModule.WitchPlayer),
  character('carobnjak-3d', 'Čarobnjak', library, wizardModule, wizardModule.WizardPlayer),
]

export const horror = [
  character('duh-3d', 'Duh', 'Graveyard Survival', ghostModule, ghostModule.GhostPlayer),
  character('gotska-devojka-3d', 'Gotska devojka', 'Graveyard Survival', gothGirlModule, gothGirlModule.GothGirlPlayer),
  character('zrtva-3d', 'Žrtva', library, nudeVictimModule, nudeVictimModule.NudeVictimPlayer),
  character('bosi-zombi-3d', 'Bosi zombi', 'Graveyard Survival', zombieBarefootModule, zombieBarefootModule.ZombieBarefootPlayer),
  character('zombi-policajac-3d', 'Zombi policajac', 'Graveyard Survival', zombieCopModule, zombieCopModule.ZombieCopPlayer),
  character('zombi-doktor-3d', 'Zombi doktor', 'Graveyard Survival', zombieDoctorModule, zombieDoctorModule.ZombieDoctorPlayer),
  character('zombi-doktor-koji-puzi-3d', 'Zombi doktor koji puzi', library, zombieDoctorCrawlModule, zombieDoctorCrawlModule.ZombieDoctorCrawlPlayer),
  character('zombi-strazar-3d', 'Zombi stražar', 'Graveyard Survival', zombieGuardModule, zombieGuardModule.ZombieGuardPlayer),
]

export const ww2 = [
  character('nemacki-bacac-plamena-3d', 'Nemački bacač plamena', 'FPS Base', germanFlameThrowerModule, germanFlameThrowerModule.GermanFlameThrowerPlayer),
  character('nemacki-mitraljezac-3d', 'Nemački mitraljezac', '3D Tank, FPS Airport, FPS Base', germanMachineGunnerModule, germanMachineGunnerModule.GermanMachineGunnerPlayer),
  character('nemacki-vojnik-3d', 'Nemački vojnik', library, germanSoldierModule, germanSoldierModule.GermanSoldierPlayer),
  character('nacisticki-agent-3d', 'Nacistički agent', library, naziAgentModule, naziAgentModule.NaziAgentPlayer),
  character('nacisticki-oficir-3d', 'Nacistički oficir', '3D Tank, FPS Airport, FPS Base', naziOfficerModule, naziOfficerModule.NaziOfficerPlayer),
  character('partizan-3d', 'Partizan', 'Liberated City, Spomenici', partisanModule, partisanModule.PartisanPlayer),
  character('partizan-koji-nisani-3d', 'Partizan koji nišani', 'Liberated City', partisanAimModule, partisanAimModule.PartisanAimPlayer),
  character('partizan-jednostavan-model-3d', 'Partizan, jednostavan model', 'Liberated City', partisanLowpolyModule, partisanLowpolyModule.PartisanLowpolyPlayer),
  character('borac-pokreta-otpora-3d', 'Borac pokreta otpora', 'Liberated City', resistanceFighterModule, resistanceFighterModule.ResistanceFighterPlayer),
  character('ss-vojnik-3d', 'SS vojnik', '3D Tank, FPS Airport, FPS Base', sSSoldierModule, sSSoldierModule.SSSoldierPlayer),
  character('vojnik-3d', 'Vojnik', library, soldierModule, soldierModule.SoldierPlayer),
  character('sovjetski-partizan-3d', 'Sovjetski partizan', 'Liberated City', sovietPartisanModule, sovietPartisanModule.SovietPartisanPlayer),
  character('radnik-3d', 'Radnik', 'Graffiti City, Graffiti City Maze', workerModule, workerModule.WorkerPlayer),
]

export const beasts = [
  character('slon-3d', 'Slon', library, elephantModule, elephantModule.ElephantPlayer),
  character('flamingo-3d', 'Flamingo', 'RPG Fantasy', flamingoModule, flamingoModule.FlamingoPlayer),
  character('tenk-3d', 'Tenk', 'FPS Airport', tankModule, tankModule.TankPlayer),
  character('cepelin-3d', 'Cepelin', 'RPG Fantasy', zeppelinModule, zeppelinModule.ZeppelinPlayer),
]
