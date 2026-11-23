import Stage3D from '../Stage3D.js'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { variants, infantryWeapons } from '/core3d/actor/derived/ww2/partisanLooks.js'
import * as italianLooksModule from '/core3d/actor/derived/ww2/italianLooks.js'
import { poseSurrender, surrenderArms } from '/core3d/actor/characters/surrenderPose.js'
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
const { italianLooks } = italianLooksModule

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

function infantryStory(id, name, game, block) {
  const base = character(id, name, game + ', Battle for Jablanica', block)
  const source = block.description.model
  const choices = [
    ...Object.entries(variants).map(([id, value]) => ({ id, value, army: 'partisan' })),
    ...Object.entries(italianLooks).map(([id, value]) => ({ id, value, army: 'italian' })),
  ]
  const looks = choices
    .filter(({ value }) => value.model.file === source.file && value.model.prefix === source.prefix)
    .map(({ id, value, army }) => {
      if (army === 'italian') return { id: 'italian-' + id, name: value.name, value,
        aliases: ['italijanski-branilac-3d/' + id, ...(id === 'rifle' ? ['italijanski-branilac-3d'] : [])] }
      const oldStory = 'jablanica-' + ({ oker: 'vuna', brkovi: 'indigo' }[id] ?? id)
      const aliases = ['partizan-3d/' + id, 'saborci-jablanica/' + id, oldStory + '/' + id]
      if (oldStory === 'jablanica-' + id) aliases.push(oldStory)
      if (id === 'strelac') aliases.push('saborci-jablanica')
      return { id, name: value.name, value, aliases }
    })
  const story = {
    ...base, lookLabel: 'Varijanta',
    looks: [{ id: 'original', name: 'Original' }, ...looks],
    create: async(stage, way, look) => {
      await requestModels([...block.models, ...looks.map(({ value }) => value.weapon.model)])
      const { body, model } = makeCharacter(block.description)
      stage.add(body, model)
      const infantry = enableInfantryLooks(stage, model)
      const arms = surrenderArms(model.mesh)
      let surrendered = false
      const act = body.act.bind(body)
      Object.defineProperty(body, 'acts', { value: [...body.acts, 'surrender'] })
      body.act = action => {
        if (action !== 'surrender') return surrendered ? undefined : act(action)
        surrendered = true
        infantry.unarm()
      }
      const { setLook } = stage
      stage.setLook = next => {
        setLook(next)
        if (surrendered) infantry.unarm()
      }
      stage.add({ update: () => surrendered && poseSurrender(model.mesh, model.mesh, arms) })
      stage.setLook(look)
      return body
    },
  }
  const roles = new Map()
  const original = { ...story, looks: [story.looks[0]],
    catalogGroup: ['Vojnici', id === 'vojnik-3d' ? 'Ostali' : id === 'sovjetski-partizan-3d' ? 'Sovjetski' : 'Partizanski'] }
  for (const look of looks) {
    const army = look.id.startsWith('italian-') ? 'Italijanski' : 'Partizanski'
    const role = look.value.weapon === infantryWeapons.mg ? 'Mitraljezac'
      : look.value.weapon === infantryWeapons.mp40 ? 'Automatičar' : 'Strelac'
    const key = army + '/' + role
    if (!roles.has(key)) roles.set(key, { ...story, id: `${id}-${look.id}`, name: `${army} ${role.toLowerCase()} · ${name}`,
      catalogGroup: ['Vojnici', army], looks: [] })
    roles.get(key).looks.push({ ...look, aliases: [...look.aliases, `${id}/${look.id}`] })
  }
  // The original appearance belongs to the same rifleman when identity and role agree.
  const rifleman = id === 'vojnik-3d' || id === 'sovjetski-partizan-3d' ? null : roles.get('Partizanski/Strelac')
  if (rifleman) {
    original.looks.push(...rifleman.looks)
    roles.delete('Partizanski/Strelac')
  }
  return [original, ...roles.values()]
}

function enableInfantryLooks(stage, { mesh, anim }) {
  const originalWeapon = anim.twoHandedWeapon
  originalWeapon.removeFromParent()
  const parts = []
  mesh.traverse(part => {
    if (part.isMesh) parts.push({ part, material: part.material, geometry: part.geometry })
  })
  const textures = new Map()
  const originals = new Set(parts.flatMap(({ material }) => material))
  let grip, equipment
  stage.setLook = look => {
    originalWeapon.removeFromParent()
    grip?.rifle.removeFromParent()
    equipment?.removeFromParent()
    grip = null
    for (const { part, material, geometry } of parts) {
      for (const current of [].concat(part.material))
        if (!originals.has(current)) current.dispose()
      if (part.geometry !== geometry) part.geometry.dispose()
      part.material = material
      part.geometry = geometry
    }
    if (look) {
      dressFighter(mesh, look.outfit, textures, look.hatColor)
      equipment = look.equip?.(mesh)
      anim.twoHandedWeapon = null
      grip = new TwoHandedGrip(mesh, look.weapon.model)
    } else anim.addTwoHandedWeapon(originalWeapon)
  }
  stage.add({ update: () => {
    if (grip?.rifle.parent) grip.fitHands()
  } })
  stage.session.scope.add(() => textures.forEach(texture => texture.dispose()))
  return {
    unarm() {
      anim.twoHandedWeapon?.removeFromParent()
      grip?.rifle.removeFromParent()
      anim.twoHandedWeapon = null
    },
  }
}

export const ww2 = [
  character('nemacki-bacac-plamena-3d', 'Nemački bacač plamena', 'FPS Base', germanFlameThrowerModule),
  character('nemacki-mitraljezac-3d', 'Nemački mitraljezac', '3D Tank, FPS Airport, FPS Base', germanMachineGunnerModule),
  character('nemacki-vojnik-3d', 'Nemački vojnik', library, germanSoldierModule),
  character('nacisticki-agent-3d', 'Nacistički agent', library, naziAgentModule),
  character('nacisticki-oficir-3d', 'Nacistički oficir', '3D Tank, FPS Airport, FPS Base', naziOfficerModule),
  infantryStory('partizan-3d', 'Partizan', 'Liberated City, Spomenici', partisanModule),
  infantryStory('partizan-jednostavan-model-3d', 'Partizan, jednostavan model', 'Liberated City', partisanLowpolyModule),
  infantryStory('borac-pokreta-otpora-3d', 'Borac pokreta otpora', 'Liberated City', resistanceFighterModule),
  character('ss-vojnik-3d', 'SS vojnik', '3D Tank, FPS Airport, FPS Base', sSSoldierModule),
  infantryStory('vojnik-3d', 'Vojnik', library, soldierModule),
  infantryStory('sovjetski-partizan-3d', 'Sovjetski partizan', 'Liberated City', sovietPartisanModule),
  character('radnik-3d', 'Radnik', 'Graffiti City, Graffiti City Maze', workerModule),
].flat()

export const beasts = [
  character('slon-3d', 'Slon', library, elephantModule),
  character('flamingo-3d', 'Flamingo', 'RPG Fantasy', flamingoModule),
  character('tenk-3d', 'Tenk', 'FPS Airport', tankModule),
  character('cepelin-3d', 'Cepelin', 'RPG Fantasy', zeppelinModule),
]
