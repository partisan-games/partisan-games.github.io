import { NearestFilter, NearestMipmapLinearFilter } from 'three'
import Stage3D from '../Stage3D.js'
import TwoHandedGrip from '/core3d/actor/characters/TwoHandedGrip.js'
import dressFighter from '/core3d/actor/characters/dressFighter.js'
import { variants, infantryWeapons } from '/core3d/actor/derived/ww2/partisanLooks.js'
import * as italianLooksModule from '/core3d/actor/derived/ww2/italianLooks.js'
import { poseSurrender, surrenderArms } from '/core3d/actor/characters/surrenderPose.js'
import { loadedModel, requestModels } from '/core3d/assets/models.js'
import optimizeGeometry from '/core3d/assets/optimizeGeometry.js'
import makeCharacter, { makeCharacterBody } from '/core3d/actor/characters/makeCharacter.js'
import CharacterModel from '/core3d/actor/characters/CharacterModel.js'
import * as workerPipeModule from '/core3d/actor/derived/ww2/WorkerPipe.js'
import * as chetnikModule from '/core3d/actor/derived/ww2/Chetnik.js'
import * as subaraModule from '/core3d/actor/derived/ww2/ChetnikSubara.js'
import * as germanFlameThrowerModule from '/core3d/actor/derived/ww2/GermanFlameThrower.js'
import * as germanMachineGunnerModule from '/core3d/actor/derived/ww2/GermanMachineGunner.js'
import * as germanSoldierModule from '/core3d/actor/derived/ww2/GermanSoldier.js'
import * as naziAgentModule from '/core3d/actor/derived/ww2/NaziAgent.js'
import * as naziOfficerModule from '/core3d/actor/derived/ww2/NaziOfficer.js'
import * as partisanModule from '/core3d/actor/derived/ww2/Partisan.js'
import * as sutjeskaModule from '/core3d/actor/derived/ww2/sutjeskaLook.js'
import * as partisanLowpolyModule from '/core3d/actor/derived/ww2/PartisanLowpoly.js'
import * as resistanceFighterModule from '/core3d/actor/derived/ww2/ResistanceFighter.js'
import * as sSSoldierModule from '/core3d/actor/derived/ww2/SSSoldier.js'
import * as soldierModule from '/core3d/actor/derived/ww2/Soldier.js'
import * as sovietPartisanModule from '/core3d/actor/derived/ww2/SovietPartisan.js'
import * as nikoletinaModule from '/core3d/actor/derived/ww2/nikoletinaLook.js'
import * as workerModule from '/core3d/actor/derived/ww2/Worker.js'
import * as tankModule from '/core3d/actor/derived/Tank.js'
import * as hotchkissModule from '/core3d/actor/derived/Hotchkiss.js'

/** A character no game uses yet stays in the shared library, ready for one. */
const library = 'Zajednička biblioteka'
const { italianLooks } = italianLooksModule
const { mountMetalPipe, pipeSwingModel, smoothPipeSwing } = workerPipeModule
const sutjeskaLook = { id: 'sutjeska', name: 'Sutjeska', value: { dress: sutjeskaModule.default }, block: sutjeskaModule }
const sutjeskaPixelMaps = {
  '_1___Default': 'sutjeska-pixel-art/uniform.webp',
  Tex_0534_0_dds: 'sutjeska-pixel-art/face.webp',
  Tex_0532_0_dds: 'sutjeska-pixel-art/eyes.webp',
}
const sutjeskaPixelLook = { id: 'pixel-art', name: 'Pixel art', value: { dress(mesh, textures) {
  dressFighter(mesh, sutjeskaPixelMaps, textures)
  for (const file of Object.values(sutjeskaPixelMaps)) {
    const map = textures.get(file)
    if (!map) continue
    map.magFilter = NearestFilter
    map.minFilter = NearestMipmapLinearFilter
  }
} } }
const nikoletinaLook = { id: 'jugoslovenska', name: 'Jugosloven', value: { dress: sovietPartisanModule.description.dress },
  block: nikoletinaModule }
const nikoletinaPixelLook = { id: 'pixel-art', name: 'Pixel art', value: { dress: nikoletinaModule.dressNikoletinaPixelArt } }

/**
 * A story of a 3D character, with its model and weapon as its games have them. A 3D block needs its models loaded
 * before it is made. A character with a description is its body and model, with no controller, so a state it is set
 * to lasts until another is set; one without is still the earlier actor that the player leads.
 */
const character = (id, name, game, block, Character) => ({
  id, name, game, block, stage: Stage3D,
  create: async stage => {
    await requestModels(block.models, { parallelAnimations: true })
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

const plainWorker = character('radnik-3d', 'Radnik', library, workerModule)
const worker = {
  ...plainWorker,
  lookLabel: 'Oprema',
  looks: [
    { id: 'original', name: 'Goloruk', value: 'unarmed' },
    { id: 'cev', name: 'Cev', value: 'pipe', block: workerPipeModule, aliases: ['radnik-cev-3d'] },
  ],
  async create(stage, way, equipment) {
    if (equipment === 'unarmed') return plainWorker.create(stage, way)

    await requestModels([pipeSwingModel], { parallelAnimations: true })
    const mesh = loadedModel(pipeSwingModel)
    const { animDict } = pipeSwingModel
    const swing = smoothPipeSwing(mesh.userData.animations)
    const animations = mesh.userData.animations.map(clip => clip.name === swing.name ? swing : clip)
    const body = makeCharacterBody(mesh, animDict, {}, { actions: { attack: swing.duration } })
    const view = new CharacterModel(body, { mesh, animations, animDict })
    mountMetalPipe(view.mesh, { tipLength: .32 })
    stage.add(body, view)
    return body
  },
}

function infantryStory(id, name, game, block, portraitNames = {}) {
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
    ...base, lookLabel: 'Varijacije',
    create: async(stage, way, look) => {
      await requestModels([...block.models, ...looks.map(({ value }) => value.weapon.model)], { parallelAnimations: true })
      const { body, model } = makeCharacter({ ...block.description, dress: undefined })
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
  const baseLook = block === sovietPartisanModule ? nikoletinaLook
    : { id: 'original', name: block === partisanLowpolyModule ? 'Osnovna' : 'Maskirna' }
  const original = { ...story, looks: [baseLook],
    catalogGroup: ['Vojnici', id === 'vojnik-3d' ? 'Ostali' : 'Partizani'] }
  const identities = new Map()
  // Old links use the first equipment variant of each combat role as the story ID.
  const oldRoleIds = new Map()
  for (const look of looks) {
    const italian = look.id.startsWith('italian-')
    const { portrait, weapon } = look.value
    const army = italian ? 'Italijani' : 'Partizani'
    const oldRole = `${army}/${weapon === infantryWeapons.mg ? 'mg' : weapon === infantryWeapons.mp40 ? 'mp40' : 'rifle'}`
    if (!oldRoleIds.has(oldRole)) {
      const oldId = `${id}-${look.id}`
      oldRoleIds.set(oldRole, oldId)
      look.aliases.push(oldId)
    }
    look.aliases.push(`${id}/${look.id}`, `${oldRoleIds.get(oldRole)}/${look.id}`)

    if (portrait === undefined) {
      original.looks.push(look)
      continue
    }
    const identity = `${army}/${portrait}`
    if (!identities.has(identity)) identities.set(identity, {
      ...story, id: `${id}-${italian ? `italian-vojnik-${portrait + 1}` : 's-brkovima'}`,
      name: italian ? `Italijanski vojnik ${portrait + 1}` : portraitNames[portrait],
      catalogGroup: ['Vojnici', army], looks: [],
    })
    identities.get(identity).looks.push(look)
  }
  original.looks.sort((a, b) => Number(b.id === 'strelac') - Number(a.id === 'strelac'))
  if (block === partisanModule) original.looks.unshift(sutjeskaPixelLook, sutjeskaLook)
  if (block === sovietPartisanModule) original.looks.unshift(nikoletinaPixelLook)
  return [original, ...identities.values()]
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
    look?.dress?.(mesh, textures)
    if (look?.weapon) {
      dressFighter(mesh, look.outfit, textures, look.hatColor)
      if (look === variants.strelac) sutjeskaModule.enlargePartisanCapBadge(mesh)
      equipment = look.equip?.(mesh)
      anim.twoHandedWeapon = null
      grip = new TwoHandedGrip(mesh, look.weapon.model)
    } else anim.addTwoHandedWeapon(originalWeapon)
    optimizeGeometry(mesh)
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

const machineGunner = character('nemacki-mitraljezac-3d', 'Nemački vojnik s teškom opremom', '3D Tank, FPS Airport, FPS Base', germanMachineGunnerModule)
const flameThrower = character('nemacki-bacac-plamena-3d', 'Bacač plamena', 'FPS Base', germanFlameThrowerModule)
const germanHeavyInfantry = {
  ...machineGunner, lookLabel: 'Oprema', catalogGroup: ['Vojnici', 'Nemci'],
  looks: [
    { id: 'mitraljez', name: 'Mitraljez', value: machineGunner },
    { id: 'bacac-plamena', name: flameThrower.name, value: flameThrower, block: flameThrower.block, aliases: [flameThrower.id] },
  ],
  create(stage, way, equipment) {
    return equipment.create(stage, way)
  },
}

const [resistanceFighter, ...resistanceIdentities] = infantryStory(
  'borac-pokreta-otpora-3d', 'Drug Crni', 'Liberated City', resistanceFighterModule,
  { moustache: 'Brka' },
)
const workerFighter = {
  ...worker, name: resistanceFighter.name, game: resistanceFighter.game,
  catalogGroup: resistanceFighter.catalogGroup, lookLabel: 'Varijacije',
  looks: [
    { id: 'puska', name: 'Puška', block: resistanceFighter.block, aliases: [resistanceFighter.id, `${resistanceFighter.id}/original`] },
    ...worker.looks,
    ...resistanceFighter.looks.slice(1),
  ],
  async create(stage, way, equipment) {
    if (equipment === 'unarmed' || equipment === 'pipe') return worker.create(stage, way, equipment)
    const body = await resistanceFighter.create(stage, way, equipment)
    // Unarmed, pipe and rifle use different animation sets, so switching rebuilds the preview.
    delete stage.setLook
    return body
  },
}

export const ww2 = [
  germanHeavyInfantry,
  character('nemacki-vojnik-3d', 'Nemački vojnik', library, germanSoldierModule),
  character('nacisticki-agent-3d', 'Nacistički agent', library, naziAgentModule),
  character('nacisticki-oficir-3d', 'Nacistički oficir', '3D Tank, FPS Airport, FPS Base', naziOfficerModule),
  infantryStory('partizan-3d', 'Borac sa Sutjeske', 'Liberated City, Spomenici', partisanModule),
  infantryStory('partizan-jednostavan-model-3d', 'Savo', 'Liberated City', partisanLowpolyModule),
  workerFighter,
  ...resistanceIdentities,
  character('ss-vojnik-3d', 'SS vojnik', '3D Tank, FPS Airport, FPS Base', sSSoldierModule),
  infantryStory('vojnik-3d', 'Vojnik', library, soldierModule),
  infantryStory('sovjetski-partizan-3d', 'Nikoletina', 'Liberated City', sovietPartisanModule),
  { ...character('cetnik-strelac-3d', 'Četnik strelac', 'Siege of Kraljevo', chetnikModule), catalogGroup: ['Vojnici', 'Četnici'] },
  { ...character('cetnik-subara-3d', 'Četnik sa šubarom', 'Siege of Kraljevo', subaraModule), catalogGroup: ['Vojnici', 'Četnici'] },
].flat()

export const vehicles = [
  { ...character('tenk-3d', 'Renault FT', 'FPS Airport', tankModule), catalogGroup: ['Vozila'] },
  { ...character('hotchkiss-h35-3d', 'Hotchkiss H35', 'Siege of Kraljevo', hotchkissModule), catalogGroup: ['Vozila'] },
]
